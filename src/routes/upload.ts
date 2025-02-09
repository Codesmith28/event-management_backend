import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), uploadImage);

export default router;
