import mongoose from "mongoose";
import dotenv from "dotenv";
import CSV from "../model/csv.model";
import { Item } from "../model/item.model";


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

export {
    addCSVToDB,
    getCSVStatusById,
    updateCSVStatus,
    addItemToCSV
}