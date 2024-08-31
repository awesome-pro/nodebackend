import { Router } from "express";
import { downloadCSV, returnStatusOfCSV } from "../controllers/csv.controller.js";
import { processCSV } from "../controllers/item.controller.js";

const csvRouter = Router();

csvRouter.route("/download").get((req, res) => {
    const { id } = req.query; // Access the id from the query parameters
    console.log(`Downloading CSV with id: ${id}`);

    // if length of id is less than 24 then return error
    if (id.length < 24) {
        return res.status(400).json({ error: "Invalid CSV ID" });
    }

    downloadCSV(res, id); // Pass the id to the downloadCSV function
    //res.json({ message: "Downloading CSV...", id: id });
});

csvRouter.route("/upload").post((req, res) => {
    processCSV(req, res);
});

csvRouter.route("/status").get(async (req, res) => {
    const { id } = req.query;
    console.log(`Downloading CSV with id: ${id}`);

    if (id.length < 24) {
        return res.status(400).json({ error: "Invalid CSV ID" });
    }

    const status = await returnStatusOfCSV(id);
    res.json({ status: status });
});

export default csvRouter;
