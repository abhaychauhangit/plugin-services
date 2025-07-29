import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import mediaRoutes from "./routes/mediaRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { connectToRabbitMQ, consumeEvent } from './utils/rabbitmq.js';
import { handlePostDeleted } from './eventHandlers/mediaEventHandler.js';


dotenv.config();



const app = express();
const PORT = process.env.PORT || 5003;


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to mongodb"))
  .catch((e) => console.log("Mongo connection error", e));

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log(`Request body, ${req.body}`);
  next();
});



app.use("/api/media", mediaRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      console.log(`Media service running on port ${PORT}`);
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