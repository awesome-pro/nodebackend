import mongoose from "mongoose";
import dotenv from "dotenv";
import CSV from "../model/csv.model.js";
import { Item } from "../model/item.model.js";
import { json2csv } from "json-2-csv";
import fs from "fs";
import path from "path";
import { resolve } from "path";


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

        // Step 1: Fetch the CSV record from the database
        const csv = await CSV.findById(id);

        // Step 2: Check if the CSV record exists
        if (!csv) {
            return res.status(404).json({ error: 'CSV not found' });
        }

        // Step 3: Check if the CSV processing is completed
        // if (csv.status !== 'Completed') {
        //     return res.status(400).json({ error: 'CSV not completed', status: csv.status });
        // }

        // Step 4: Process the JSON data from the CSV record
        const jsonData = csv.items;
        console.log(jsonData);

        // Step 5: Convert the JSON data to CSV format
        const csvData = json2csv(jsonData, {
            fields: ['serialNumber', 'productName', 'inputImageUrls', 'outputImageUrls']
        });

        const csvFilePath = path.join('public', `output-${id}.csv`);

        // Step 6: Write the CSV data to a file
        fs.writeFileSync(csvFilePath, csvData, 'utf-8');
        console.log(`CSV file created at ${csvFilePath}`);

        // Step 7: Send the file to the client for download
        res.download(csvFilePath, `output-${id}.csv`, (err) => {
            if (err) {
                console.error('Error downloading CSV:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
        });

    } catch (error) {
        console.error('Error during CSV download:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export {
    addCSVToDB,
    getCSVStatusById,
    updateCSVStatus,
    addItemToCSV,
    downloadCSV
}