import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import router from "./routers/item.routers.js";
import dbConnect from "./lib/dbConnect.js";

const app = express();

const storage = multer.memoryStorage();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

app.get("/", (req, res) => {
    res.json({ message: "Hello App is running:)" });
});

dbConnect()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT || 3000}`);
    })

    app.use("/api", router).listen(3000, () => {
        console.log("Server is running on port 3000");
    });

    app.post('/webhook', (req, res) => {
        const { process, status, message } = req.body;
        console.log(`Process: ${process}, Status: ${status}, Message: ${message}`);
        res.status(200).send('Webhook received');
    });
    
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})

