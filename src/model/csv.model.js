import mongoose from "mongoose";
import Item from "./item.model.js";

const csvSchema = new mongoose.Schema({
    items: [
        {
            name: {
                type: String,
                required: true
            },
            serialNumber: {
                type: String,
                required: true
            },
            inputImageUrls: {
                type: [String],
                required: true
            },
            outputImageUrls: {
                type: [String],
                required: true
            }
        }
    ],
    status: {
        type: String,
        required: true
    }
}, { timestamps: true });

const CSV = mongoose.model('CSV', csvSchema);
export default CSV;