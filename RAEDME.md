# Image Processing System

This repository contains an Image Processing System designed to process image data from CSV files, compress and upload the images to Cloudinary, store metadata in MongoDB, update the CSV with output image URLs, and provide APIs for status checks and webhook triggers.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Setup and Installation](#setup-and-installation)
5. [Usage](#usage)
6. [API Endpoints](#api-endpoints)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Contributing](#contributing)
10. [License](#license)

## Overview

The Image Processing System handles the entire lifecycle of processing images listed in a CSV file. The system is designed to be scalable, robust, and easy to use. It includes functionalities such as CSV validation, asynchronous image processing, storage of processed images in Cloudinary, metadata management in MongoDB, and more.

## Features

- **CSV Upload & Validation:** Accepts and validates CSV files with image URLs.
- **Asynchronous Image Processing:** Compresses images to 50% quality using Sharp and Multer.
- **Cloudinary Integration:** Uploads processed images to Cloudinary.
- **MongoDB Storage:** Stores processed image metadata in MongoDB.
- **CSV Update:** Updates the CSV file with the new image URLs.
- **API Endpoints:** Provides endpoints for status checks and webhook triggers.
- **Error Handling:** Comprehensive error handling for all stages of processing.

## Architecture

![Architecture Diagram](https://via.placeholder.com/800x400?text=Architecture+Diagram)

The system consists of the following components:

1. **CSV Upload Module:** Handles the upload and initial validation of CSV files.
2. **Image Processing Module:** Compresses and uploads images to Cloudinary.
3. **Database Module:** Manages the storage of image metadata in MongoDB.
4. **API Module:** Exposes endpoints for checking processing status and webhook triggers.
5. **Webhook Module:** Notifies external systems upon completion of processing.

## Setup and Installation

### Prerequisites

- Node.js (v20+)
- MongoDB
- Cloudinary Account
- Git

### Installation Steps

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/awesome-pro/nodebackend.git
    cd nodebackend
    ```

2. **Install Dependencies:**

    ```bash
    npm install
    ```

3. **Set Up Environment Variables:**

    Create a `.env` file in the root directory and add the following:

    ```bash
    MONGODB_URI=<Your MongoDB URI>
    CLOUDINARY_CLOUD_NAME=<Your Cloudinary Cloud Name>
    CLOUDINARY_API_KEY=<Your Cloudinary API Key>
    CLOUDINARY_API_SECRET=<Your Cloudinary API Secret>
    ```

4. **Run the Application:**

    ```bash
    nodemon server.js
    ```

    The server will start on `http://localhost:3000`.

### Optional: Docker Setup

You can also run the application using Docker:

```bash
docker build -t image-processing-system .
docker run -d -p 3000:3000 --env-file .env image-processing-system
```

## Usage

### Uploading a CSV File

To upload a CSV file, send a `POST` request to `/upload` with the CSV file as form-data.

![Upload CSV GIF](https://via.placeholder.com/400x200?text=Upload+CSV+GIF)

### Checking Processing Status

Send a `GET` request to `/status?id=<csvId>` to check the processing status of the CSV file.

### Downloading the Processed CSV

Once processing is complete, you can download the processed CSV file using the download link provided in the response.

## API Endpoints

- **POST `/upload`:** Upload a CSV file for processing.
- **GET `/status`:** Check the status of the CSV processing.
- **GET `/download`:** Download the processed CSV file.

### Example API Requests

```bash
curl -X POST -F "file=@/path/to/your.csv" http://localhost:3000/upload
```

```bash
curl -X GET http://localhost:3000/status?id=<csvId>
```

## Error Handling

The system includes comprehensive error handling for all steps in the processing pipeline:

- **CSV Validation:** Ensures the uploaded CSV follows the correct format.
- **Image Processing:** Handles errors during image compression and Cloudinary upload.
- **Database Operations:** Catches and logs database-related errors.

![Error Handling GIF](https://via.placeholder.com/400x200?text=Error+Handling+GIF)

## Testing

You can run tests using:

```bash
npm test
```

Testing includes validation of CSV upload, image processing, and API responses.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License

This project is licensed under the MIT License.