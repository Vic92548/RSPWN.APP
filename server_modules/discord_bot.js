const botToken = process.env.DISCORD_BOT_TOKEN;
const VAPRbotToken = process.env.DISCORD_BOT_VAPR;

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

async function sendPrivateMessage(userId, message) {
    try {
        const channelData = await sendBotCommand(botToken, `/users/@me/channels`, "POST", {
            recipient_id: userId,
        });

        await sendBotCommand(botToken, `/channels/${channelData.id}/messages`, "POST", {
            content: message,
        });

        console.log(`Sent a DM to user with ID: ${userId}`);
    } catch (error) {
        console.error(`Failed to send a DM: ${error}`);
    }
}

async function startDylan() {
}

async function joinGuild (accessToken, guildId, userId) {
    const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`;

    const headers = new Headers();
    headers.append("Authorization", `Bot ${VAPRbotToken}`);
    headers.append("Content-Type", "application/json");

    const body = JSON.stringify({
        access_token: accessToken,
    });

    const response = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to add user to guild: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        return;
    }

    console.log(`User with ID ${userId} has been added to guild ${guildId}.`);
}

export { startDylan, sendPrivateMessage, joinGuild };