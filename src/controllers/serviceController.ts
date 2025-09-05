// controllers/serviceController.ts
import { Request, Response } from "express";
import Service from "../models/Service.js";
import mongoose from "mongoose";

import { cloudinary } from "../config/cloudinary.js";

interface AuthRequestWithFile extends Request {
  user?: {
    id: string;
    role: string;
  };
  file?: Express.Multer.File;
}

/**
 * Create a new service (Seller only)
 */
export const createService = async (
  req: AuthRequestWithFile,
  res: Response
) => {
  try {
    // Check if user is authenticated and has seller role
    if (!req.user || req.user.role !== "seller") {
      return res
        .status(403)
        .json({ message: "Only sellers can create services" });
    }

    const { name, price, category, quantity, description } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    // Validate price is a positive number
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res
        .status(400)
        .json({ message: "Price must be a valid positive number" });
    }

    // Validate category if provided
    if (
      category &&
      ![
        "Hair Stylist",
        "Fashion Designer",
        "Caterer",
        "Plumber",
        "Mechanic",
        "Photographer",
        "Electrician",
        "Makeup Artist",
        "Barber",
        "Cleaner",
        "Car Wash",
        "Other",
      ].includes(category)
    ) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Handle image upload
    let serviceImg = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "tradelink/services",
        });
        serviceImg = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Error uploading image" });
      }
    }

    // Create service
    const service = await Service.create({
      sellerId: req.user.id,
      name,
      price: parsedPrice,
      category,
      quantity: quantity ? Number(quantity) : undefined,
      description,
      serviceImg,
    });

    return res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    return res.status(500).json({
      message: "Server error while creating service",
      error: error.message,
    });
  }
};

/**
 * Update an existing service (Seller only)
 */
export const updateService = async (
  req: AuthRequestWithFile,
  res: Response
) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { serviceId } = req.params;
    const { name, price, category, quantity, description } = req.body;

    // Validate serviceId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    // Validate price
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res
        .status(400)
        .json({ message: "Price must be a valid positive number" });
    }

    // Validate category if provided
    if (
      category &&
      ![
        "Hair Stylist",
        "Fashion Designer",
        "Caterer",
        "Plumber",
        "Mechanic",
        "Photographer",
        "Electrician",
        "Makeup Artist",
        "Barber",
        "Cleaner",
        "Car Wash",
        "Other",
      ].includes(category)
    ) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Check if service exists and belongs to the seller
    const existingService = await Service.findOne({
      _id: serviceId,
      sellerId: req.user.id,
    });
    if (!existingService) {
      return res.status(404).json({
        message: "Service not found or you are not authorized to update it",
      });
    }

    // Handle image upload
    let serviceImg = existingService.serviceImg;
    if (req.file) {
      try {
        // Delete old image if exists
        if (existingService.serviceImg) {
          const publicId = existingService.serviceImg
            .split("/")
            .pop()
            ?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`tradelink/services/${publicId}`);
          }
        }
        // Upload new image
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "tradelink/services",
        });
        serviceImg = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Error uploading image" });
      }
    }

    // Update service
    const updatedService = await Service.findOneAndUpdate(
      { _id: serviceId, sellerId: req.user.id },
      {
        name,
        price: parsedPrice,
        category,
        quantity: quantity ? Number(quantity) : undefined,
        description,
        serviceImg,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(500).json({
      message: "Server error while updating service",
      error: error.message,
    });
  }
};

/**
 * Delete a service (Seller only)
 */
export const deleteService = async (
  req: AuthRequestWithFile,
  res: Response
) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { serviceId } = req.params;

    // Validate serviceId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    // Check if service exists and belongs to the seller
    const service = await Service.findOne({
      _id: serviceId,
      sellerId: req.user.id,
    });
    if (!service) {
      return res.status(404).json({
        message: "Service not found or you are not authorized to delete it",
      });
    }

    // Delete image from Cloudinary if exists
    if (service.serviceImg) {
      const publicId = service.serviceImg.split("/").pop()?.split(".")[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`tradelink/services/${publicId}`);
        } catch (uploadError) {
          console.error("Cloudinary delete error:", uploadError);
        }
      }
    }

    // Delete service
    await Service.deleteOne({ _id: serviceId });

    return res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return res.status(500).json({
      message: "Server error while deleting service",
      error: error.message,
    });
  }
};

/**
 * Get all services by a specific seller
 */
export const getSellerServices = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const services = await Service.find({ sellerId }).populate(
      "sellerId",
      "name email"
    );

    return res.status(200).json({
      message: "Services retrieved successfully",
      services,
    });
  } catch (error) {
    console.error("Error fetching seller services:", error);
    return res.status(500).json({
      message: "Server error while fetching seller services",
      error: error.message,
    });
  }
};

/**
 * Get all services with filtering and searching
 */
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const query: any = {};

    // Apply filters
    if (category) {
      if (
        ![
          "Hair Stylist",
          "Fashion Designer",
          "Caterer",
          "Plumber",
          "Mechanic",
          "Photographer",
          "Electrician",
          "Makeup Artist",
          "Barber",
          "Cleaner",
          "Car Wash",
          "Other",
        ].includes(category as string)
      ) {
        return res.status(400).json({ message: "Invalid category" });
      }
      query.category = category;
    }
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        const parsedMinPrice = Number(minPrice);
        if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
          return res.status(400).json({ message: "Invalid minPrice" });
        }
        query.price.$gte = parsedMinPrice;
      }
      if (maxPrice) {
        const parsedMaxPrice = Number(maxPrice);
        if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
          return res.status(400).json({ message: "Invalid maxPrice" });
        }
        query.price.$lte = parsedMaxPrice;
      }
    }

    const services = await Service.find(query).populate(
      "sellerId",
      "name email"
    );

    return res.status(200).json({
      message: "Services retrieved successfully",
      services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({
      message: "Server error while fetching services",
      error: error.message,
    });
  }
};

/**
 * Get a single service by ID
 */
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    // Validate serviceId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(serviceId).populate(
      "sellerId",
      "name email"
    );
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.status(200).json({
      message: "Service retrieved successfully",
      service,
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    return res.status(500).json({
      message: "Server error while fetching service",
      error: error.message,
    });
  }
};
