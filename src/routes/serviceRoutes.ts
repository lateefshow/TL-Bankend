import { Router } from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getSellerServices,
} from "../controllers/serviceController.js";
import { protect } from "../middlewares/authMiddleware.js";
import uploadServiceImages from "../middlewares/servicesUpload.js";

const router = Router();

// ---------------- SELLER ROUTES ----------------
// Create a new service with image upload
router.post("/create", protect, uploadServiceImages, createService);
// Update a service with optional new image upload
router.put("/edit/:serviceId", protect, uploadServiceImages, updateService);
// Delete a service
router.delete("/delete/:serviceId", protect, deleteService);
// Get all services by a specific seller
router.get("/seller/:sellerId", getSellerServices);

// ---------------- USER ROUTES ----------------
// Get all services with filtering and searching
router.get("/all", getAllServices);
// Get a single service by ID
router.get("/get/by/:serviceId", getServiceById);

export default router;
