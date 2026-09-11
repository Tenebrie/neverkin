export const baseUrl = (() => {
	const env = process.env.TARGET_ENV ?? 'local_ui'
	if (env === 'prod') {
		return 'https://app.neverkin.com'
	} else if (env === 'staging') {
		return 'https://app.staging.neverkin.com'
	} else if (env === 'local' || env === 'ci') {
		return 'http://app.gatekeeper:80'
	} else if (env === 'local_ui') {
		return 'http://app.localhost'
	} else if (env === 'desktop') {
		return process.env.DESKTOP_URL ?? 'http://127.0.0.1:8190'
	}
	throw new Error(`Unknown TARGET_ENV: ${env}`)
})()

export function makeUrl(path: string) {
	if (path.startsWith('/')) {
		return `${baseUrl}${path}`
	} else {
		return `${baseUrl}/${path}`
	}
}

/** Matches `isMultiselectEvent` in the app: macOS multi-selects with Meta, other platforms with Control. */
export const multiselectModifier = process.platform === 'darwin' ? 'Meta' : 'Control'
