const { createClient } = require("redis");

// Create Redis client
const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    connectTimeout: 2000,
    // Give up after a few attempts.
    reconnectStrategy: (retries) => (retries > 2 ? false : 300),
  },
});

// Redis is a cache, not a source of truth. Log errors instead of crashing.
client.on("error", (err) => console.log("Redis Client Error", err.message));

async function start() {
  // Connect to Redis
  await client.connect();

  console.log("Connected with Docker Redis");

  // Test Redis connection
  await client.set("hi", "Welcome to the docker");
}

/**
 * True only when the client is connected and usable.
 *
 * Redis is optional: callers should check this before reading or writing the
 * cache and fall back to MongoDB when it returns false.
 */
function isReady() {
  return client.isReady === true;
}

module.exports = { start, client, isReady };
