import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  rating: number; // 1–5
  comment?: string;
}

const ReviewSchema: Schema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>("Review", ReviewSchema);
