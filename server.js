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
    res.send(`
        <h1>🚀 Welcome to the Image Compressor System, APP is running :)</h1>
        <h2>Introduction</h2>
        <p>This is Image Processing System that processes image data from CSV files. The system will handle CSV file uploads, validate and process images, upload images to Cloudinary, and store relevant data in MongoDB. Finally, it will send the updated CSV data to the API request. It also provides APIs to check the status of processing and trigger webhooks upon completion.</p>

        <h2>Important Links</h2>
        <ul>
            <li><a href="https://drive.google.com/file/d/1U6MO_iYUSH8ivsmFPbfIFIi_mvSSxFO3/view?usp=drive_link" target="_blank">API Documentation</a></li>
            <li><a href="https://app.eraser.io/workspace/Ob3EN5IXxKZW1lOMg3Mi?origin=share" target="_blank">LLD Designs</a></li>
            <li><a href="https://www.postman.com/abhinandan-verma/workspace/pro-developers/collection/31971900-24b5de3c-0c81-4565-8142-118a0733238e" target="_blank">Postman Collections</a></li>
            <li><a href="https://www.loom.com/share/ed33d09d5b324f2c98aa300fb5308440?sid=d3f35f09-0f81-405b-93d2-8e434f51cdab" target="_blank">Demo Video</a></li>
            <li><a href="https://github.com/awesome-pro/nodebackend" target="_blank">Github Repository</a></li>
        </ul>
        <h2>Important End-Points</h2>
        <ul>
            <li><a href="/api/post">Post CSV file</a></li>
            <li><a href="/status">Status</a></li>
            <li><a href="/webhook">Webhook</a></li>
            <li><a href="/csv/download">CSV Download</a></li>
            <li><a href="/csv/status?id=66d34e6569f093ccce4774f3">Demo Status</a></li>
            <li><a href="/csv/download?id=66d33d5ff4cb9f063bdf7503">Demo CSV Download</a></li>
        </ul>
        <h2>System Overview</h2>
        <ol>
            <li>Receive: Accept a CSV file with specific data format</li>
            <li>Parse: Parse the CSV using "csv-parser"</li>
            <li>Validate: Ensure the CSV data is correctly formatted, using the csv-parser</li>
            <li>Process: Asynchronously process images by compressing them to 50% of their original quality using the sharp & multer libraries.</li>
            <li>Store: Save processed image data on Cloudinary and their relevant links in MongoDB database for future reference.</li>
            <li>Update CSV: Update the CSV file adding the output image URLs</li>
            <li>Respond with CSV: Send the CSV file to request on specific end-point with ID</li>
        </ol>

        <h2>System Components</h2>
        <ul>
            <li><strong>CSV File Upload Service:</strong> Handles file uploads, validates CSV format, and initiates image processing.</li>
            <ul>
                <li>Receive and parse the CSV file.</li>
                <li>Validate CSV format (correct number of columns, valid URLs).</li>
                <li>Generate a unique request ID for tracking.</li>
                <li>Download the Image using Axios</li>
                <li>Compress Image Using Sharp & Multer</li>
                <li>Upload the Image to Cloudinary</li>
                <li>Update the database with processed image URLs.</li>
                <li>Generate the output CSV file with input and output image URLs. using json2csv</li>
                <li>Send the CSV file to the user on download URL</li>
            </ul>
            <li><strong>Image Processing Service:</strong> Asynchronously processes images by compressing them.</li>
            <ul>
                <li>Fetch image URLs from the CSV file.</li>
                <li>Download and compress images to 50% of their original quality.</li>
                <li>Upload compressed images to a storage service (e.g., Cloudinary).</li>
                <li>Update the database with processed image URLs.</li>
                <li>Generate the output CSV file with input and output image URLs.</li>
            </ul>
            <li><strong>Status Check Service:</strong> Provides the status of image processing based on the request ID.</li>
            <ul>
                <li>Query the database for processing status.</li>
                <li>Return the processing status and progress.</li>
                <li>Provide a link to the output CSV file once processing is complete.</li>
            </ul>
            <li><strong>Webhook Service:</strong> Handles webhook callbacks to notify about processing completion.</li>
            <ul>
                <li>Send a notification to the specified webhook endpoint with processing results.</li>
                <li>Include details such as request ID, processing status, and output CSV URL.</li>
            </ul>
            <li><strong>Database:</strong> Stores information about the CSV file, request IDs, and processed images.</li>
            <ul>
                <li>Store initial CSV file data and request IDs.</li>
                <li>Track processing status and progress.</li>
                <li>Store URLs of processed images and generated output CSV file.</li>
            </ul>
        </ul>

        <h2>Database Schema</h2>
        <p>Mongoose has been used to create the database schema. It consists of CSV Documents. Each document has the following elements:</p>
        <ul>
            <li>Array of Items: Each item is an object with the following elements:
                <ul>
                    <li>ProductName</li>
                    <li>SerialNumber</li>
                    <li>InputImageUrls: Array of Strings</li>
                    <li>OutputImageUrls: Array of Strings</li>
                </ul>
            </li>
            <li>Status: String type, required</li>
            <li>Timestamp</li>
            <li>_id (provided by MongoDB)</li>
        </ul>

        <h2>Asynchronous Workers Documentation</h2>
        <p>The Image Processing System utilizes asynchronous workers to handle image processing tasks concurrently, allowing the system to manage multiple images efficiently.</p>
        <ul>
            <li><strong>Worker Initialization:</strong> Each worker is initialized to handle specific tasks related to image processing, such as downloading, compressing, and uploading images. Workers operate independently, ensuring that the system can handle large volumes of images without performance degradation.</li>
            <li><strong>Image Download Worker:</strong> Responsible for fetching the image from the provided URL. It checks if the image URL is valid and then downloads the image to a temporary location for further processing.</li>
            <li><strong>Image Compression Worker:</strong> Compresses the image to reduce its size by 50% using the sharp library. The compressed image is then saved to a temporary storage location.</li>
            <li><strong>Image Upload Worker:</strong> Uploads the compressed image to Cloudinary. After a successful upload, the worker retrieves the URL of the uploaded image and stores it in the MongoDB database.</li>
            <li><strong>CSV Update Worker:</strong> Updates the CSV data with the new output image URLs after processing is complete. The updated CSV is then either stored or returned to the user via the API.</li>
            <li><strong>Status Update Worker:</strong> Updates the processing status in the MongoDB database, ensuring that the system’s state is always up-to-date. It triggers webhooks to notify the client of the current status or when the processing is completed.</li>
            <li><strong>Error Handling and Retry Mechanism:</strong> Workers are equipped with error-handling mechanisms to manage failures during processing. A retry mechanism is implemented to handle transient issues, ensuring the system’s robustness and reliability.</li>
        </ul>

        <h2>Technologies Used</h2>
        <ul>
            <li>Node.js: For the server and API endpoints.</li>
            <li>Express: To handle HTTP requests and routing.</li>
            <li>Multer: For file uploads.</li>
            <li>Sharp: For image processing.</li>
            <li>Cloudinary: For image storage (optional).</li>
            <li>MongoDB: For storing processing data.</li>
            <li>Async Processing Queue: For handling image processing.</li>
        </ul>
    `);
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
