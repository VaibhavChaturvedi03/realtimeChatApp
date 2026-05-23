import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient, connectRedis } from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const initRedisStore = async () => {
  const client = await connectRedis();

  if (!client) {
    return null;
  }

  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
  });
};

const buildRateLimitHandler = (message) =>
  asyncHandler(async (req, res) => {
    const error = new ApiError(429, message);
    return res
      .status(error.statusCode)
      .json(new ApiResponse(error.statusCode, null, error.message));
  });

const createLimiter = async ({ windowMs, max, message, keyGenerator }) => {
  const store = await initRedisStore();
  const handler = buildRateLimitHandler(message);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    keyGenerator,
    handler: (req, res, next) => handler(req, res, next),
    store: store || undefined,
  });
};

const apiRateLimiter = await createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

const loginRateLimiter = await createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again later.",
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase().trim();
    return email ? `login:${req.ip}:${email}` : `login:${req.ip}`;
  },
});

export { apiRateLimiter, loginRateLimiter };