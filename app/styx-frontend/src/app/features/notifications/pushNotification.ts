import { dispatchGlobalEvent } from '../eventBus'
import { EventParams } from '../eventBus/types'

export function pushNotification(params: EventParams['notifications/push']) {
	dispatchGlobalEvent['notifications/push'](params)
}
