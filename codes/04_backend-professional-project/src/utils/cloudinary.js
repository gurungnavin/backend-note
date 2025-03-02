import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import 'dotenv/config' // correction while debugging

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
  
    let response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // Retrun The uploaded file URL
    // console.log("✅ Upload Success:", response.url);
    fs.unlinkSync(localFilePath)
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    // remove the locally saved temp file as the upload operation failed
    return null;
  }
};

export { uploadOnCloudinary };
