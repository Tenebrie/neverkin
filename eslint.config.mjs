import eslintReact from '@eslint-react/eslint-plugin'
import astroEslintParser from 'astro-eslint-parser'
import { defineConfig } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginAstro from 'eslint-plugin-astro'
import muiPathImports from 'eslint-plugin-mui-path-imports'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

import noDirectContextAccess from './eslint-rules/no-direct-context-access.mjs'
import noUntypedLocalPaths from './eslint-rules/no-untyped-local-paths.mjs'

export default defineConfig(
	{
		ignores: [
			'app/calliope-websockets/dist',
			'app/rhea-backend/dist',
			'app/rhea-backend/prisma',
			'app/styx-frontend/build',
			'app/orpheus-mcp/dist',
			'app/ts-shared/dist',
			'library/tiptap-schema/dist',
			'app/thetis-landing/dist',
			'app/thetis-landing/.astro',
			'test/e2e/dist',
			'*.gen.ts',
			'node_modules',
			'.husky',
			'app/thetis-landing/src/components/common/BasicScripts.astro',
			'app/thetis-landing/src/components/common/ApplyColorMode.astro',
			'library/openapi-fetch/src/rhea-api.ts',
			'library/**/dist',
		],
	},
	{
		extends: [...tseslint.configs.recommended],
		files: ['**/*.json'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off',
		},
	},
	{
		extends: [tseslint.configs.recommended],
		files: ['**/*.{mjs,js,ts,tsx}'],
		plugins: {
			'simple-import-sort': simpleImportSort,
			'unused-imports': unusedImports,
			// 'no-relative-import-paths': noRelativeImportPaths,
			'mui-path-imports': muiPathImports,
		},
		rules: {
			'linebreak-style': ['error', 'unix'],
			'no-tabs': 'off',
			'no-trailing-spaces': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'object-curly-spacing': 'off',
			'no-case-declarations': 'off',
			'space-before-function-paren': 'off',
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'unused-imports/no-unused-imports': 'error',
			'mui-path-imports/mui-path-imports': 'error',
			'@typescript-eslint/no-unused-vars': 'off',

			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
		},
	},
	{
		// Local paths go through the typed router
		files: ['app/styx-frontend/src/**/*.{ts,tsx}'],
		ignores: ['app/styx-frontend/src/api/**'],
		plugins: {
			neverkin: {
				rules: {
					'no-untyped-local-paths': noUntypedLocalPaths,
				},
			},
		},
		rules: {
			'neverkin/no-untyped-local-paths': 'error',
		},
	},
	{
		// Custom rules for rhea-backend to enforce moonflower patterns
		files: ['app/rhea-backend/src/routers/**/*.ts'],
		plugins: {
			neverkin: {
				rules: {
					'no-direct-context-access': noDirectContextAccess,
				},
			},
		},
		rules: {
			'neverkin/no-direct-context-access': 'warn',
		},
	},
	{
		ignores: ['app/rhea-backend/**'],
		extends: [eslintReact.configs['recommended-typescript']],
		rules: {
			// 'react-hooks/set-state-in-effect': 'off',
			// 'react-hooks/refs': 'off',
			// 'react-hooks/immutability': 'off',
			// 'react-hooks/preserve-manual-memoization': 'off',
			// 'react/prop-types': 'off',
			'@eslint-react/no-array-index-key': 'off',
			'@eslint-react/purity': 'off',
			'@eslint-react/use-state': 'off',
			'@eslint-react/no-unnecessary-use-prefix': 'off',
			'@eslint-react/set-state-in-effect': 'off',
			'@eslint-react/naming-convention-ref-name': 'off',
			'@eslint-react/no-create-ref': 'off',
		},
		files: ['**/*.{ts,tsx}'],
		settings: {
			react: {
				version: '19.x',
			},
		},
	},
	...eslintPluginAstro.configs['flat/recommended'],
	{
		files: ['app/thetis-landing/**/*.astro'],
		ignores: [
			'app/thetis-landing/src/components/common/BasicScripts.astro',
			'app/thetis-landing/src/components/common/Image.astro',
		],
		languageOptions: {
			parser: astroEslintParser,
			parserOptions: {
				parser: '@typescript-eslint/parser',
				extraFileExtensions: ['.astro'],
			},
		},
	},
	eslintConfigPrettier,
	eslintPluginPrettierRecommended,
	{
		files: ['**/*.astro/*.js', '**/*.astro/*.ts'],
		rules: {
			'prettier/prettier': 'off',
		},
	},
)
