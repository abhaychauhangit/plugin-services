import express from "express";
import multer from "multer";

import {
  uploadMedia,
  getAllMedias,
} from "../controllers/mediaControllers.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";


const router = express.Router();


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    console.log("req recieved for upload")
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        console.log("Multer error while uploading:", err);
        return res.status(400).json({
          message: "Multer error while uploading:",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        console.log("Unknown error occured while uploading:", err);
        return res.status(500).json({
          message: "Unknown error occured while uploading:",
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "No file found!",
        });
      }

      next();
    });
  },
  uploadMedia
);

router.get("/get", authenticateRequest, getAllMedias);

export default router;