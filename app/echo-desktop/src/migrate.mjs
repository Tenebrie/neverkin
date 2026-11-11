import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

/**
 * Pre-boot database preparation: replays Rhea's migration history into the
 * embedded PGlite database (with `_prisma_migrations` bookkeeping), then
 * seeds it. Closes the database before Rhea's own PGlite opens it.
 * An existing database is snapshotted before any pending migration runs and
 * rolled back to that snapshot if the update fails.
 */

// Precomputed bcrypt(12) of 'q'.
const SEED_ADMIN_PASSWORD_HASH = '$2b$12$yOVLWhUtcIgyLxs0Z0TIZekbZAtqmSfVmz7o1DakZu3Q/Lp/KVMYK'
const KEPT_BACKUPS = 5

export async function prepareDatabase({ migrationsDir, dataDir, backupDir }) {
	const db = new PGlite(dataDir, { extensions: { pg_trgm } })
	let backupPath = null
	try {
		const { total, pending } = await findPendingMigrations(db, migrationsDir)
		const isExistingDatabase = pending.length < total
		if (pending.length > 0 && isExistingDatabase) {
			backupPath = await backupDatabase(db, backupDir, pending[0])
		}
		for (const migration of pending) {
			await applyMigration(db, migrationsDir, migration)
		}
		await seedDatabase(db)
		return { total, applied: pending.length }
	} catch (error) {
		if (!backupPath) throw error
		await db.close()
		const failedDir = await restoreDatabase({ dataDir, backupDir, backupPath })
		throw new Error(
			`[echo-desktop] database update failed and was rolled back to ${basename(backupPath)}; ` +
				`the failed copy is kept at ${failedDir}\n${error.message}`,
		)
	} finally {
		if (!db.closed) await db.close()
	}
}

async function seedDatabase(db) {
	const seeded = await db.query(`SELECT 1 FROM "Flags" WHERE "value" = 'DatabaseSeeded'`)
	if (seeded.rows.length > 0) return

	await db.query(
		`INSERT INTO "User" ("id", "email", "username", "password", "level")
			VALUES ($1, 'admin@localhost', 'Administrator', $2, 'Admin')
			ON CONFLICT ("email") DO NOTHING`,
		[randomUUID(), SEED_ADMIN_PASSWORD_HASH],
	)
	await db.query(`INSERT INTO "Flags" ("value") VALUES ('DatabaseSeeded')`)
	console.info('[echo-desktop] seeded default admin account (admin@localhost)')
}

async function findPendingMigrations(db, migrationsDir) {
	await db.exec(`
		CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
			"id" VARCHAR(36) PRIMARY KEY NOT NULL,
			"checksum" VARCHAR(64) NOT NULL,
			"finished_at" TIMESTAMPTZ,
			"migration_name" VARCHAR(255) NOT NULL,
			"logs" TEXT,
			"rolled_back_at" TIMESTAMPTZ,
			"started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
			"applied_steps_count" INTEGER NOT NULL DEFAULT 0
		)
	`)
	const appliedRows = await db.query(
		'SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL',
	)
	const applied = new Set(appliedRows.rows.map((row) => row.migration_name))

	const migrations = readdirSync(migrationsDir)
		.filter((entry) => existsSync(join(migrationsDir, entry, 'migration.sql')))
		.sort()
	return { total: migrations.length, pending: migrations.filter((migration) => !applied.has(migration)) }
}

async function applyMigration(db, migrationsDir, migration) {
	const sql = readFileSync(join(migrationsDir, migration, 'migration.sql'), 'utf8')
	try {
		await db.exec(sql)
	} catch (error) {
		// Some DDL forms refuse to run in exec's implicit transaction
		await applyStatementByStatement(db, sql, migration, error)
	}
	await db.query(
		'INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count") VALUES ($1, $2, now(), $3, 1)',
		[randomUUID(), createHash('sha256').update(sql).digest('hex'), migration],
	)
}

async function backupDatabase(db, backupDir, nextMigration) {
	mkdirSync(backupDir, { recursive: true })
	const backupPath = join(backupDir, `${fileTimestamp()}-before-${nextMigration}.tar.gz`)
	const dump = await db.dumpDataDir('gzip')
	writeFileSync(backupPath, Buffer.from(await dump.arrayBuffer()))
	console.info(`[echo-desktop] database backed up to ${backupPath}`)

	const backups = readdirSync(backupDir).sort()
	for (const expired of backups.slice(0, -KEPT_BACKUPS)) {
		rmSync(join(backupDir, expired), { recursive: true, force: true })
	}
	return backupPath
}

async function restoreDatabase({ dataDir, backupDir, backupPath }) {
	const restoredDir = `${dataDir}-restored`
	rmSync(restoredDir, { recursive: true, force: true })
	const restored = await PGlite.create(restoredDir, {
		extensions: { pg_trgm },
		loadDataDir: new Blob([readFileSync(backupPath)]),
	})
	await restored.close()

	const failedDir = join(backupDir, `${fileTimestamp()}-failed-update`)
	renameSync(dataDir, failedDir)
	renameSync(restoredDir, dataDir)
	return failedDir
}

async function applyStatementByStatement(db, sql, migration, originalError) {
	console.warn(
		`[echo-desktop] migration ${migration}: batch apply failed (${originalError.message}), retrying statement-by-statement`,
	)
	// Comments must be stripped per line — Prisma prefixes every statement
	// with one, so a chunk-level filter would discard the statement itself
	const statements = sql
		.split(/;\s*[\r\n]/)
		.map((chunk) =>
			chunk
				.split('\n')
				.filter((line) => !line.trim().startsWith('--'))
				.join('\n')
				.trim(),
		)
		.filter((statement) => statement.length > 0)
	if (statements.length === 0) {
		throw new Error(`[echo-desktop] migration ${migration}: fallback found no executable statements`)
	}
	for (const statement of statements) {
		try {
			await db.exec(statement)
		} catch (error) {
			throw new Error(
				`[echo-desktop] migration ${migration} failed on statement: ${statement.slice(0, 200)}\n${error.message}`,
			)
		}
	}
}

function fileTimestamp() {
	return new Date().toISOString().replaceAll(':', '-')
}
