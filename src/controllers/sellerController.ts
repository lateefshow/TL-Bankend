import { Request, Response } from "express";
import Seller, { ISeller } from "../models/Seller.js";
import User, { IUser } from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";

interface IPopulatedSeller extends Omit<ISeller, "userId"> {
  userId: IUser;
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

interface AuthRequestWithFile extends AuthRequest {
  file?: Express.Multer.File;
}

export const getSellerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const seller = await Seller.findOne({ _id: req.params?.id }).populate(
      // const seller = await Seller.findOne({ userId: req.user?.id }).populate(
      "userId",
      "name email"
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({
      message: "Seller profile retrieved successfully",
      seller,
    });
  } catch (error) {
    console.error("Error retrieving seller profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSellerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { storeName, description, location, phone } = req.body;

    const seller = await Seller.findOneAndUpdate(
      { userId: req.user?.id },
      { storeName, description, location, phone, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("userId", "name email");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({
      message: "Seller profile updated successfully",
      seller,
    });
  } catch (error) {
    console.error("Error updating seller profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSellerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const seller = await Seller.findOneAndDelete({ userId: req.user?.id });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({
      message: "Seller profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadSellerLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const logoPath = `uploads/logos/${req.file.filename}`;

    const seller = await Seller.findOneAndUpdate(
      { userId: req.user?.id },
      { logo: logoPath, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("userId", "name email");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({
      message: "Seller logo updated successfully",
      logoUrl: logoPath,
      seller,
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    res.status(400).json({ message: "Server error" });
  }
};

export const getAllSellers = async (req: AuthRequest, res: Response) => {
  try {
    const sellers = await Seller.find().populate("userId", "name email");

    if (!sellers.length) {
      return res.status(404).json({ message: "No sellers found" });
    }

    res.status(200).json({
      message: "Sellers retrieved successfully",
      sellers,
    });
  } catch (error) {
    console.error("Error retrieving sellers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchSellers = async (req: AuthRequest, res: Response) => {
  try {
    const { query, location, category, topRated } = req.query;

    const filter: any = {};

    if (query && typeof query === "string") {
      filter.storeName = { $regex: query, $options: "i" };
    }

    if (location && typeof location === "string") {
      filter.location = { $regex: location, $options: "i" };
    }

    if (category && typeof category === "string") {
      filter.category = { $regex: category, $options: "i" };
    }

    let sellersQuery = Seller.find(filter).populate("userId", "name email");

    if (topRated === "true") {
      sellersQuery = sellersQuery.sort({ rating: -1 });
    }

    const sellers = await sellersQuery;

    if (!sellers.length) {
      return res
        .status(404)
        .json({ message: "No sellers found matching criteria" });
    }

    res.status(200).json({
      message: "Sellers retrieved successfully",
      sellers,
    });
  } catch (error) {
    console.error("Error searching sellers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCombinedSellerProfile = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId).populate(
      "userId",
      "name email address phone"
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const populatedSeller = seller as unknown as IPopulatedSeller;

    const combinedProfile = {
      _id: populatedSeller._id,
      storeName: populatedSeller.storeName,
      description: populatedSeller.description,
      logo: populatedSeller.storeLogo,
      businessCategory: populatedSeller.businessCategory,
      location: populatedSeller.location,
      phone: populatedSeller.phone,
      email: populatedSeller.email,
      user: {
        _id: populatedSeller.userId._id,
        name: populatedSeller.userId.name,
        address: populatedSeller.userId.address,
      },
    };

    res.status(200).json({
      message: "Seller profile retrieved successfully",
      seller: combinedProfile,
    });
  } catch (error) {
    console.error("Error retrieving seller profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createOrUpdateFullSellerProfile = async (
  req: AuthRequestWithFile,
  res: Response
) => {
  try {
    const { storeName, description, location, phone, businessCategory } =
      req.body;
    let logoUrl = null;

    if (req.file) {
      // Use Cloudinary to upload the logo
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "tradelink/logos", // Keep your logos organized
      });
      logoUrl = result.secure_url;
    }

    const sellerData = {
      storeName,
      description,
      location,
      phone,
      businessCategory,
      logo: logoUrl,
    };

    let seller = await Seller.findOne({ userId: req.user?.id });

    if (!seller) {
      seller = new Seller({
        userId: req.user?.id,
        ...sellerData,
        email: req.user?.email,
      });
      await seller.save();
      return res
        .status(201)
        .json({ message: "Seller profile created successfully", seller });
    } else {
      const updatedSeller = await Seller.findOneAndUpdate(
        { userId: req.user?.id },
        sellerData,
        { new: true, runValidators: true }
      );
      return res.status(200).json({
        message: "Seller profile updated successfully",
        seller: updatedSeller,
      });
    }
  } catch (error) {
    console.error("Error creating/updating seller profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
