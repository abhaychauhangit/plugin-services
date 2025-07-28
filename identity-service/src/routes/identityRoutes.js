import express from "express";
import {resgiterUser,
    loginUser,
    refreshTokenUser,
    logoutUser,
    getUsersForSidebar,} from "../controllers/identityController.js"
import { validateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", resgiterUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshTokenUser);
router.post("/logout", logoutUser);

router.get("/users", validateToken, getUsersForSidebar)

export default router;