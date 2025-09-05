import { Request, Response } from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js"; // Assuming a User model exists for population

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Send a message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId, content } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Ensure recipientId is provided and is a valid ObjectId
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient ID" });
    }

    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      content,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all messages between logged-in user and another user
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, recipientId: userId },
        { senderId: userId, recipientId: req.user.id },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({
      message: "Conversation retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error retrieving conversation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all user conversations (last message per participant)
export const getUserConversations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
              "$recipientId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      // Lookup the user details for the other participant in the conversation
      {
        $lookup: {
          from: "users", // Assuming the users collection is named 'users'
          localField: "_id",
          foreignField: "_id",
          as: "participant",
        },
      },
      {
        $unwind: "$participant",
      },
      // Project to format the output nicely, showing key details
      {
        $project: {
          _id: "$lastMessage._id",
          content: "$lastMessage.content",
          senderId: "$lastMessage.senderId",
          recipientId: "$lastMessage.recipientId",
          createdAt: "$lastMessage.createdAt",
          read: "$lastMessage.read",
          participant: {
            _id: "$participant._id",
            username: "$participant.username", // Replace with the actual field for username
            // Add other user fields you want to display, e.g., 'profilePicture'
          },
        },
      },
    ]);

    res.status(200).json({
      message: "Conversations retrieved successfully",
      data: conversations,
    });
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark a message as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Authorization check: Only the recipient can mark a message as read
    if (message.recipientId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to perform this action" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );

    res.status(200).json({
      message: "Message marked as read",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Authorization check: Only the sender or recipient can delete the message
    if (
      message.senderId.toString() !== req.user.id &&
      message.recipientId.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to perform this action" });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error" });
  }
};
