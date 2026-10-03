import { Context, use } from 'react'

export function useRealtimeContext<T extends object>(realtimeContext: { context: Context<T | null> }): T {
	const value = use(realtimeContext.context)
	if (!value) {
		throw new Error('useRealtimeContext called outside its provider')
	}
	return value
}
