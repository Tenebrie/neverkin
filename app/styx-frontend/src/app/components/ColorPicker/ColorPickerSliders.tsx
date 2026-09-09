import OutlinedInput from '@mui/material/OutlinedInput'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import throttle from 'lodash.throttle'
import { useMemo, useState } from 'react'
import styled from 'styled-components'

import { useEffectOnce } from '@/app/hooks/useEffectOnce'

type Props = {
	color: string
	hue: number
	saturation: number
	lightness: number
	onHueChange: (value: number) => void
	onSaturationChange: (value: number) => void
	onLightnessChange: (value: number) => void
	resetInputValue: () => void
}

export function ColorPickerSliders({
	color,
	hue,
	saturation,
	lightness,
	onHueChange,
	onSaturationChange,
	onLightnessChange,
	resetInputValue,
}: Props) {
	const [localHue, setLocalHue] = useState(hue)
	const [localSaturation, setLocalSaturation] = useState(saturation)
	const [localLightness, setLocalLightness] = useState(lightness)

	const throttledOnHueChange = useMemo(() => {
		return throttle((value: number) => {
			onHueChange(value)
		}, 50)
	}, [onHueChange])

	const throttledOnSaturationChange = useMemo(() => {
		return throttle((value: number) => {
			onSaturationChange(value)
		}, 50)
	}, [onSaturationChange])

	const throttledOnLightnessChange = useMemo(() => {
		return throttle((value: number) => {
			onLightnessChange(value)
		}, 50)
	}, [onLightnessChange])

	useEffectOnce(() => {
		return () => {
			throttledOnHueChange.cancel()
			throttledOnSaturationChange.cancel()
			throttledOnLightnessChange.cancel()
		}
	})

	return (
		<>
			<Stack
				direction="row"
				gap={4}
				sx={{
					alignItems: 'center',
				}}
			>
				<HueSlider
					step={1}
					max={360}
					$color={color}
					value={localHue}
					onChange={(_, value) => {
						setLocalHue(value as number)
						throttledOnHueChange(value as number)
						resetInputValue()
					}}
				/>
				<OutlinedInput
					size="small"
					sx={{ width: '110px' }}
					type="number"
					value={Math.round(hue)}
					onChange={(event) => {
						const value = Math.max(0, Math.min(360, Math.round(Number(event.target.value))))
						setLocalHue(value)
						throttledOnHueChange(value)
						resetInputValue()
					}}
				/>
			</Stack>
			<Stack direction="row" gap={4} sx={{ alignItems: 'center' }}>
				<SaturationSlider
					step={1}
					$color={color}
					value={localSaturation / 10}
					onChange={(_, value) => {
						setLocalSaturation((value as number) * 10)
						throttledOnSaturationChange((value as number) * 10)
						resetInputValue()
					}}
				/>
				<OutlinedInput
					size="small"
					sx={{ width: '110px' }}
					type="number"
					value={Math.round(saturation / 10)}
					onChange={(event) => {
						const value = Math.max(0, Math.min(1000, Math.round(Number(event.target.value) * 10)))
						setLocalSaturation(value)
						throttledOnSaturationChange(value)
						resetInputValue()
					}}
				/>
			</Stack>
			<Stack direction="row" gap={4} sx={{ alignItems: 'center' }}>
				<LightnessSlider
					step={1}
					$color={color}
					value={localLightness / 10}
					onChange={(_, value) => {
						setLocalLightness((value as number) * 10)
						throttledOnLightnessChange((value as number) * 10)
						resetInputValue()
					}}
				/>
				<OutlinedInput
					size="small"
					sx={{ width: '110px' }}
					type="number"
					value={Math.round(lightness / 10)}
					onChange={(event) => {
						const value = Math.max(0, Math.min(1000, Math.round(Number(event.target.value) * 10)))
						setLocalLightness(value)
						throttledOnLightnessChange(value)
						resetInputValue()
					}}
				/>
			</Stack>{' '}
		</>
	)
}

const BaseSlider = styled(Slider).attrs<{ $color: string }>((props) => ({
	style: {
		color: props.$color,
	},
}))`
	height: 64px;
	transition: none;

	.MuiSlider-thumb {
		transition: none;
	}

	.MuiSlider-rail {
		opacity: 1;
		height: 12px;
		transition: none;
	}

	.MuiSlider-track {
		display: none;
	}
`

const HueSlider = styled(BaseSlider)`
	.MuiSlider-rail {
		background: linear-gradient(
			90deg,
			hsl(0, var(--saturation), var(--lightness)) 0%,
			hsl(60, var(--saturation), var(--lightness)) 17%,
			hsl(120, var(--saturation), var(--lightness)) 33%,
			hsl(180, var(--saturation), var(--lightness)) 50%,
			hsl(240, var(--saturation), var(--lightness)) 67%,
			hsl(300, var(--saturation), var(--lightness)) 83%,
			hsl(360, var(--saturation), var(--lightness)) 100%
		);
	}
`

const SaturationSlider = styled(BaseSlider)`
	.MuiSlider-rail {
		background: linear-gradient(
			90deg,
			hsl(var(--hue), 0%, var(--lightness)) 0%,
			hsl(var(--hue), 100%, var(--lightness)) 100%
		);
	}
`

const LightnessSlider = styled(BaseSlider)`
	.MuiSlider-rail {
		background: linear-gradient(
			90deg,
			hsl(var(--hue), var(--saturation), 0%) 0%,
			hsl(var(--hue), var(--saturation), 50%) 50%,
			hsl(var(--hue), var(--saturation), 100%) 100%
		);
	}
`
