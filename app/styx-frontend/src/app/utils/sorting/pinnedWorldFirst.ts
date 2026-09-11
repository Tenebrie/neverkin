import { WorldBrief } from '@/api/types/worldTypes'

export function pinnedWorldFirst<T extends WorldBrief>(a: T, b: T): number {
	const pinRank = (world: WorldBrief) => {
		if (world.userPins.length === 0) {
			return 10000
		}
		return world.userPins[0].rank
	}
	return pinRank(a) - pinRank(b)
}
