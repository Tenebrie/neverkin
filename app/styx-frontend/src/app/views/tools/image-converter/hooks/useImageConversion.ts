import { useState } from 'react'

import { RequestImageConversionApiArg } from '@/api/otherApi'
import { useErrorState } from '@/app/hooks/useErrorState'

import { useFileUpload } from '../../../../../api/hooks/fileUpload/useFileUpload'
import { useGetPresignedDownloadUrl } from '../../../../../api/hooks/fileUpload/useGetPresignedDownloadUrl'
import { useRequestImageConversion } from '../api/useRequestImageConversion'

type ImageFormat = RequestImageConversionApiArg['body']['format']

type Props = {
	quality: number
	width: number | undefined
	height: number | undefined
	format: ImageFormat
}

export function useImageConversion({ quality, width, height, format }: Props) {
	const [lastConverted, setLastConverted] = useState<{
		name: string
		href: string
	} | null>(null)

	const errorState = useErrorState<{ conversionError: string }>()
	const { raiseError, clearError } = errorState

	const { uploadFile } = useFileUpload()
	const [requestImageConversion] = useRequestImageConversion()
	const [getPresignedDownloadUrl] = useGetPresignedDownloadUrl()

	const onFilesSelected = async (fileList: FileList) => {
		clearError()
		const file = fileList[0]
		const reader = new FileReader()

		reader.onload = async (event) => {
			if (!event.target) {
				return
			}
			const base64File = event.target.result
			if (!base64File || typeof base64File !== 'string') {
				return
			}

			try {
				const asset = await uploadFile(file, 'ImageConversion')
				const convertedAsset = await requestImageConversion({
					assetId: asset.id,
					format,
					quality: quality,
					width: width ? Number(width) : undefined,
					height: height ? Number(height) : undefined,
				})
				const downloadUrl = await getPresignedDownloadUrl(convertedAsset.id)
				setLastConverted({
					name: `${convertedAsset.originalFileName}.${format}`,
					href: downloadUrl.url,
				})
			} catch {
				raiseError('conversionError', 'Failed to upload file')
			}
		}

		reader.readAsDataURL(file)
	}

	return { lastConverted, onFilesSelected, errorState }
}
