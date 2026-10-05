import { afterEach, describe, expect, it, rstest } from '@rstest/core'
import { act } from '@testing-library/react'
import { createRef } from 'react'

import { renderWithProviders } from '@/test-utils/renderWithProviders'

import { SelectionBox, SelectionBoxHandle } from './SelectionBox'

describe('SelectionBox', () => {
	afterEach(() => {
		document.body.replaceChildren()
	})

	it('keeps the far corner under the cursor after a zoom moves the container', () => {
		const container = document.createElement('div')
		document.body.append(container)
		const containerRect = rstest
			.spyOn(container, 'getBoundingClientRect')
			.mockReturnValue(new DOMRect(0, 0, 1000, 1000))
		const handle = createRef<SelectionBoxHandle>()
		const onFinalizeSelection = rstest.fn()
		renderWithProviders(
			<SelectionBox
				ref={{ current: container }}
				handle={handle}
				onClick={rstest.fn()}
				onUpdateSelection={rstest.fn()}
				onFinalizeSelection={onFinalizeSelection}
			/>,
		)

		container.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 }))
		window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 250 }))
		containerRect.mockReturnValue(new DOMRect(-50, -30, 1000, 1000))
		act(() => handle.current?.scaleAround(500, 500, 2))
		window.dispatchEvent(new MouseEvent('mousemove', { clientX: 310, clientY: 260 }))
		window.dispatchEvent(new MouseEvent('mouseup', { button: 0, clientX: 310, clientY: 260 }))

		expect(onFinalizeSelection.mock.calls[0][0]).toMatchObject({ x: -302, y: -306, width: 660, height: 593 })
	})
})
