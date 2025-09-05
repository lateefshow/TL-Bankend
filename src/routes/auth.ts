import { Router } from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router: Router = Router();

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/logout", protect, logout);
export default router;
