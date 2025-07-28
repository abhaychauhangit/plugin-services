import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import Redis from "ioredis";
import searchRoutes from "./routes/searchRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { connectToRabbitMQ, consumeEvent } from './utils/rabbitmq.js';
import { handlePostCreated, handlePostDeleted } from './eventHandlers/mediaEventHandler.js';
import { createIndex } from './utils/createIndex.js';


dotenv.config();


const app = express();
const PORT = process.env.PORT || 50004;


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to mongodb"))
  .catch((e) => console.log("Mongo connection error", e));

const redisClient = new Redis(process.env.UPSTASH_REDIS_URL, {tls: {}});


app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log(`Request body, ${req.body}`);
  next();
});




app.use("/api/search",(req, res), next => {
  req.redisClient = redisClient;
  next();
}, searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);

    createIndex().then(() => {
      console.log('Index created successfully or already exists.');
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    })


    
  } catch (e) {
    console,log(e, "Failed to start search service");
    process.exit(1);
  }
}

startServer();