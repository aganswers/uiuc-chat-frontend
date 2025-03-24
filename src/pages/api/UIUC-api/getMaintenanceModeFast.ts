import { type NextApiRequest, type NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const startTime = Date.now()
    try {
        const redisStartTime = Date.now()
        const maintenanceStatus = await redisClient.get('maintenance-mode')

        console.log("Raw maintance return value: ", maintenanceStatus)
        console.log(`[getMaintenanceModeFast] Redis query took ${Date.now() - redisStartTime}ms. maintenanceStatus: ${maintenanceStatus === 'true'}` )

        res.status(200).json({
            isMaintenanceMode: maintenanceStatus === 'true'
        })
    } catch (error) {
        console.error('[getMaintenanceMode] Failed to check maintenance mode:', error)
        res.status(500).json({ error: 'Failed to check maintenance mode' })
        console.log(`[getMaintenanceMode] Failed request took ${Date.now() - startTime}ms`)
    }
}
