import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack'
import path from 'path'

const tanstackTempDir = process.env.TSR_TMP_DIR || path.resolve('node_modules/.tanstack')

export default defineConfig({
	source: {
		assetsInclude: /\.(vert|frag)$/,
		define: {
			__APP_VERSION__: JSON.stringify(process.env.VERSION ?? 'Dev'),
			__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		},
		entry: {
			index: './src/main.tsx',
		},
	},
	html: {
		template: './index.html',
	},
	resolve: {
		dedupe: [
			'@tiptap/core',
			'@tiptap/pm',
			'@tiptap/react',
			'prosemirror-state',
			'prosemirror-view',
			'prosemirror-model',
			'prosemirror-transform',
			'prosemirror-keymap',
			'prosemirror-gapcursor',
			'prosemirror-tables',
			'yjs',
			'y-protocols',
			'zod',
		],
	},
	plugins: [pluginReact()],
	tools: {
		rspack: {
			plugins: [TanStackRouterRspack({ autoCodeSplitting: false, tmpDir: tanstackTempDir })],
			resolve: {
				symlinks: false,
				alias: {
					'prosemirror-state$': require.resolve('prosemirror-state'),
					'prosemirror-view$': require.resolve('prosemirror-view'),
					'prosemirror-model$': require.resolve('prosemirror-model'),
					'prosemirror-transform$': require.resolve('prosemirror-transform'),
					'prosemirror-keymap$': require.resolve('prosemirror-keymap'),
					'prosemirror-gapcursor$': require.resolve('prosemirror-gapcursor'),
					'prosemirror-tables$': require.resolve('prosemirror-tables'),
				},
			},
			watchOptions: {
				ignored: /node_modules\/(?!@neverkin)/,
			},
		},
	},
	server: {
		port: 8080,
		host: '0.0.0.0',
	},
	dev: {
		client: {
			host: 'app.localhost',
			port: 8080,
			protocol: 'ws',
		},
	},
	output: {
		distPath: { root: 'build' },
	},
})
