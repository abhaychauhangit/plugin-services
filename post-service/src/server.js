import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import mongoose from "mongoose";
import postRoutes from "./routes/postRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { connectToRabbitMQ } from './utils/rabbitmq.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to mongodb"))
  .catch((e) => console.log("Mongo connection error", e));

const redisClient = new Redis(process.env.UPSTASH_REDIS_URL, {tls: {}});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
})


app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log(`Request body, ${req.body}`);
  next();
});




app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();



process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at", promise, "reason:", reason);
});