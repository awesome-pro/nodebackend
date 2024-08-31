import mongoose from "mongoose";
import dotenv from "dotenv";
import CSV from "../model/csv.model.js";
import { Item } from "../model/item.model.js";
import { json2csv } from "json-2-csv";
import fs from "fs";
import path from "path";
import { resolve } from "path";
import csvjson from "csvjson";
import connectDB from "../lib/db.js";
import { Parser } from "json2csv";

dotenv.config();


function addCSVToDB(name, itemIDs, status) {
    const newCSV = new CSV({
        name,
        itemIDs,
        status
    });

    return newCSV.save();
}

async function getCSVStatusById(id) {
    return CSV.findById(id);
}

async function updateCSVStatus(id, status) {
    return CSV.findByIdAndUpdate(id, { status}, { new: true });
}

async function addItemToCSV(id, itemID) {
    const csv = await CSV.findById(id);
    csv.itemIDs.push(itemID);
    return csv.save();
}


async function downloadCSV(res, id) {
    try {
        console.log(`Downloading CSV with id: ${id}`);

        // Step 1: Ensure database connection is established
        await connectDB();

        // Step 2: Fetch the CSV record from the database
        const csv = await CSV.findById(id);

        // Step 3: Check if the CSV record exists
        if (!csv) {
            return res.status(404).json({ error: 'CSV not found' });
        }

        // Step 4: Check if the CSV processing is completed
        if (csv.status !== 'Completed') {
            return res.status(400).json({ error: 'CSV not yet generated', status: csv.status, download_url: `http://localhost:3000/c/download?id=${id}` });
        }

        // Step 5: Process the JSON data from the CSV record
        const jsonData = csv.items;
        console.log(jsonData);

        // Step 6: Convert the JSON data to CSV format
        const outputFilePath = `output-${id}.csv`;
        await covertJSONtoCSV(jsonData, outputFilePath);

        // Step 7: Send the file to the client for download
        res.download(outputFilePath, `output-${id}.csv`, (err) => {
            if (err) {
                console.error('Error downloading CSV:', err);
                return res.status(500).json({ error: 'Internal server error' });
            } else {
                // Step 8: Cleanup the file after successful download
                fs.unlinkSync(outputFilePath);
            }
        });
    } catch (error) {
        console.error('Error during CSV download:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function covertJSONtoCSV(jsonData, outputFilePath) {
    return new Promise((resolve, reject) => {
        try {
            const csvData = jsonData.map(item => ({
                'Serial Number': item.serialNumber,
                'Product Name': item.name,
                'Input Image Urls': item.inputImageUrls.join(', '),
                'Output Image Urls': item.outputImageUrls.join(', ')
            }));

            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(csvData);

            // Write the CSV data to a file
            fs.writeFile(outputFilePath, csv, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                    return reject(err);
                } else {
                    console.log('CSV file has been saved successfully.');
                    resolve();
                }
            });
        } catch (error) {
            console.error(`Error converting JSON to CSV: ${error}`);
            reject(error);
        }
    });
}

async function returnStatusOfCSV(id) {
    try {
        console.log(`Downloading CSV with id: ${id}`);

        // Step 1: Ensure database connection is established
        await connectDB();

        // Step 2: Fetch the CSV record from the database
        const csv = await CSV.findById(id);

        // Step 3: Check if the CSV record exists
        if (!csv) {
            return 'CSV not found';
        }

        return csv.status;
    } catch (error) {
        console.error(`Error fetching CSV status: ${error}`);
        return 'Error fetching CSV status';
    }
}

export {
    addCSVToDB,
    getCSVStatusById,
    updateCSVStatus,
    addItemToCSV,
    downloadCSV,
    returnStatusOfCSV
}