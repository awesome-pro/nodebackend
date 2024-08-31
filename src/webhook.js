import axios from 'axios';

// Function to send webhook updates
export async function sendWebhookUpdate(process, status, message) {
    try {
        await axios.post('http://your-webhook-url/webhook', {
            process,
            status,
            message,
        });
        console.log(`Webhook sent: ${process} - ${status}`);
    } catch (error) {
        console.error(`Error sending webhook: ${error}`);
    }
}
