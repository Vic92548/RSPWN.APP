import { createBot, Intents } from 'npm:@discordeno/bot@19.0.0-next.d81b28a';


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
            content: "Hello! This is a private message.",
        });

        console.log(`Sent a DM to user with ID: ${userId}`);
    } catch (error) {
        console.error(`Failed to send a DM: ${error}`);
    }
}

async function startDylan() {
    const bot = createBot({
        token: botToken,
        intents: [Intents.Guilds, Intents.GuildMessages],
        events: {
            ready: ({ shardId }) => {
                console.log(`Shard ${shardId} ready`);
                sendPrivateMessage(botToken, "204619144358789122");
            },
            messageCreate: function (bot, message) {
                console.log('message arrived --> ' + message);
            },
        },
    });

    await bot.start();
}

export { startDylan };
