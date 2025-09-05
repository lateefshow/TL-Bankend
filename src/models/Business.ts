import { randomUUID } from "crypto";
import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
    id: { type: randomUUID, required: true },
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    businessCategory: { type: String, required: true},
    businessDescription: { },
    Location: { },
    phoneNumber: {type: String, required: true },
    emailAddress: {type: String, required: true },
    Address: { type: String, required: true },
    businessLogo: { type: String, required: true }
})