import { Prisma, PrismaClient } from '@prisma/client'
import internals from '@prisma/internals'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import createPrismaMock from 'prisma-mock/client'
import { beforeEach } from 'vitest'

import { prismaMockRef } from './prismaMock.js'

const { getDMMF } = internals

type Datamodel = Awaited<ReturnType<typeof getDMMF>>['datamodel']

const SCHEMA_DIR = 'prisma/schema'
const ROOT_SCHEMA = 'prisma/schema.prisma'

let datamodel: Promise<Datamodel> | undefined

export function setupMockDatabase() {
	beforeEach(async () => {
		prismaMockRef.current = createPrismaMock.default(Prisma, {
			datamodel: await loadDatamodel(),
		})
	})

	return new Proxy({} as PrismaClient, {
		get: (_target, property) => {
			const value = Reflect.get(prismaMockRef.current, property)
			return typeof value === 'function' ? value.bind(prismaMockRef.current) : value
		},
	})
}

function loadDatamodel() {
	if (!datamodel) {
		const sources = [
			readFileSync(ROOT_SCHEMA, 'utf-8'),
			...readdirSync(SCHEMA_DIR)
				.filter((file) => file.endsWith('.prisma'))
				.map((file) => readFileSync(join(SCHEMA_DIR, file), 'utf-8')),
		]
		datamodel = getDMMF({ datamodel: sources.join('\n') }).then((dmmf) => dmmf.datamodel)
	}
	return datamodel
}
