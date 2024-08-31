import axios from 'axios';

// Function to send webhook updates
export async function sendWebhookUpdate(process, status, message) {
    try {
        const response = await axios.post(webhookUrl, {
            process: process,
            status: status,
            message: message
        });

        console.log("Webhook sent successfully", response.data);
        return response.data;
    } catch (error) {
        console.error(`Error sending webhook: ${error}`);
        return null;
    }
}
