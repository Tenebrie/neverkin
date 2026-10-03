export type Listener = () => void

export class ReactiveMap<Key, Value> {
	private data = new Map<Key, Value>()
	private keyList: Key[] | null = []
	private listeners = new Map<Key, Set<Listener>>()
	private keyListeners = new Set<Listener>()

	get(key: Key) {
		return this.data.get(key)
	}

	keys() {
		this.keyList ??= [...this.data.keys()]
		return this.keyList
	}

	values() {
		return this.data.values()
	}

	set(key: Key, value: Value) {
		const isNew = !this.data.has(key)
		if (!isNew && this.data.get(key) === value) {
			return
		}
		this.data.set(key, value)
		if (isNew) {
			this.keyList = null
		}
		this.notify([key], isNew)
	}

	delete(key: Key) {
		if (!this.data.delete(key)) {
			return
		}
		this.keyList = null
		this.notify([key], true)
	}

	replace(next: Map<Key, Value>) {
		const prev = this.data
		const changed: Key[] = []
		for (const key of prev.keys()) {
			if (!next.has(key)) {
				changed.push(key)
			}
		}
		for (const [key, value] of next) {
			if (prev.get(key) !== value) {
				changed.push(key)
			}
		}
		const nextKeys = [...next.keys()]
		const keysChanged = !isSameList(this.keys(), nextKeys)

		this.data = next
		if (keysChanged) {
			this.keyList = nextKeys
		}
		this.notify(changed, keysChanged)
	}

	subscribe(key: Key, listener: Listener) {
		const set = this.listeners.get(key) ?? new Set()
		this.listeners.set(key, set.add(listener))
		return () => {
			set.delete(listener)
		}
	}

	subscribeToKeys(listener: Listener) {
		this.keyListeners.add(listener)
		return () => {
			this.keyListeners.delete(listener)
		}
	}

	private notify(keys: Key[], keysChanged: boolean) {
		for (const key of keys) {
			this.listeners.get(key)?.forEach((listener) => listener())
		}
		if (keysChanged) {
			this.keyListeners.forEach((listener) => listener())
		}
	}
}

function isSameList<T>(a: T[], b: T[]) {
	return a.length === b.length && a.every((value, index) => value === b[index])
}
