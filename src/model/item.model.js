import mongoose from 'mongoose';


const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    serialNumber: {
        type: String,
        required: true,
    },
    inputImageUrls: {
        type: [String],
        required: true,
    },
    outputImageUrls: {
        type: [String],
        required: true,
    },
});

export const Item = mongoose.model('Item', itemSchema);

export default Item;