import { Router } from "express";
import {
  sendMessage,
  getConversation,
  getUserConversations,
  markAsRead,
  deleteMessage,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// Send a new message
router.post("/send", protect, sendMessage);

// Get all messages between logged-in user and another user
// Changed the route to be more descriptive of its function
router.get("/conversation/:userId", protect, getConversation);

// Get all conversations (last message per participant)
router.get("/get/conversations", protect, getUserConversations);

// Mark a message as read
router.patch("/read/:messageId", protect, markAsRead);

// Delete a message
router.delete("/delete/:messageId", protect, deleteMessage);

export default router;
