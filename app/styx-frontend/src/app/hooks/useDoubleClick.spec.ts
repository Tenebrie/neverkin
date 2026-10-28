import { afterAll, beforeAll, describe, expect, it, rstest } from '@rstest/core'
import { act } from '@testing-library/react'
import { MouseEvent } from 'react'

import { renderHookWithProviders } from '../../test-utils/renderWithProviders'
import { useDoubleClick } from './useDoubleClick'

describe('useDoubleClick', () => {
	beforeAll(() => {
		rstest.useFakeTimers()
	})

	afterAll(() => {
		rstest.useRealTimers()
	})

	const mockMouseEvent = (data: { target?: unknown } = {}) =>
		({
			target: 'div1',
			...data,
		}) as MouseEvent

	it('performs a single click after delay only', async () => {
		const onClickSpy = rstest.fn()
		const onDoubleClickSpy = rstest.fn()

		const { result } = renderHookWithProviders(() =>
			useDoubleClick<void>({
				onClick: onClickSpy,
				onDoubleClick: onDoubleClickSpy,
			}),
		)
		const { triggerClick } = result.current

		act(() => {
			triggerClick(mockMouseEvent())
		})

		expect(onClickSpy).not.toHaveBeenCalled()
		expect(onDoubleClickSpy).not.toHaveBeenCalled()

		rstest.advanceTimersByTime(1000)

		expect(onClickSpy).toHaveBeenCalled()
		expect(onDoubleClickSpy).not.toHaveBeenCalled()
	})

	it('ignores delay if parameter is provided', async () => {
		const onClickSpy = rstest.fn()
		const onDoubleClickSpy = rstest.fn()

		const { result } = renderHookWithProviders(() =>
			useDoubleClick<void>({
				onClick: onClickSpy,
				onDoubleClick: onDoubleClickSpy,
				ignoreDelay: true,
			}),
		)
		const { triggerClick } = result.current

		act(() => {
			triggerClick(mockMouseEvent())
		})

		expect(onClickSpy).toHaveBeenCalledTimes(1)
		expect(onDoubleClickSpy).not.toHaveBeenCalled()

		rstest.advanceTimersByTime(1000)

		expect(onClickSpy).toHaveBeenCalledTimes(1)
		expect(onDoubleClickSpy).not.toHaveBeenCalled()
	})

	it('performs a double click immediately', async () => {
		const onClickSpy = rstest.fn()
		const onDoubleClickSpy = rstest.fn()

		const { result } = renderHookWithProviders(() =>
			useDoubleClick<void>({
				onClick: onClickSpy,
				onDoubleClick: onDoubleClickSpy,
			}),
		)
		const { triggerClick } = result.current

		act(() => {
			triggerClick(mockMouseEvent())
			triggerClick(mockMouseEvent())
		})

		expect(onClickSpy).not.toHaveBeenCalled()
		expect(onDoubleClickSpy).toHaveBeenCalled()

		rstest.advanceTimersByTime(1000)

		expect(onClickSpy).not.toHaveBeenCalled()
	})

	it('passes parameters on single click', async () => {
		const onClickSpy = rstest.fn()
		const onDoubleClickSpy = rstest.fn()

		const { result } = renderHookWithProviders(() =>
			useDoubleClick<{ foo: string }>({
				onClick: onClickSpy,
				onDoubleClick: onDoubleClickSpy,
			}),
		)
		const { triggerClick } = result.current

		act(() => {
			triggerClick(mockMouseEvent(), {
				foo: 'my value',
			})
		})

		rstest.advanceTimersByTime(1000)

		expect(onClickSpy).toHaveBeenCalledWith({
			foo: 'my value',
		})
	})

	it('passes paremeters on double click', async () => {
		const onClickSpy = rstest.fn()
		const onDoubleClickSpy = rstest.fn()

		const { result } = renderHookWithProviders(() =>
			useDoubleClick<{ foo: string }>({
				onClick: onClickSpy,
				onDoubleClick: onDoubleClickSpy,
			}),
		)
		const { triggerClick } = result.current

		act(() => {
			triggerClick(mockMouseEvent(), {
				foo: 'my value',
			})
			triggerClick(mockMouseEvent(), {
				foo: 'my value',
			})
		})

		expect(onDoubleClickSpy).toHaveBeenCalledWith({
			foo: 'my value',
		})
	})

	it('does not trigger double click if targets are different', async () => {
		const onClickSpy = rstest.fn()
		const onDoubleClickSpy = rstest.fn()

		const { result } = renderHookWithProviders(() =>
			useDoubleClick<{ foo: string }>({
				onClick: onClickSpy,
				onDoubleClick: onDoubleClickSpy,
			}),
		)
		const { triggerClick } = result.current

		act(() => {
			triggerClick(
				mockMouseEvent({
					target: 'div1',
				}),
				{
					foo: 'my value',
				},
			)
			triggerClick(
				mockMouseEvent({
					target: 'div2',
				}),
				{
					foo: 'my value',
				},
			)
		})

		expect(onDoubleClickSpy).not.toHaveBeenCalled()
	})
})
