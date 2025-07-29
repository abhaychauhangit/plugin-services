import express from "express";
import { getMessages, sendMessage } from "../controllers/message.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

const upload = multer();

router.get("/:id", authenticateRequest, getMessages);


router.post("/send/:id", authenticateRequest, upload.none(), sendMessage);

export default router;