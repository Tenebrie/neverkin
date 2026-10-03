import { useCallback } from 'react'

import { AssetType } from '@/api/types/assetTypes'
import { useRequestPresignedUrl } from '@/app/views/tools/image-converter/api/useRequestPresignedUrl'

import { useBucketFileUpload } from './useBucketFileUpload'
import { useFinalizeFileUpload } from './useFinalizeFileUpload'

export function useFileUpload() {
	const [getPresignedUrl] = useRequestPresignedUrl()
	const [uploadFileToBucket] = useBucketFileUpload()
	const [finalizeAssetUpload] = useFinalizeFileUpload()

	const uploadFile = useCallback(
		async (file: File, assetType: AssetType) => {
			const presignedUrl = await getPresignedUrl({
				assetType,
				fileName: file.name,
				fileSize: file.size,
			})

			await uploadFileToBucket({ file, presignedUrl })
			return await finalizeAssetUpload({
				assetId: presignedUrl.asset.id,
			})
		},
		[getPresignedUrl, uploadFileToBucket, finalizeAssetUpload],
	)

	return { uploadFile }
}
