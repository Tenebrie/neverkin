import MenuList from '@mui/material/MenuList'

import { GlobalSearchHit } from '@/api/types/searchTypes'

import { GlobalSearchHit as SearchHitComponent } from './GlobalSearchHit'

export type Props = {
	hits: GlobalSearchHit[]
} & Omit<Parameters<typeof SearchHitComponent>[0], 'hit'>

export function GlobalSearchResults({ hits, ...hitProps }: Props) {
	return (
		<MenuList>
			{hits.map((hit) => (
				<SearchHitComponent key={hit.id} hit={hit} {...hitProps} />
			))}
		</MenuList>
	)
}
