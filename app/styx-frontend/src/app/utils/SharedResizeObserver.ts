type ResizeCallback = (entry: ResizeObserverEntry) => void

export class SharedResizeObserver {
	private callbacks = new Map<Element, ResizeCallback>()
	private observer = new ResizeObserver((entries) => {
		for (const entry of entries) {
			this.callbacks.get(entry.target)?.(entry)
		}
	})

	observe(element: Element, callback: ResizeCallback) {
		this.callbacks.set(element, callback)
		this.observer.observe(element)
		return () => {
			this.callbacks.delete(element)
			this.observer.unobserve(element)
		}
	}
}
