import type { BoxedMindmapNode, BoxedMindmapWire } from '../hooks/useBoxedMindmapContent'

type Listener = () => void

/**
 * Keyed store that notifies only the listeners of the keys that actually changed. A mindmap has one
 * subscriber per node and one per wire, so a single moved node must wake exactly one of them -
 * broadcasting instead would cost a callback per node on every edit.
 */
export type EntityStore<T> = ReturnType<typeof createEntityStore<T>>

export function createEntityStore<T>() {
	let items = new Map<string, T>()
	let ids: string[] = []
	const listeners = new Map<string, Set<Listener>>()
	const idListeners = new Set<Listener>()

	const subscribe = (id: string, listener: Listener) => {
		const set = listeners.get(id) ?? new Set<Listener>()
		set.add(listener)
		listeners.set(id, set)
		return () => {
			set.delete(listener)
			if (set.size === 0) {
				listeners.delete(id)
			}
		}
	}

	const subscribeToIds = (listener: Listener) => {
		idListeners.add(listener)
		return () => {
			idListeners.delete(listener)
		}
	}

	const replace = (nextItems: Map<string, T>) => {
		const nextIds = [...nextItems.keys()]
		const idsChanged = nextIds.length !== ids.length || nextIds.some((id, index) => id !== ids[index])

		const changedIds: string[] = []
		for (const [id, item] of nextItems) {
			if (items.get(id) !== item) {
				changedIds.push(id)
			}
		}
		for (const id of items.keys()) {
			if (!nextItems.has(id)) {
				changedIds.push(id)
			}
		}

		if (!idsChanged && changedIds.length === 0) {
			return
		}

		items = nextItems
		ids = idsChanged ? nextIds : ids

		for (const id of changedIds) {
			listeners.get(id)?.forEach((listener) => listener())
		}
		if (idsChanged) {
			idListeners.forEach((listener) => listener())
		}
	}

	return {
		get: (id: string) => items.get(id),
		getIds: () => ids,
		subscribe,
		subscribeToIds,
		replace,
	}
}

export function createValueStore<T>(initial: T) {
	let value = initial
	const listeners = new Set<Listener>()

	return {
		get: () => value,
		set: (next: T) => {
			if (next === value) {
				return
			}
			value = next
			listeners.forEach((listener) => listener())
		},
		subscribe: (listener: Listener) => {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
	}
}

export const mindmapNodeStore = createEntityStore<BoxedMindmapNode>()
export const mindmapWireStore = createEntityStore<BoxedMindmapWire>()
export const mindmapExistingWireStore = createValueStore<Set<string>>(new Set())
