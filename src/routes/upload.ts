import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController";

const router = express.Router();

// Configure multer for temporary storage
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Simplified route handler
router.post("/", upload.single("image"), (req, res, next) => {
  uploadImage(req, res).catch(next);
});

export default router;
