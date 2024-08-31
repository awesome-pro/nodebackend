import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import csvParser from "csv-parser";
import Stream from "stream";
import path from "path";
import axios from "axios";
import { Item } from "../model/item.model.js";
import { uploadOnCloudinary } from "../cloudinary.js";
import { sendWebhookUpdate } from "../webhook.js";


// Handle the CSV processing and image uploading
function validateRow(row) {
    return (
        row.hasOwnProperty('Serial Number') &&
        row.hasOwnProperty('Product Name') &&
        row.hasOwnProperty('Input Image Urls')
    );
}


// Download an image from a URL and save it to the input directory
async function downloadImage(url, filename) {
    await sendWebhookUpdate('Downloading Image', 'In Progress', 'Uploading images to Cloudinary');
    const inputDirectory = path.join('uploads', 'input');

    // Ensure the input directory exists
    if (!fs.existsSync(inputDirectory)) {
        fs.mkdirSync(inputDirectory, { recursive: true });
    }

    const filePath = path.join(inputDirectory, filename);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream', // Important: makes axios return a readable stream
        });

        // Pipe the response data directly to a file
        response.data.pipe(fs.createWriteStream(filePath));
        await sendWebhookUpdate('Downloading Image', 'Completed', 'Image downloaded successfully');

        // Return a promise that resolves when the stream finishes writing
        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve(filePath);
            });

            response.data.on('error', err => {
                reject(err);
            });
        });
    } catch (error) {
        await sendWebhookUpdate('Failed Downloading Image', 'Failed', 'Error downloading image');
        console.error(`Error downloading image from ${url}:`, error);
    }
}


// Resize and compress an image
async function resizeAndCompressImage(inputFilePath, outputFileName) {
    await sendWebhookUpdate('Resizing Image', 'In Progress', 'Resizing and compressing images');
    const outputDirectory = path.join('./public', 'uploads');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const outputFilePath = path.join(outputDirectory, outputFileName);

    try {
        // Get image metadata to determine original size
        const metadata = await sharp(inputFilePath).metadata();
        console.log(`Image size: ${metadata.width}x${metadata.height}`);

        // Calculate new dimensions (50% of original size)
        const newWidth = Math.floor(metadata.width / 2);
        const newHeight = Math.floor(metadata.height / 2);

        // Resize and compress the image
        await sharp(inputFilePath)
            .resize(newWidth, newHeight) // Resize to 50% of original size
            .webp({ quality: 50 }) // Reduce size by 50%
            .jpeg({ quality: 50 }) // Reduce quality by 50%
            .png({ quality: 50 }) // Reduce quality by 50%
            .toFile(outputFilePath);

        console.log(`Image resized and compressed. Saved to ${outputFilePath}`);
        await sendWebhookUpdate('Resizing Image', 'Completed', 'Image resized and compressed successfully');
        return outputFilePath;
    } catch (error) {
        console.error(`Error processing image: ${error}`);
        await sendWebhookUpdate('Resizing Image', 'Failed', 'Error resizing image');
        return null;
    }
}


// Process the uploaded CSV file
const processCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        await sendWebhookUpdate('CSV Processing', 'In Progress', 'Processing CSV file');

        const imageUrls = [];
        const finalObjects = [];
        const rows = [];

        // Use a promise to handle the completion of CSV processing
       // Use a promise to handle the completion of CSV processing
       const csvProcessingPromise = new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
            .pipe(csvParser())
            .on('data', (row) => {
                if (validateRow(row)) {
                    const urls = row['Input Image Urls'].split(',').map(url => url.trim());
                    rows.push(row);
                    imageUrls.push(...urls);
                } else {
                    sendWebhookUpdate('CSV Processing', 'Failed', 'Invalid CSV format');
                    reject('Invalid CSV format');
                }
            })
            .on('end', () => {
                sendWebhookUpdate('CSV Processing', 'Completed', 'CSV file successfully processed');
                console.log('CSV file successfully processed');
                resolve();
            })
            .on('error', (error) => {
                sendWebhookUpdate('CSV Processing', 'Failed', 'Error processing CSV file');
                console.log('Error processing CSV file');
                reject('Error processing CSV file');
            });
    });

        // Wait for the CSV processing to complete
        await csvProcessingPromise;
        await sendWebhookUpdate('Image Processing', 'In Progress', 'Processing images');

        // Process all images and upload them asynchronously
        const processingPromises = imageUrls.map(async (url, index) => {
            const filename = `image-${index}.jpg`;
            const filePath = await downloadImage(url, filename);
            const compressedFilePath = await resizeAndCompressImage(filePath, filename);

            if (compressedFilePath) {
                const cloudinaryUrl = await uploadOnCloudinary(compressedFilePath, filename);

                if (cloudinaryUrl) {
                    console.log(`Image uploaded to Cloudinary: ${cloudinaryUrl}`);

                    const newItem = {
                        serialNumber: rows[index]['Serial Number'],
                        productName: rows[index]['Product Name'],
                        imageUrl: cloudinaryUrl.secure_url.toString(),
                    };

                    const result = await uploadToDB(newItem.serialNumber, newItem.productName, newItem.imageUrl);
                    if (result) {
                        console.log(`Item uploaded to database: ${result}`);
                        finalObjects.push(newItem);
                    }

                    // Clean up files
                    fs.unlinkSync(compressedFilePath); // Clean up compressed image
                }

                fs.unlinkSync(filePath); // Clean up original image
            }
        });

        // Wait for all image processing and database uploads to complete
        await Promise.all(processingPromises);

        // Send the final response after all processing is complete
        res.json({ images: imageUrls, finalObjects: finalObjects });

    } catch (error) {
        console.error(`Error handling request: ${error}`);
        return res.status(500).json({ error: 'Error handling request' });
    }
};

async function uploadToDB(serialNumber, productName, inputImageUrls, imageUrl) {
    await sendWebhookUpdate('Database Upload', 'In Progress', 'Uploading items to database');
    try {
        const item = new Item({
            serialNumber,
            name: productName,
            inputImageUrls: [imageUrl],
            outputImageUrl: [imageUrl],
        });
        const response = await item.save();
        if (response) {
            console.log(`Item saved to database: ${response}`);
            await sendWebhookUpdate('Database Upload', 'Completed', 'Items uploaded to database');
            return response; // Return the response to indicate success
        } else {
            console.log('Item not saved to database');
            await sendWebhookUpdate('Database Upload', 'Failed', 'Error uploading items to database');
            return null;
        }
    } catch (error) {
        console.error(`Error saving item to database: ${error}`);
        await sendWebhookUpdate('Downloading Image', 'In Progress', 'Uploading images to Cloudinary');
        throw error; // Throw error to be caught in the calling function
    }
}

// Handle the CSV processing and image uploading

// Upload an item to the databas

export {
    processCSV,
    downloadImage,
    resizeAndCompressImage,
    validateRow,
    uploadToDB
}
