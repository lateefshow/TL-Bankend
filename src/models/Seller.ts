import mongoose, { Document, Schema } from "mongoose";

export interface ISeller extends Document {
  userId: mongoose.Types.ObjectId;
  storeName: string;
  description?: string;
  location?: {
    city?: string;
    state?: string;
    coordinates?: [number, number];
  };
  phone?: string;
  email: string;
  storeLogo?: string;
  businessCategory?: string;
}

const SellerSchema: Schema = new Schema<ISeller>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    storeLogo: {
      type: String,
      required: false,
    },
    businessCategory: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Seller = mongoose.model<ISeller>("Seller", SellerSchema);

export default Seller;
