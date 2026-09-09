import Stack from '@mui/material/Stack'

import { ShareWorldModal } from '@/app/views/world/views/settings/modals/ShareWorldModal'
import { SettingsSuspense } from '@/app/views/world/views/settings/SettingsSuspense'

export function SettingsView() {
	return (
		<Stack
			position="relative"
			width="100%"
			alignItems="center"
			sx={{ paddingY: '16px', overflowY: 'scroll' }}
		>
			<SettingsSuspense />
			<ShareWorldModal />
		</Stack>
	)
}
