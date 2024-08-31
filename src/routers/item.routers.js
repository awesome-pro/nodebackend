import { Router } from "express";
import multer from "multer";
import { processCSV } from "../controllers/item.controller.js";
import { upload } from "../middleware/multer.middleware.js";


const router = Router();

router.route("/post").post(upload.single("file"), (req, res) => {
    processCSV(req, res);
});

export default router;