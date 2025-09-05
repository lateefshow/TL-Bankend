import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db.js";

import auth from "./routes/auth.js";
import user from "./routes/userRoutes.js";
import seller from "./routes/sellerRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";

dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;

app.use(cors());
app.use(express.json());
// app.use("/uploads", express.static("uploads"));

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/auth", auth);
app.use("/api/v1/users", user);
app.use("/api/v1/sellers", seller);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/services", serviceRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to TradeLink Backend server");
});

connectDB()
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
