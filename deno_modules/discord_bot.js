import { load } from 'https://deno.land/std@0.212.0/dotenv/mod.ts'
import { createBot, Intents,Collection } from 'npm:@discordeno/bot@19.0.0-next.d81b28a'

async function startDylan() {
    const bot = createBot({
        token: Deno.env.get("DISCORD_BOT_TOKEN"),
        intents: Intents.Guilds | Intents.GuildMessages,
        events: {
            ready: ({ shardId }) => {
                console.log(`Shard ${shardId} ready`);
                listGuilds(bot);
            },
            messageCreate: function (bot, message) {
                console.log('message arrived --> ' + message);
            },
        },
    })

    await bot.start();
}

async function listGuilds(bot) {
    console.log(bot);
    const guilds = bot.guilds;
    for (const [guildId, guild] of guilds) {
        console.log(`Guild ID: ${guildId}, Guild Name: ${guild.name}`);
    }
}

export { startDylan };