import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

const [script, ...args] = process.argv.slice(2)
const selectors = args.filter((arg) => !arg.startsWith('-'))
const passthroughArgs = args.filter((arg) => arg.startsWith('-'))
const { subPackages } = JSON.parse(readFileSync('package.json', 'utf8'))

function matches(pkg, selector) {
	const pattern = selector.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')
	return new RegExp(`^${pattern}$`).test(pkg)
}

const targets = selectors.length
	? subPackages.filter((pkg) => selectors.some((selector) => matches(pkg, selector)))
	: subPackages

const npmArgs = script === 'install' ? ['install'] : ['run', script, '--if-present', '--', ...passthroughArgs]

function run(pkg) {
	return new Promise((resolve) => {
		const chunks = []
		const child = spawn('npm', npmArgs, {
			cwd: pkg,
			env: { ...process.env, FORCE_COLOR: '1' },
			shell: process.platform === 'win32',
		})
		// Push stdout and stderr into one buffer in arrival order to preserve the
		// process's output exactly, then flush it as a single contiguous block on exit.
		child.stdout.on('data', (chunk) => chunks.push(chunk))
		child.stderr.on('data', (chunk) => chunks.push(chunk))
		child.on('close', (code) => {
			const header = Buffer.from(`\n\x1b[36m── ${pkg}\x1b[0m (exit ${code ?? 1})\n`)
			process.stdout.write(Buffer.concat([header, ...chunks]))
			resolve(code ?? 1)
		})
	})
}

console.info(`Running \x1b[36m${script}\x1b[0m for ${targets.length} packages in parallel...`)
const codes = await Promise.all(targets.map(run))
process.exit(codes.find((code) => code !== 0) ?? 0)
