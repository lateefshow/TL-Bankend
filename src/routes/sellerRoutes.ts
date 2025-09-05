import { Router } from "express";
import {
  getSellerProfile,
  updateSellerProfile,
  deleteSellerProfile,
  getAllSellers,
  searchSellers,
  getCombinedSellerProfile,
  createOrUpdateFullSellerProfile,
} from "../controllers/sellerController.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/userLogoUpload.js";

const router: Router = Router();
router.get("/get/profile/:id", protect, getSellerProfile);
router.put("/edit/profile", protect, updateSellerProfile);
router.delete("/delete/profile", protect, deleteSellerProfile);
router.get("/get/all/sellers", protect, getAllSellers);
router.get("/search", protect, searchSellers);

// ✅ Dynamic route LAST
router.get("/:sellerId", protect, getCombinedSellerProfile);
export default router;
