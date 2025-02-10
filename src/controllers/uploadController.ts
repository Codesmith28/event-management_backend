import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload the file from the temporary path
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "swissmote",
      resource_type: "auto",
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    // Clean up temporary file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Upload error:", error);
    return res.status(500).json({
      message: "Upload failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
