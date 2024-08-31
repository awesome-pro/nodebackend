import fs from "fs";
import csvParser from "csv-parser";
import sharp from "sharp";
import path from "path";
import axios from "axios";
import { uploadOnCloudinary } from "../cloudinary.js";
import { sendWebhookUpdate } from "../webhook.js";
import CSV from "../model/csv.model.js";
import { updateCSVStatus } from "./csv.controller.js";


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
    const inputDirectory = path.join('public', 'input');

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
        console.error(`Error downloading image from ${url}:`, error);
    }
}


// Resize and compress an image
async function resizeAndCompressImage(inputFilePath, outputFileName) {
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
        // unlink the input  file from the local storage
        console.log("unlinking the file from local storage" + inputFilePath)
        fs.unlinkSync(inputFilePath);

        return outputFilePath;
    } catch (error) {
        console.error(`Error processing image: ${error}`);
        return null;
    }
}

async function uploadToDB(serialNumber, productName, inputImageUrls, outputImageUrls, csvId) {
    console.log("uploading to db: "+ csvId);
    const jsonData = [];
    try {
        const item = {
            serialNumber,
            name: productName,
            inputImageUrls: inputImageUrls,
            outputImageUrls: outputImageUrls,
        }

        if (!csvId) {
            console.error('CSV ID not found');
            return null;
        }

        const response = await CSV.findByIdAndUpdate(csvId, { $push: { items: item } }, { new: true });

        console.log(response);
        if (response) {
            console.log(`Item saved to database: ${response}`);
            jsonData.push(item);
        } else {
            console.log('Item not saved to database');
            return null;
        }

        //saveDataToCSVAndSendResponse(jsonData);
    } catch (error) {
        console.error(`Error saving item to database: ${error}`);
        return null;
    }
}

// Process the uploaded CSV file
const processCSV = async (req, res) => {
    let csvId = "";
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrls = [];
        const rows = [];

        // Step 1: Process the CSV file
        await new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(req.file.path)
                .pipe(csvParser())
                .on('data', (row) => {
                    try {
                        if (validateRow(row)) {
                            const inputUrls = row['Input Image Urls'].split(',').map(url => url.trim());
                            imageUrls.push(...inputUrls);
                            rows.push({
                                serialNumber: row['Serial Number'],
                                productName: row['Product Name'],
                                inputImageUrls: inputUrls,
                                outputImageUrls: [] // Placeholder for output URLs
                            });

                            console.log(`Row processed: ${JSON.stringify(row)}`);
                        } else {
                            readStream.destroy(); // Stop further processing
                            reject(new Error('Invalid CSV format'));
                        }
                    } catch (error) {
                        reject(new Error(`Error processing row: ${error.message}`));
                    }
                })
                .on('end', async () => {
                    try {
                        const newCSV = new CSV({
                            name: req.file.originalname,
                            itemIDs: [],
                            status: 'ID generated'
                        });

                        const response = await newCSV.save();
                        csvId = response._id;
                        console.log("ID generated: " + csvId);

                        res.status(200).json({
                            request_id: csvId,
                            download_url: `http://localhost:3000/csv/download?id=${csvId}`,
                            status: 'ID generated',
                            status_url: `http://localhost:3000/csv/status?id=${csvId}`
                        });

                        resolve();
                    } catch (error) {
                        console.error(`Error saving CSV to database: ${error}`);
                        sendWebhookUpdate('Database Upload', 'Failed', 'Error uploading CSV to database');
                        return res.status(500).json({ error: 'Internal server error while generating ID' });
                    }
                })
                .on('error', (error) => {
                    console.error('Error processing CSV file:', error);
                    reject(new Error('Error processing CSV file'));
                });
        });

        // Step 2: Process each image sequentially
        for (const row of rows) {
            for (let i = 0; i < row.inputImageUrls.length; i++) {
                try {
                    const url = row.inputImageUrls[i];
                    const outputUrl = await processURL(url, `image-${row.serialNumber}-${i}.jpg`);
                    if (outputUrl) {
                        row.outputImageUrls.push(outputUrl);
                    } else {
                        console.error(`Failed to process URL: ${url}`);
                    }

                    // Save the processed data to the database
                    await uploadToDB(row.serialNumber, row.productName, row.inputImageUrls, row.outputImageUrls, csvId);

                    // Update the status of the CSV
                    const resp = await updateCSVStatus(csvId, `Processed Image-${i}`);
                    console.log("Status updated: " + resp);
                } catch (error) {
                    console.error(`Error processing image ${i} for row ${row.serialNumber}:`, error);
                    // Continue processing the next image or row
                }
            }
        }

        // Step 3: Update the final status of the CSV
        try {
            await updateCSVStatus(csvId, 'Completed');
            console.log("Status updated: Completed");
        } catch (error) {
            console.error('Error updating final status to Completed:', error);
        }

    } catch (error) {
        console.error('Error processing CSV:', error);
        return res.status(500).json({ error: 'Internal server error during CSV processing' });
    } finally {
        // Step 4: Cleanup the uploaded CSV file
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path); // Delete the uploaded CSV file
                console.log('Uploaded CSV file cleaned up');
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded CSV file:', cleanupError);
            }
        }
    }
};



const processURL = async (url, filename) => {
    try {
        const downloadedImage = await downloadImage(url, filename,);
        if (downloadedImage) {
            const compressedImage = await resizeAndCompressImage(downloadedImage, filename);
            if (compressedImage) {
                const cloudinaryUrl = await uploadOnCloudinary(compressedImage);
                if (cloudinaryUrl) {
                    return cloudinaryUrl.secure_url; // Return the URL of the uploaded image
                }
            }
        }
        return null;
    } catch (error) {
        console.error(`Error processing URL: ${url}`, error);
        return null;
    }
};


// converting back json to csv


export {
    processCSV,
    downloadImage,
    resizeAndCompressImage,
    validateRow,
    uploadToDB
}
