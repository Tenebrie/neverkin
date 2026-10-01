import z from 'zod'

export const EntityNameSchema = z
	.union([z.string(), z.number(), z.boolean()])
	.transform(String)
	.pipe(z.string().max(4096))
