// src/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("No file path provided for upload");
    }

    // Upload file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath); // remove temp file after upload
    return response;
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // cleanup failed upload
    }
    return {
      success: false,
      message: "Failed to upload file to Cloudinary",
      error: error.message,
    };
  }
};

export { uploadOnCloudinary };
export default cloudinary;
