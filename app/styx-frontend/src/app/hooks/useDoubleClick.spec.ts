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

	const mockMouseEvent = (
		data: { target?: unknown; button?: number; clientX?: number; clientY?: number } = {},
	) =>
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

	describe('long click', () => {
		const pressAt = (clientX: number, clientY: number) => mockMouseEvent({ button: 0, clientX, clientY })

		const moveMouseTo = (clientX: number, clientY: number) => {
			window.dispatchEvent(new window.MouseEvent('mousemove', { clientX, clientY }))
		}

		const renderLongClick = () => {
			const onClickSpy = rstest.fn()
			const onLongClickSpy = rstest.fn()
			const { result } = renderHookWithProviders(() =>
				useDoubleClick<void>({
					onClick: onClickSpy,
					onDoubleClick: rstest.fn(),
					onLongClick: onLongClickSpy,
					ignoreDelay: true,
				}),
			)
			return { ...result.current, onClickSpy, onLongClickSpy }
		}

		it('fires after holding the button still', () => {
			const { startLongClick, onLongClickSpy } = renderLongClick()

			act(() => {
				moveMouseTo(10, 10)
				startLongClick(pressAt(10, 10))
				rstest.advanceTimersByTime(600)
			})

			expect(onLongClickSpy).toHaveBeenCalledTimes(1)
		})

		it('does not fire when the pointer moves away during the hold', () => {
			const { startLongClick, onLongClickSpy } = renderLongClick()

			act(() => {
				moveMouseTo(10, 10)
				startLongClick(pressAt(10, 10))
				moveMouseTo(40, 40)
				rstest.advanceTimersByTime(600)
			})

			expect(onLongClickSpy).not.toHaveBeenCalled()
		})

		it('does not fire when the button is released first', () => {
			const { startLongClick, cancelLongClick, onLongClickSpy } = renderLongClick()

			act(() => {
				moveMouseTo(10, 10)
				startLongClick(pressAt(10, 10))
				cancelLongClick()
				rstest.advanceTimersByTime(600)
			})

			expect(onLongClickSpy).not.toHaveBeenCalled()
		})

		it('swallows the click that follows it, but not the next one', () => {
			const { startLongClick, triggerClick, onClickSpy } = renderLongClick()

			act(() => {
				moveMouseTo(10, 10)
				startLongClick(pressAt(10, 10))
				rstest.advanceTimersByTime(600)
				triggerClick(mockMouseEvent())
			})
			expect(onClickSpy).not.toHaveBeenCalled()

			act(() => {
				startLongClick(pressAt(10, 10))
				triggerClick(mockMouseEvent())
			})
			expect(onClickSpy).toHaveBeenCalledTimes(1)
		})
	})
})
