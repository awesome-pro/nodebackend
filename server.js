import express from "express";
import bodyParser from "body-parser";
import router from "./src/routers/item.routers.js";
import csvRouter from "./src/routers/csv.routers..js";
import connectDB from "./src/lib/db.js";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// on the home api, return a html repnse of app name and description, confirming the app is running
app.get("/", (req, res) => {
    res.send("<h1>🚀 Welcome to the Image Compressor System, APP is running :)</h1>");
});

// Mount the router on a specific route
app.use("/api", router);
app.use("/csv", csvRouter);

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT || 3000}`);
    });

    app.post('/webhook', (req, res) => {
        const { process, status, message } = req.body;
        console.log(`Process: ${process}, Status: ${status}, Message: ${message}`);
        res.status(200).json({ message: "Webhook received :)" });
    });

    app.get('/webhook', (req, res) => {
        const { process, status, message } = req.body;
        console.log(`Process: ${process}, Status: ${status}, Message: ${message}`);
        res.status(200).json({ message: "You are on webhook api :)" });
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
    return res.status(500).json({ error: "Internal Server Error, Try Again " });
});
