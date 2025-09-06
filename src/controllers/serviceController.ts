import { Request, Response } from "express";
import Service from "../models/Service.js";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";

// Extend the Request type to include the user object and file property
interface AuthenticatedRequest extends Request {
  user?: { _id: string };
  file?: any; // Change from 'files' to 'file' for multer.single()
}

/**
 * @desc Create a new service
 * @route POST /api/services/create
 * @access Private (Seller)
 */
export const createService = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { name, price, category, description, quantity } = req.body;
    const sellerId = req.user?._id;
    const file = req.file; // Change from 'files?.serviceImg' to 'file'

    if (!sellerId) {
      return res.status(401).json({ message: "Not authorized, seller ID missing" });
    }

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    let serviceImg = "";

    if (file) {
      try {
        // Upload the in-memory buffer directly to Cloudinary
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: "tradelink/services",
            use_filename: true,
          }
        );
        serviceImg = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    const newService = await Service.create({
      sellerId,
      name,
      price,
      category,
      description,
      quantity,
      serviceImg,
    });

    res.status(201).json({
      message: "Service created successfully",
      service: newService,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------

/**
 * @desc Update an existing service
 * @route PUT /api/services/edit/:serviceId
 * @access Private (Seller)
 */
export const updateService = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { serviceId } = req.params;
    const sellerId = req.user?._id;
    const updates = req.body;
    const file = req.files?.serviceImg;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if the authenticated user is the owner of the service
    if (service.sellerId.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this service" });
    }

    // If a new image is provided, upload it to Cloudinary and update the serviceImg URL
    if (file) {
      try {
        // Optional: Delete the old image from Cloudinary to free up space
        if (service.serviceImg) {
          const publicId = service.serviceImg.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`Tradelink-Services/${publicId}`);
          }
        }

        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "Tradelink-Services",
          use_filename: true,
        });
        updates.serviceImg = result.secure_url;
        fs.unlinkSync(file.tempFilePath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload new image" });
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------

/**
 * @desc Delete a service
 * @route DELETE /api/services/delete/:serviceId
 * @access Private (Seller)
 */
export const deleteService = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { serviceId } = req.params;
    const sellerId = req.user?._id;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if the authenticated user is the owner
    if (service.sellerId.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this service" });
    }

    // Optional: Delete the image from Cloudinary before deleting the document
    if (service.serviceImg) {
      try {
        const publicId = service.serviceImg.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`Tradelink-Services/${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        // Continue with database deletion even if image deletion fails
      }
    }

    await Service.findByIdAndDelete(serviceId);

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------

/**
 * @desc Get all services by a specific seller
 * @route GET /api/services/seller/:sellerId
 * @access Public
 */
export const getSellerServices = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const services = await Service.find({ sellerId });

    if (services.length === 0) {
      return res
        .status(404)
        .json({ message: "No services found for this seller" });
    }

    res.status(200).json({ services });
  } catch (error) {
    console.error("Error fetching seller services:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------

/**
 * @desc Get all services (with optional filtering)
 * @route GET /api/services/all
 * @access Public
 */
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let query: any = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    const services = await Service.find(query);

    res.status(200).json({ services });
  } catch (error) {
    console.error("Error fetching all services:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------

/**
 * @desc Get a single service by ID
 * @route GET /api/services/get/by/:serviceId
 * @access Public
 */
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({ service });
  } catch (error) {
    console.error("Error fetching service by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};
