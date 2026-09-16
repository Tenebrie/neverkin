import { isEchoDesktop } from '@/app/utils/isEchoDesktop'

export function getDocsUrl(path: string = '') {
	const base = isEchoDesktop
		? 'https://neverkin.com/docs'
		: `${window.location.origin.replace('//app.', '//')}/docs`

	return `${base}${path}`
}
