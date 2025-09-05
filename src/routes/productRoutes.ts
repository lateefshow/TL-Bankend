import { Router } from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getAllProducts,
  getProductById,
} from "../controllers/productController.js";
import { protect } from "../middlewares/authMiddleware.js";
import productUpload from "../middlewares/productUpload.js";

const router = Router();

// Seller Routes
router.post("/create", protect, productUpload, createProduct);
router.get("/seller/:sellerId", getSellerProducts);
router
  .route("/:productId")
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

// Public Routes
router.get("/:productId", getProductById);
router.get("/", getAllProducts);

export default router;
