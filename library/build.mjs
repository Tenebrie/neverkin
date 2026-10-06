import { execSync, spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const libraryDir = path.dirname(fileURLToPath(import.meta.url))

// Prebuild all libraries once
execSync(`${process.execPath} ${path.join(libraryDir, 'ci-build.mjs')}`, { stdio: 'inherit' })

// Watch the libraries for changes
for (const entry of readdirSync(libraryDir, { withFileTypes: true })) {
	if (!entry.isDirectory()) continue
	const cwd = path.join(libraryDir, entry.name)
	const tsc = path.join(cwd, 'node_modules', 'typescript', 'bin', 'tsc')
	if (!existsSync(tsc)) {
		console.info(`[library-build] skipping ${entry.name} due to missing typescript`)
		continue
	}
	if (!existsSync(path.join(cwd, 'tsconfig.json'))) {
		console.info(`[library-build] skipping ${entry.name} due to missing tsconfig.json`)
		continue
	}
	console.info(`[library-build] watching ${entry.name}`)
	const child = spawn(process.execPath, [tsc, '-b', '--watch', '--preserveWatchOutput'], {
		cwd,
		stdio: 'inherit',
	})
	child.on('error', (err) => console.error(`[library-build] failed to start ${entry.name}:`, err))
	child.on('exit', (code) => {
		if (code !== 0) console.error(`[library-build] watcher for ${entry.name} exited with code ${code}`)
	})
}
