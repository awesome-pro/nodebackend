import sharp from "sharp";
import fs from "fs";
import path from "path";

export async function resizeAndCompressImage(inputFilePath, outputFileName) {
    const outputDirectory = path.join('uploads');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const outputFilePath = path.join(outputDirectory, outputFileName);

    try {
        // Get image metadata to determine original size
        const metadata = await sharp(inputFilePath).metadata();
        console.log(`Image size: ${metadata.width}x${metadata.height}`);

        // Calculate new dimensions (50% of original size)
        const newWidth = Math.floor(metadata.width / 2);
        const newHeight = Math.floor(metadata.height / 2);

        // Resize and compress the image
        await sharp(inputFilePath)
            .resize(newWidth, newHeight) 
            .webp({ quality: 50 })  // Reduce size by 50%
            .jpeg({ quality: 50 }) 
            .png({ quality: 50 })       // Reduce quality by 50%
            .toFile(outputFilePath);

        console.log(`Image resized and compressed. Saved to ${outputFilePath}`);
        return outputFilePath;
    } catch (error) {
        console.error(`Error processing image: ${error}`);
        return null;
    }
}
