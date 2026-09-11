import { duplicateNames } from './rules/duplicateNames'
import { emptyContent } from './rules/emptyContent'
import { unmentionedTags } from './rules/unmentionedTags'
import { WikiLintRule } from './WikiLintRule'

export const WIKI_LINT_RULES: WikiLintRule[] = [unmentionedTags, duplicateNames, emptyContent]
