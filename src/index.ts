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

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

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
