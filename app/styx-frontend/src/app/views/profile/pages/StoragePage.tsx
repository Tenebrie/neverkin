import ScheduleIcon from '@mui/icons-material/AccessTime'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import AssetsIcon from '@mui/icons-material/Folder'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import QuotaIcon from '@mui/icons-material/Storage'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Popover from '@mui/material/Popover'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { useCallback, useRef, useState } from 'react'

import { useLazyGetAssetQuery, useListUserAssetsQuery } from '@/api/assetApi'
import { useGetStorageStatusQuery } from '@/api/profileApi'
import { Asset } from '@/api/types/assetTypes'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { formatBytes } from '@/app/utils/formatBytes'
import { formatTimeAgo } from '@/app/utils/formatTimeAgo'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

export function StoragePage() {
	return (
		<Stack gap={3}>
			<Stack gap={2}>
				<Typography variant="h5" sx={{ fontFamily: 'Inter', fontWeight: 500 }}>
					Storage
				</Typography>
				<Divider />
			</Stack>
			<Stack gap={6}>
				<StoragePageQuota />
				<StoragePageAssets />
			</Stack>
		</Stack>
	)
}

export function StoragePageQuota() {
	const { data: quotaData, isLoading } = useGetStorageStatusQuery()

	const usedQuota = quotaData?.quota.used ?? 0
	const totalQuota = quotaData?.quota.total ?? 0
	const quotaPercentage = totalQuota > 0 ? (usedQuota / totalQuota) * 100 : 0

	return (
		<Stack spacing={2}>
			<Typography
				variant="h6"
				sx={{ display: 'flex', fontFamily: 'Inter', alignItems: 'center', gap: 1, fontSize: 18 }}
			>
				<QuotaIcon /> Storage Quota
			</Typography>
			{isLoading && (
				<Stack spacing={1}>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Skeleton variant="text" width={120} height={20} />
						<Skeleton variant="text" width={120} height={20} />
					</Stack>
					<Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
				</Stack>
			)}
			{!isLoading && (
				<Stack spacing={1}>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="body2" color="text.secondary">
							Used: {formatBytes(usedQuota)}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Total: {formatBytes(totalQuota)}
						</Typography>
					</Stack>
					<LinearProgress
						variant="determinate"
						value={quotaPercentage}
						sx={{
							height: 8,
							borderRadius: 4,
							'& .MuiLinearProgress-bar': {
								borderRadius: 4,
							},
						}}
					/>
				</Stack>
			)}
		</Stack>
	)
}

export function StoragePageAssets() {
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: 12,
	})
	const [sortModel, setSortModel] = useState<GridSortModel>([])
	const { open: openDeleteAssetModal } = useModal('deleteAssetModal')
	const [getAssetLazy] = useLazyGetAssetQuery()

	const handleDownload = useCallback(
		async (assetId: string) => {
			const { response } = parseApiResponse(await getAssetLazy({ assetId, disposition: 'attachment' }))
			if (!response) {
				return
			}
			window.open(response.url)
		},
		[getAssetLazy],
	)

	const sortItem = sortModel[0]
	const { data: assetsData } = useListUserAssetsQuery({
		offset: paginationModel.page * paginationModel.pageSize,
		limit: paginationModel.pageSize,
		sortField: sortItem?.field,
		sortDirection: sortItem?.sort ?? undefined,
	})

	const columns: GridColDef<Asset>[] = [
		{
			field: 'previewUrl',
			headerName: 'Preview',
			sortable: false,
			width: 72,
			renderCell: (params) => <AssetPreviewCell previewUrl={params.row.previewUrl} />,
		},
		{
			field: 'originalFileName',
			headerName: 'Name',
			flex: 1,
			renderCell: (params) => (
				<Stack direction="row" gap={1} alignItems="center" height="100%">
					<Typography
						variant="body2"
						sx={{
							color:
								params.row.status === 'Finalized'
									? 'text.primary'
									: params.row.status === 'Pending'
										? 'text.secondary'
										: 'text.error',
						}}
					>
						{params.row.originalFileName}
						{params.row.originalFileExtension ? `.${params.row.originalFileExtension}` : ''}
					</Typography>
					{params.row.expiresAt && (
						<Tooltip
							placement="top"
							disableInteractive
							title={`This file will be deleted ${formatTimeAgo(new Date(params.row.expiresAt))}`}
						>
							<ScheduleIcon fontSize="small" sx={{ color: 'text.secondary', display: 'block' }} />
						</Tooltip>
					)}
					{params.row._count.references > 0 && (
						<Tooltip
							placement="top"
							disableInteractive
							title={`Used ${params.row._count.references} time${params.row._count.references !== 1 ? 's' : ''}`}
						>
							<LinkIcon fontSize="small" sx={{ color: 'text.secondary', display: 'block' }} />
						</Tooltip>
					)}
					{params.row._count.references === 0 && !params.row.expiresAt && (
						<Tooltip
							placement="top"
							disableInteractive
							title={`This file is not used and will be scheduled for deletion soon.`}
						>
							<LinkOffIcon fontSize="small" sx={{ color: 'text.secondary', display: 'block' }} />
						</Tooltip>
					)}
				</Stack>
			),
		},
		{
			field: 'size',
			headerName: 'Size',
			width: 120,
			valueFormatter: (value: number) => formatBytes(value),
		},
		{
			field: 'createdAt',
			headerName: 'Created',
			width: 160,
			valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
		},
		{
			field: 'actions',
			headerName: 'Actions',
			sortable: false,
			width: 100,
			renderCell: (params) => (
				<>
					{params.row.status === 'Finalized' && (
						<Stack direction="row" spacing={1} alignItems="center" height="100%">
							<IconButton
								size="small"
								sx={{ width: 32, height: 32 }}
								onClick={() => handleDownload(params.row.id)}
							>
								<DownloadIcon sx={{ color: 'secondary.main' }} />
							</IconButton>
							<IconButton
								size="small"
								sx={{ width: 32, height: 32 }}
								onClick={() =>
									openDeleteAssetModal({
										assetId: params.row.id,
										assetName: `${params.row.originalFileName}${params.row.originalFileExtension ? `.${params.row.originalFileExtension}` : ''}`,
									})
								}
							>
								<DeleteIcon sx={{ color: 'error.main' }} />
							</IconButton>
						</Stack>
					)}
				</>
			),
		},
	]

	return (
		<Stack spacing={2}>
			<Typography
				variant="h6"
				sx={{ display: 'flex', fontFamily: 'Inter', alignItems: 'center', gap: 1, fontSize: 18 }}
			>
				<AssetsIcon /> Assets
			</Typography>
			<DataGrid
				rows={assetsData?.assets ?? []}
				rowCount={assetsData?.total ?? 0}
				columns={columns}
				paginationMode="server"
				sortingMode="server"
				paginationModel={paginationModel}
				onPaginationModelChange={setPaginationModel}
				sortModel={sortModel}
				onSortModelChange={setSortModel}
				pageSizeOptions={[8, 12, 24, 48]}
				disableRowSelectionOnClick
				autoHeight
				sx={{ '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' } }}
			/>
		</Stack>
	)
}

function AssetPreviewCell({ previewUrl }: { previewUrl?: string | null }) {
	const [hoverAnchor, setHoverAnchor] = useState<HTMLElement | null>(null)
	const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
		const target = e.currentTarget
		hoverTimeout.current = setTimeout(() => setHoverAnchor(target), 500)
	}

	const handleMouseLeave = () => {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
		setHoverAnchor(null)
	}

	if (!previewUrl) {
		return null
	}

	return (
		<Stack alignItems="center" justifyContent="center" sx={{ width: '100%', height: '100%' }}>
			<Box
				component="img"
				src={previewUrl}
				alt="Preview"
				onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
			/>
			<Popover
				open={!!hoverAnchor}
				anchorEl={hoverAnchor}
				onClose={handleMouseLeave}
				anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
				transformOrigin={{ vertical: 'center', horizontal: 'left' }}
				sx={{ pointerEvents: 'none' }}
				disableRestoreFocus
			>
				<Box
					component="img"
					src={previewUrl}
					alt="Preview"
					sx={{ maxWidth: 512, maxHeight: 512, display: 'block' }}
				/>
			</Popover>
		</Stack>
	)
}
