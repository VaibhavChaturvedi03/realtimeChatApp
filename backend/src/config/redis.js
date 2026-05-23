import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("REDIS_URL is not set; rate limiting will not work.");
}

const redisClient = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: 1 })
  : null;

if (redisClient) {
  redisClient.on("error", (err) => {
    console.error("Redis client error", err);
  });
}

const connectRedis = async () => {
  if (!redisUrl) {
    return null;
  }

  if (!redisClient) {
    return null;
  }

  if (redisClient.status === "end") {
    await redisClient.connect();
  }

  return redisClient;
};

export { redisClient, connectRedis };