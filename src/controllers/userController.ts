import { Request, Response } from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { cloudinary } from "../config/cloudinary.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
  file?: Express.Multer.File;
}

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;
    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check for email conflict
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.id.toString() !== req.user?.id) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = email;
    }

    // Update other fields
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    // Handle logo upload from memory buffer
    if (req.file && typeof req.file.buffer !== "undefined") {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "users/logos", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });

      user.logo = (result as { secure_url: string }).secure_url;
    }

    await user.save();

    // Sanitize user object before sending
    const sanitizedUser = user.toObject();
    delete (sanitizedUser as { password?: string }).password;

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: sanitizedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user?.id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User profile deleted successfully",
      userId: req.user?.id,
    });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during password change",
    });
  }
};
