import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  sellerId: mongoose.Types.ObjectId;
  type: "order" | "message" | "review" | "system";
  message: string;
  read: boolean;
}

const NotificationSchema: Schema = new Schema<INotification>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    type: {
      type: String,
      enum: ["order", "message", "review", "system"],
      default: "system",
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
