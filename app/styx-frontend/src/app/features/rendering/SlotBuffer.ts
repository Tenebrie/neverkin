/**
 * Fixed-size records packed back to back in one `Float32Array`, ready to hand to the GPU as-is.
 *
 * Records stay contiguous: deleting one moves the last record into its place, so the order of records is not
 * preserved. The buffer remembers the range written since the last `takeChanges`, so only that part needs uploading.
 */
export class SlotBuffer<Key> {
	private data: Float32Array
	private readonly stride: number
	private readonly slotOfKey = new Map<Key, number>()
	private readonly keyInSlot: Key[] = []
	private firstChanged = Infinity
	private lastChanged = -1

	/**
	 * @param stride Floats per record.
	 * @param initialCapacity Records that fit before the buffer first grows.
	 */
	constructor(stride: number, initialCapacity = 64) {
		this.stride = stride
		this.data = new Float32Array(stride * initialCapacity)
	}

	get count() {
		return this.keyInSlot.length
	}

	/** Writes the record of `key`, adding it at the end if it is new. `values` holds exactly `stride` floats. */
	write(key: Key, values: ArrayLike<number>) {
		let slot = this.slotOfKey.get(key)
		if (slot === undefined) {
			slot = this.keyInSlot.length
			if ((slot + 1) * this.stride > this.data.length) {
				this.grow()
			}
			this.keyInSlot.push(key)
			this.slotOfKey.set(key, slot)
		}
		this.data.set(values, slot * this.stride)
		this.markChanged(slot)
	}

	/** Removes the record of `key` by moving the last record into its slot. Returns false if there was none. */
	delete(key: Key) {
		const slot = this.slotOfKey.get(key)
		if (slot === undefined) {
			return false
		}
		const lastSlot = this.keyInSlot.length - 1
		const lastKey = this.keyInSlot[lastSlot]
		this.data.copyWithin(slot * this.stride, lastSlot * this.stride, (lastSlot + 1) * this.stride)
		this.keyInSlot[slot] = lastKey
		this.slotOfKey.set(lastKey, slot)
		this.keyInSlot.pop()
		this.slotOfKey.delete(key)
		this.markChanged(slot)
		return true
	}

	/**
	 * The whole backing array, and the range of floats in it changed since the previous call, which forgets them.
	 * The array is replaced whenever the buffer grows, so a different `data.length` means everything must be re-sent.
	 */
	takeChanges() {
		const changedSlots = Math.min(this.lastChanged, this.count - 1) - this.firstChanged + 1
		const changes =
			changedSlots > 0
				? { data: this.data, offset: this.firstChanged * this.stride, length: changedSlots * this.stride }
				: { data: this.data, offset: 0, length: 0 }
		this.firstChanged = Infinity
		this.lastChanged = -1
		return changes
	}

	private markChanged(slot: number) {
		this.firstChanged = Math.min(this.firstChanged, slot)
		this.lastChanged = Math.max(this.lastChanged, slot)
	}

	private grow() {
		const grown = new Float32Array(this.data.length * 2)
		grown.set(this.data)
		this.data = grown
	}
}
