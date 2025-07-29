import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";



import {app, server} from "./lib/socket.js";

import { connectDB } from "./lib/db.js";


import messageRoutes from "./routes/message.js";


dotenv.config();


const PORT = process.env.PORT;


app.use(helmet());
app.use(express.json());
app.use(cors());


app.use("/api/messages", messageRoutes);


server.listen(PORT, () => {
    console.log(`server is running on PORT: ${PORT}`);
    connectDB();
});
