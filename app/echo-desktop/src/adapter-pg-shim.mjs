import { AsyncLocalStorage } from 'node:async_hooks'

import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { PrismaPGlite } from 'pglite-prisma-adapter'

/**
 * Drop-in replacement for `@prisma/adapter-pg`, backed by embedded PGlite.
 * PGlite is single-connection, so interactive transactions are serialized
 * through a FIFO gate, and a main-client query issued from inside a
 * $transaction callback (marked via AsyncLocalStorage by prisma-client-wrap)
 * fails loudly — that is an upstream bug that escapes atomicity on pooled
 * Postgres and self-deadlocks on PGlite.
 */
export const interactiveTransactionContext = new AsyncLocalStorage()

const LEAKED_TRANSACTION_TIMEOUT_MS = 60_000

function serializeTransactions(adapter) {
	let tail = Promise.resolve()
	let transactionOpen = false

	const guarded = (method) => async (query) => {
		if (transactionOpen && interactiveTransactionContext.getStore()) {
			throw new Error(
				'[echo-desktop] query issued from inside a $transaction callback without the transaction ' +
					'client — this escapes atomicity on the cloud deployment and deadlocks on PGlite. ' +
					'Pass the tx client to the query (upstream bug).',
			)
		}
		return adapter[method](query)
	}

	const wrapped = Object.create(adapter)
	wrapped.queryRaw = guarded('queryRaw')
	wrapped.executeRaw = guarded('executeRaw')

	wrapped.startTransaction = (...args) => {
		let release
		const gate = new Promise((resolve) => {
			release = resolve
		})
		const myTurn = tail
		tail = tail.then(() => gate)

		return (async () => {
			await myTurn
			let transaction = null
			let finished = false
			const finish = () => {
				finished = true
				transactionOpen = false
				clearTimeout(watchdog)
				release()
			}
			const watchdog = setTimeout(() => {
				if (finished) return
				console.warn('[echo-desktop] transaction held for 60s without commit/rollback, forcing rollback')
				finish()
				transaction?.rollback().catch(() => undefined)
			}, LEAKED_TRANSACTION_TIMEOUT_MS)

			try {
				transaction = await adapter.startTransaction(...args)
				transactionOpen = true
				const wrappedTransaction = Object.create(transaction)
				wrappedTransaction.commit = async () => {
					try {
						return await transaction.commit()
					} finally {
						finish()
					}
				}
				wrappedTransaction.rollback = async () => {
					try {
						return await transaction.rollback()
					} finally {
						finish()
					}
				}
				return wrappedTransaction
			} catch (error) {
				finish()
				throw error
			}
		})()
	}
	return wrapped
}

export class PrismaPg {
	constructor(_config) {
		const dataDir = process.env.NEVERKIN_PGDATA
		if (!dataDir) {
			throw new Error(
				'[echo-desktop] NEVERKIN_PGDATA is not set; the launcher must configure it before Rhea starts',
			)
		}
		const factory = new PrismaPGlite(new PGlite(dataDir, { extensions: { pg_trgm } }))
		const wrappedFactory = Object.create(factory)
		wrappedFactory.connect = async () => serializeTransactions(await factory.connect())
		return wrappedFactory
	}
}
