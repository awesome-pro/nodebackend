import {v2 as cloudinary} from "cloudinary"
import dotenv from "dotenv"
import fs from "fs"

dotenv.config()


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath){
            console.error("No file to upload on cloudinary")
            return null;
        }

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        console.log("file is uploaded on cloudinary ", response.url);
        
        return response;
    } catch (error) {
        console.error(`Error uploading image to Cloudinary: ${error}`);
        //fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }finally{
        //unink the file from the local storage
        console.log("unlinking the file from local storage" + localFilePath)
        fs.unlinkSync(localFilePath)
    }
}

export {uploadOnCloudinary}