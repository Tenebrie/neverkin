import { use } from 'react'

import { researchSummonable } from '../../summonable/researchSummonable'
import { RichTextEditorProps } from '../RichTextEditor'
import { RichTextEditorWordCountSlotContext } from './RichTextEditorWordCountSlotContext'

const { Summoner, Summonable } = researchSummonable<RichTextEditorProps>({
	family: 'richTextEditor',
})

export const RichTextEditorSummoner = (props: RichTextEditorProps) => {
	const wordCountSlot = use(RichTextEditorWordCountSlotContext)
	return <Summoner props={{ ...props, wordCountSlot }} sx={{ width: '100%', height: '100%' }} />
}

export const SummonableRichTextEditor = Summonable
