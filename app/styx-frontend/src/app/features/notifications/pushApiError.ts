import { parseApiResponse } from '@/app/utils/parseApiResponse'

import { dispatchGlobalEvent } from '../eventBus'

export function pushApiError(params: NonNullable<ReturnType<typeof parseApiResponse>['error']>) {
	dispatchGlobalEvent['notifications/push']({
		message: `API Error ${params.status}: ${params.message}`,
		severity: 'error',
	})
}
