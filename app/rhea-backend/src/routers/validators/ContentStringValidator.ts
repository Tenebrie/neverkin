import { RequiredParam } from 'moonflower'

import { MAX_CONTENT_LENGTH } from '../../ts-shared/const/constants.js'

export const ContentStringValidator = RequiredParam({
	parse: (v) => String(v).trim(),
	validate: (v) => v.length <= MAX_CONTENT_LENGTH,
	description: `Any string value up to ${MAX_CONTENT_LENGTH} characters long`,
	errorMessage: `Must be at most ${MAX_CONTENT_LENGTH} characters long`,
})
