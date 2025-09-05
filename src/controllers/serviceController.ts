// controllers/serviceController.ts
import { Request, Response } from "express";
import Service from "../models/Service";
import { cloudinary } from "../config/cloudinary";

export const createService = async (req: Request, res: Response) => {
  try {
    const { sellerId, name, price, category, quantity, description } = req.body;

    // ✅ Validate required fields
    if (!sellerId || !name || !price) {
      return res.status(400).json({
        success: false,
        message: "sellerId, name, and price are required.",
      });
    }

    let serviceImgUrl: string | undefined;

    // ✅ Handle image upload to Cloudinary if file exists
    if (req.file) {
      const uploadedImg = await cloudinary.uploader.upload_stream(
        { folder: "services" },
        (error, result) => {
          if (error) {
            throw new Error("Image upload failed: " + error.message);
          }
          return result;
        }
      );

      // Since upload_stream works with a stream, we wrap it:
      serviceImgUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "services" },
          (err, result) => {
            if (err) return reject(err);
            resolve(result?.secure_url || "");
          }
        );
        stream.end(req.file.buffer);
      });
    }

    // ✅ Create new service
    const newService = new Service({
      sellerId,
      name,
      price,
      category,
      quantity,
      description,
      serviceImg: serviceImgUrl,
    });

    await newService.save();

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: newService,
    });
  } catch (error: any) {
    console.error("Error creating service:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating service",
    });
  }
};
