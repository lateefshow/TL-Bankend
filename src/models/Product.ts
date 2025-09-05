import mongoose, { Document } from "mongoose";

export interface IProducts extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  category?:
    | "Groceries & Essentials"
    | "Fresh & Perishables"
    | "Fashion & Clothing"
    | "Home & Kitchen"
    | "Building Materials & Hardware"
    | "Electronics & Gadgets"
    | "Automobile & Parts"
    | "Health & Beauty"
    | "Toys, Baby & Kids"
    | "Sports & Fitness"
    | "Books, Stationery & Office";
  quantity?: number;
  description?: string;
  productImg?: string;
}

const productSchema = new mongoose.Schema<IProducts>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "Groceries & Essentials",
        "Fresh & Perishables",
        "Fashion & Clothing",
        "Home & Kitchen",
        "Building Materials & Hardware",
        "Electronics & Gadgets",
        "Automobile & Parts",
        "Health & Beauty",
        "Toys, Baby & Kids",
        "Sports & Fitness",
        "Books, Stationery & Office",
      ],
    },
    quantity: { type: Number },
    description: { type: String },
    productImg: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProducts>("Product", productSchema);
