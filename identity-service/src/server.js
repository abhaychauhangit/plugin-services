import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { RedisStore } from "rate-limit-redis";
import routes from "./routes/identityRoutes.js"
import errorHandler from "./middleware/errorHandler.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to mongodb"))
    .catch((e) => console.log("MongoDb connection error", e));

const redisClient = new Redis(process.env.UPSTASH_REDIS_URL, {tls: {}});

app.use(helmet());
app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    console.log(`Request body, ${req.body}`);
    next();
});

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1,
});


app.use((req, res, next) => {
    rateLimiter
      .consume(req.ip)
      .then(() => next())
      .catch(() => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    });
});

const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
});

app.use("/api/auth/register", sensitiveEndpointsLimiter);

app.use("/api/auth", routes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Identity service running on port ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection at", promise, "reason:", reason);
});

