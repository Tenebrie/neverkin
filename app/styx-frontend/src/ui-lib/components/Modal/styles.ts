import Paper from '@mui/material/Paper'
import styled from 'styled-components'

import { CustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

export const ModalBackdrop = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100dvh;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	opacity: 1;
	pointer-events: all;
	transition: opacity var(--modal-animation-duration, 0ms);

	@starting-style {
		opacity: 0;
	}

	&.closing {
		opacity: 0;
		pointer-events: none;
	}
`

export const ModalContainer = styled(Paper)<{ $theme: CustomTheme }>`
	padding: 16px 32px;
	max-width: 860px;
	width: 100%;
	max-height: calc(100dvh - 32px);
	border-radius: 8px;
	display: flex;
	gap: 16px;
	flex-direction: column;
`

export const ModalHeaderNative = styled.h2`
	margin: none;
	padding: none;
	font-family: 'Inter';
`
