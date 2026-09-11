import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import debounce from 'lodash.debounce'
import { memo, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { useGetCommonWorldEventIconsQuery } from '@/api/worldDetailsApi'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

import { IconCollection } from './components/IconCollection'
import { IconSearchInput } from './components/IconSearchInput'
import { useRecentIconSets } from './hooks/useRecentIconSets'
import { useIconifySearch } from './useIconifySearch'

type Props = {
	color: string
	defaultQuery: string
	onSelect: (icon: string) => void
}

export const IconPicker = memo(IconPickerComponent)

export function IconPickerComponent({ onSelect, ...props }: Props) {
	const worldId = useSelector(getWorldIdState)
	const [query, setQuery] = useState('')
	const [recent, updateRecentIconSets] = useRecentIconSets()

	const [renderedColor, setRenderedColor] = useState<string>(props.color)
	// whenever color changes, debounce changes to rendered color
	const throttledUpdateRenderedColor = useMemo(() => {
		return debounce((color: string) => {
			setRenderedColor(color)
		}, 100)
	}, [])

	useEffect(() => {
		throttledUpdateRenderedColor(props.color)
	}, [props.color, throttledUpdateRenderedColor])

	useEffectOnce(() => {
		return () => throttledUpdateRenderedColor.cancel()
	})

	const { results } = useIconifySearch({ query })
	const { data: commonEventIcons } = useGetCommonWorldEventIconsQuery({ worldId })
	const shownFavoriteSets = query.length > 0 ? results?.collections.filter((set) => set.favorite) : []
	const shownOtherSets =
		query.length > 0
			? results?.collections.filter((set) => !set.favorite)
			: [
					...(recent.length > 0
						? [
								{
									id: 'recent',
									name: 'Recently Used',
									icons: recent,
									count: recent.length,
									procedural: true,
								},
							]
						: []),
					...(commonEventIcons?.collections ?? []),
				]

	const onIconSelected = useEvent((id: string) => {
		updateRecentIconSets([id])
		onSelect(id)
	})

	return (
		<Stack gap={2}>
			<IconSearchInput onQueryChange={setQuery} />
			{shownFavoriteSets && shownFavoriteSets.length > 0 && (
				<>
					<Stack gap={1} direction="row" flexWrap="wrap">
						{shownFavoriteSets?.map((collection) => (
							<Stack key={collection.id} spacing={1} width="calc(50% - 8px)">
								<IconCollection
									collection={collection}
									{...props}
									color={renderedColor}
									onSelect={onIconSelected}
								/>
							</Stack>
						))}
					</Stack>
					<Divider />
				</>
			)}
			<Stack gap={1} direction="row" flexWrap="wrap">
				{shownOtherSets?.map((collection) => (
					<Stack key={collection.id} spacing={1} width="calc(50% - 8px)">
						<IconCollection
							collection={collection}
							{...props}
							color={renderedColor}
							onSelect={onIconSelected}
						/>
					</Stack>
				))}
			</Stack>
		</Stack>
	)
}
