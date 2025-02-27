import { Redis } from '@upstash/redis'

export const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})


// import { createClient } from 'redis'
// console.log('REDIS_URL', process.env.REDIS_URL)
// // Create a Redis client
// export const redisClient = createClient({
//   url: process.env.REDIS_URL!,
//   socket: {
//     tls: true,
//     rejectUnauthorized: false // Allow self-signed certificates
//   }
// })

// // Connect to the Redis server
// redisClient
//   .connect()
//   .then(() => {
//     console.log('Connected to Redis')
//   })
//   .catch((err) => {
//     console.error('Redis connection error:', err)
//   })
