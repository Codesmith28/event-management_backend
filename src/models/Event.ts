import mongoose from "mongoose";
import { IEvent } from "../types";

const eventSchema = new mongoose.Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    imageUrl: { type: String, required: true },
    category: { type: String, required: true },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // New properties for seat bookings
    seatsTotal: { type: Number, required: true, default: 100 },
    bookedSeats: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>("Event", eventSchema);
