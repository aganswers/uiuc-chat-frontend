import { createClient } from 'redis'

console.log('REDIS_URL', process.env.REDIS_URL)

// Create a Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL!,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Redis reconnect attempt #${retries}`)
      return Math.min(retries * 100, 3000) // Increasing backoff with a maximum of 3 seconds
    },
    tls: true,
    rejectUnauthorized: false // Allow self-signed certificates
  }
})

// Connect to the Redis server
redisClient
  .connect()
  .then(() => {
    console.log('Connected to Redis')
  })
  .catch((err) => {
    console.error('Redis connection error:', err)
  })
