import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: 'dzexgoj6r',
  api_key: '452482966522194', 
  api_secret: 'qowRzPeXQQ_t7aG5QX2uTMORrA8'
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
        // file has been uploaded successfully on cloudinary
        return response;
    } catch (error) {
        console.error(`Error uploading image to Cloudinary: ${error}`);
        //fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}