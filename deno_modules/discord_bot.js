import { load } from 'https://deno.land/std@0.212.0/dotenv/mod.ts'
import { createBot } from 'npm:@discordeno/bot@19.0.0-next.d81b28a'

async function startDylan() {
    const bot = createBot({
        token: Deno.env.get("DISCORD_BOT_TOKEN"),
        events: {
            ready: ({ shardId }) => {
                console.log(`Shard ${shardId} ready`)
            },
        },
    })

    await bot.start();
}

export { startDylan };