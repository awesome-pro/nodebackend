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
        const csvData = json2csv(jsonData);

        const csvFilePath = path.join('public', `output-${id}.csv`);

        // Step 7: Write the CSV data to a file
        fs.writeFileSync(csvFilePath, csvData, 'utf-8');
        console.log(`CSV file created at ${csvFilePath}`);

        // Step 8: Send the file to the client for download
        res.download(csvFilePath, `output-${id}.csv`, (err) => {
            // Handle download error and unlink the file
            if (err) {
                console.error('Error downloading CSV:', err);
                fs.unlinkSync(csvFilePath); // Cleanup the file
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
    } catch (error) {
        console.error('Error during CSV download:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
function covertJSONtoCSV(jsonData, outputFilePath) {
    try {
        const csvData = csvjson.toCSV(jsonData, {
            headers: [
                "serialNumber",
                "productName",
                "inputImageUrls",
                "outputImageUrls"
            ],
            delimiter: ','
        });

        // Write the CSV data to a file
        fs.writeFileSync(outputFilePath, csvData, 'utf-8');
        console.log('Conversion successful. CSV file created.');
        return csvData;
    } catch (error) {
        console.error(`Error converting JSON to CSV: ${error}`);
        throw error;  // Rethrow to be caught in processCSV
    }
}


export {
    addCSVToDB,
    getCSVStatusById,
    updateCSVStatus,
    addItemToCSV,
    downloadCSV
}