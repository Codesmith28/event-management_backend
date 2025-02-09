// language: ts
import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";

export const uploadImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Ensure a file is provided
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Upload the file to Cloudinary; using the local file path provided by Multer.
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "events", // optional: organize uploads in a folder
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Image upload failed", error });
  }
};
