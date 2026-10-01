import debounce from 'lodash.debounce'
import { useCallback, useRef, useState } from 'react'
import { ZodSchema } from 'zod'

const debouncedUpdate = debounce((storage: Storage, key: string, value: unknown) => {
	storage.setItem(`userPreferences/${key}`, JSON.stringify(value))
}, 100)

function usePersistentStateRef<T>(
	key: string,
	schema: ZodSchema<T>,
	initialValue: T,
	storage: Storage = localStorage,
): [React.RefObject<T>, (value: T | ((prev: T) => T)) => void] {
	const [initial] = useState<T>(() => {
		const storedValue = storage.getItem(`userPreferences/${key}`)
		if (!storedValue) {
			return initialValue
		}
		try {
			return schema.parse(JSON.parse(storedValue))
		} catch (error) {
			console.error(error)
			storage.removeItem(`userPreferences/${key}`)
		}
		return initialValue
	})

	const value = useRef<T>(initial)

	const setValue = useCallback(
		(newValue: T | ((prev: T) => T)) => {
			if (isFunction(newValue)) {
				value.current = newValue(value.current)
			} else {
				value.current = newValue
			}
			debouncedUpdate(storage, key, value.current)
		},
		[key, storage],
	)

	return [value, setValue] as const
}

function isFunction<T>(value: T | ((prev: T) => T)): value is (prev: T) => T {
	return typeof value === 'function'
}

export default usePersistentStateRef
