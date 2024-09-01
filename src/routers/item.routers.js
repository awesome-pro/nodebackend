import { Router } from "express";
import multer from "multer";
import { processCSV } from "../controllers/item.controller.js";
import { upload } from "../middleware/multer.middleware.js";


const router = Router();

router.route("/post").post(upload.single("file"), (req, res) => {
    processCSV(req, res);
});

router.route("/post").get((req, res) => {
    res.json({ status: "Congrtats! api/post API, use postman to send CSV file for process :)" });
});

export default router;