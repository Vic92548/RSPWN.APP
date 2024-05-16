import { load } from 'https://deno.land/std@0.212.0/dotenv/mod.ts'
import { createBot, Intents,Collection, createDirectMessageChannel, sendMessage } from 'npm:@discordeno/bot@19.0.0-next.d81b28a'

async function startDylan() {
    const bot = createBot({
        token: Deno.env.get("DISCORD_BOT_TOKEN"),
        //intents: ['Guilds', 'GuildMessages'],
        events: {
            ready: ({ shardId }) => {
                console.log(`Shard ${shardId} ready`);
                sendPrivateMessage(bot, "204619144358789122");
            },
            messageCreate: function (bot, message) {
                console.log('message arrived --> ' + message);
            },
        },
    })

    await bot.start();
}

async function sendPrivateMessage(bot, userId) {
    try {
        // Create a DM channel with the user
        const dmChannel = await createDirectMessageChannel(bot, userId);

        // Send a message to the DM channel
        await sendMessage(bot, dmChannel.id, {
            content: "Hello! This is a private message.",
        });

        console.log(`Sent a DM to user with ID: ${userId}`);
    } catch (error) {
        console.error(`Failed to send a DM: ${error}`);
    }
}

export { startDylan };