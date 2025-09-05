import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  changePassword,
} from "../controllers/userController.js";
import userLogoUpload from "../middlewares/userLogoUpload.js";
import { protect } from "../middlewares/authMiddleware.js";

const router: Router = Router();

router.get("/get/profile", protect, getUserProfile);
router.put("/profile/update", protect, userLogoUpload, updateUserProfile);
router.delete("/profile/delete", protect, deleteUserProfile);
router.put("/change-password", protect, changePassword);

export default router;
