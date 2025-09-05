import mongoose, { Document } from "mongoose";

export interface IServices extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  category?:
    | "Hair Stylist"
    | "Fashion Designer"
    | "Caterer"
    | "Plumber"
    | "Mechanic"
    | "Photographer"
    | "Electrician"
    | "Makeup Artist"
    | "Barber"
    | "Cleaner"
    | "Car Wash"
    | "Other";
  quantity?: number;
  description?: string;
  serviceImg?: string;
}

const serviceSchema = new mongoose.Schema<IServices>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Changed from "Seller" to "User"
      required: true, // Prevent null sellerId
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: [
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
      ],
    },
    quantity: { type: Number },
    description: { type: String },
    serviceImg: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IServices>("Service", serviceSchema);
