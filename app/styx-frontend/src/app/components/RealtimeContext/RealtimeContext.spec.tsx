import { describe, expect, it, rstest } from '@rstest/core'
import { act, render } from '@testing-library/react'
import { useState } from 'react'

import { createRealtimeContext } from './RealtimeContext'
import { useRealtimeContext } from './useRealtimeContext'

const CounterContext = createRealtimeContext(() => {
	const [count, setCount] = useState(0)
	return { count, setCount }
})

type CounterValue = ReturnType<typeof useCounterContext>

describe('RealtimeContext', () => {
	it('gives consumers the provider value', () => {
		const onRender = rstest.fn<(value: CounterValue) => void>()

		render(
			<CounterContext>
				<Consumer onRender={onRender} />
			</CounterContext>,
		)

		expect(onRender.mock.lastCall?.[0].count).toEqual(0)
	})

	it('does not re-render consumers when the value changes', () => {
		const onRender = rstest.fn<(value: CounterValue) => void>()
		render(
			<CounterContext>
				<Consumer onRender={onRender} />
			</CounterContext>,
		)
		const context = onRender.mock.calls[0][0]

		act(() => context.setCount(1))

		expect(onRender).toHaveBeenCalledTimes(1)
		expect(context.count).toEqual(1)
	})
})

function Consumer({ onRender }: { onRender: (value: CounterValue) => void }) {
	onRender(useCounterContext())
	return null
}

function useCounterContext() {
	return useRealtimeContext(CounterContext)
}
