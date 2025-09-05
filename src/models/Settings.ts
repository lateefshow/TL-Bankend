import mongoose, { Document, Schema } from "mongoose";

export interface ISellerSettings extends Document {
  sellerId: mongoose.Types.ObjectId;
  notifications: boolean;
  businessCategory?: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

const SellerSettingsSchema = new Schema<ISellerSettings>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    businessCategory: String,
    description: String,
    logo: String,
    address: String,
    phone: String,
    email: String,
    currentPassword: String,
    newPassword: String,
  },
  { timestamps: true }
);

export default mongoose.model<ISellerSettings>(
  "SellerSettings",
  SellerSettingsSchema
);
