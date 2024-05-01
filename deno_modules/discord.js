// discordWebhook.js
async function sendMessageToDiscordWebhook(url, message) {
    const payload = JSON.stringify({
        content: message
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: payload
        });

        if (response.ok) {
            console.log('Message sent successfully:', message);
        } else {
            console.error('Failed to send message:', await response.text());
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

export { sendMessageToDiscordWebhook };
