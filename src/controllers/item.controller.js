import fs, { stat } from "fs";
import csvParser from "csv-parser";
import { createObjectCsvWriter as csvWriter } from 'csv-writer';
import sharp from "sharp";
import Stream from "stream";
import path from "path";
import axios from "axios";
import { Item } from "../model/item.model.js";
import { uploadOnCloudinary } from "../cloudinary.js";
import { sendWebhookUpdate } from "../webhook.js";
import { json2csv } from 'json-2-csv';
import objectsToCsv from "objects-to-csv";
import csvjson from "csvjson";
import CSV from "../model/csv.model.js";
import { error } from "console";
import { updateCSVStatus } from "./csv.controller.js";

let csvId = "";

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

async function uploadToDB(serialNumber, productName, inputImageUrls, outputImageUrls) {
    console.log("uploading to db: "+ csvId);
    const jsonData = [];
    try {
        const item = {
            serialNumber,
            name: productName,
            inputImageUrls: inputImageUrls,
            outputImageUrls: outputImageUrls,
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
        throw error; // Throw error to be caught in the calling function
    }
}

// Process the uploaded CSV file
const processCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrls = [];
        const rows = [];

        // Step 1: Process the CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csvParser())
                .on('data', (row) => {
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
                        reject(new Error('Invalid CSV format'));
                    }
                })
                .on('end', () => {
                    const newCSV = new CSV({
                        name: req.file.originalname,
                        itemIDs: [],
                        status: 'ID generated'
                    })

                    newCSV.save().then((response) => {
                        csvId = response._id;
                        console.log("ID generated: " + csvId);

                        // res.status(200).json({
                        //     request_id: csvId,
                        //     download_url: `http://localhost:3000/c/download?id=${csvId}`,
                        //     status: 'ID generated'
                        // })

                    }).catch((error) => {
                        console.error(`Error saving CSV to database: ${error}`);
                        sendWebhookUpdate('Database Upload', 'Failed', 'Error uploading CSV to database');

                        return res.status(500).json({ error: 'Internal server error while generating id' });
                    });
        
                    resolve();
                })
                .on('error', (error) => {
                    sendWebhookUpdate('CSV Processing', 'Failed', 'Error processing CSV file');
                    reject(new Error('Error processing CSV file'));
                });
        });

        // Step 2: Process each image sequentially
        for (const row of rows) {
            for (let i = 0; i < row.inputImageUrls.length; i++) {
                const url = row.inputImageUrls[i];
                const outputUrl = await processURL(url, `image-${row.serialNumber}-${i}.jpg`);
                if (outputUrl) {
                    row.outputImageUrls.push(outputUrl);
                } else {
                    console.error(`Failed to process URL: ${url}`);
                }

                // Save the processed data to the database
                await uploadToDB(row.serialNumber, row.productName, row.inputImageUrls, row.outputImageUrls);

                // update the status of the csv
                const resp = await updateCSVStatus(csvId, 'Processed Image-' + i);
                console.log("Status updated: " + resp);
            }
        }

        // update the status of the csv
        const resp = await updateCSVStatus(csvId, 'Completed');
    
        
    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({ error: 'Internal server error' });
        return null;
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
