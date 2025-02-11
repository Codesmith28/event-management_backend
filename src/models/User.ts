import mongoose from "mongoose";
import { IUser } from "../types";

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "user", "guest"],
      default: "user",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
