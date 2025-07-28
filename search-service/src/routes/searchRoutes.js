import express from "express"
import { searchPostController } from "../controllers/searchControllers.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateRequest);

router.get("/posts", searchPostController);

export default router;