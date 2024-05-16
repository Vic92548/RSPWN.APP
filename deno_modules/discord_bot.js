const botToken = Deno.env.get("DISCORD_BOT_TOKEN");

async function sendBotCommand(token, endpoint, method, body = null) {
    try {
        const response = await fetch(`https://discord.com/api/v10${endpoint}`, {
            method: method,
            headers: {
                "Authorization": `Bot ${token}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : null,
        });

        if (!response.ok) {
            throw new Error(`Failed to ${method} ${endpoint}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error in sendBotCommand: ${error}`);
        throw error;
    }
}

async function sendPrivateMessage(token, userId) {
    try {
        // Create a DM channel with the user
        const channelData = await sendBotCommand(token, `/users/@me/channels`, "POST", {
            recipient_id: userId,
        });

        // Send a message to the DM channel
        await sendBotCommand(token, `/channels/${channelData.id}/messages`, "POST", {
            content: "Just following up!",
        });

        console.log(`Sent a DM to user with ID: ${userId}`);
    } catch (error) {
        console.error(`Failed to send a DM: ${error}`);
    }
}

async function startDylan() {
    await sendPrivateMessage(botToken, "204619144358789122");
}

export { startDylan };
