import { researchSummonable } from '../../summonable/researchSummonable'
import { RichTextEditorProps } from '../RichTextEditor'

const { Summoner, Summonable } = researchSummonable<RichTextEditorProps>({
	family: 'richTextEditor',
})

export const RichTextEditorSummoner = (props: RichTextEditorProps) => {
	return <Summoner props={props} sx={{ width: '100%', height: '100%' }} />
}

export const SummonableRichTextEditor = Summonable
