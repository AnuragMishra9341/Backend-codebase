import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // This comes with node js itself used to read write the file basically hanles file managment

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadonCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",   // This automatically set wheter the given file is image or video 
    });
          // Clean up the local file after successful upload
       fs.unlinkSync(localFilePath);

    // file has been uploaded successfully    
    //console.log("file is uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload
    // operation got failed
    return null;
  }
};

export default uploadonCloudinary;
