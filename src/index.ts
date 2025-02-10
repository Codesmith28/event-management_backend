import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { initSocket } from "./socket";

// Import routes
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import uploadRoutes from "./routes/upload";
import cloudinary from "./config/cloudinary";

// Load environment variables
dotenv.config();
cloudinary;
const app = express();

// Increase payload size limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Updated CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/upload", uploadRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start the server with Socket.IO
connectDB()
  .then(() => {
    const server = http.createServer(app);
    initSocket(server);
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
  });
