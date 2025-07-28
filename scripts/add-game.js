import { MongoClient } from 'mongodb';
import readline from 'readline';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    const client = new MongoClient(process.env.DATABASE_URL);

    try {
        await client.connect();
        console.log('\n🎮 VAPR Game Addition Tool\n');

        const db = client.db('vapr');
        const gamesCollection = db.collection('games');
        const usersCollection = db.collection('users');

        const gameData = {};

        gameData.id = crypto.randomUUID();

        gameData.title = await question('Game Title: ');
        if (!gameData.title.trim()) {
            console.log('❌ Title is required!');
            process.exit(1);
        }

        gameData.description = await question('Short Description: ');
        if (!gameData.description.trim()) {
            console.log('❌ Description is required!');
            process.exit(1);
        }

        gameData.coverImage = await question('Cover Image URL: ');
        if (!gameData.coverImage.trim()) {
            console.log('❌ Cover image URL is required!');
            process.exit(1);
        }

        gameData.externalLink = await question('External Link (Store/Website URL, press Enter to skip): ');
        if (!gameData.externalLink.trim()) {
            gameData.externalLink = null;
        }

        gameData.downloadUrl = await question('Download URL (for game files, press Enter to skip): ');
        if (!gameData.downloadUrl.trim()) {
            gameData.downloadUrl = null;
        }

        const ownerUsername = await question('Owner Username (Discord username): ');
        if (!ownerUsername.trim()) {
            console.log('❌ Owner username is required!');
            process.exit(1);
        }

        const owner = await usersCollection.findOne({ username: ownerUsername });
        if (!owner) {
            console.log(`❌ User "${ownerUsername}" not found!`);

            const showUsers = await question('Would you like to see a list of users? (y/n): ');
            if (showUsers.toLowerCase() === 'y') {
                const users = await usersCollection.find({}, { projection: { username: 1 } }).limit(20).toArray();
                console.log('\nFirst 20 users:');
                users.forEach(u => console.log(`  - ${u.username}`));
            }
            process.exit(1);
        }

        gameData.ownerId = owner.id;

        console.log('\n📋 Game Summary:');
        console.log('================');
        console.log(`Title: ${gameData.title}`);
        console.log(`Description: ${gameData.description}`);
        console.log(`Cover Image: ${gameData.coverImage}`);
        console.log(`External Link: ${gameData.externalLink || 'None'}`);
        console.log(`Download URL: ${gameData.downloadUrl || 'None'}`);
        console.log(`Owner: ${owner.username} (${owner.id})`);
        console.log(`Game ID: ${gameData.id}`);
        console.log('================\n');

        const confirm = await question('Add this game? (y/n): ');

        if (confirm.toLowerCase() === 'y') {
            await gamesCollection.insertOne(gameData);
            console.log('\n✅ Game added successfully!');
            console.log(`🔑 Game ID: ${gameData.id}`);

            const generateKeys = await question('\nWould you like to generate some keys now? (y/n): ');
            if (generateKeys.toLowerCase() === 'y') {
                const keyCount = parseInt(await question('How many keys? ')) || 5;

                const gameKeysCollection = db.collection('gameKeys');
                const keys = [];

                for (let i = 0; i < keyCount; i++) {
                    const key = generateKey();
                    keys.push({
                        key,
                        gameId: gameData.id,
                        createdBy: owner.id,
                        createdAt: new Date(),
                        usedBy: null,
                        usedAt: null
                    });
                }

                await gameKeysCollection.insertMany(keys);

                console.log(`\n✅ Generated ${keyCount} keys:`);
                keys.forEach(k => console.log(`  🔑 ${k.key}`));
            }
        } else {
            console.log('\n❌ Game addition cancelled.');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await client.close();
        rl.close();
    }
}

function generateKey() {
    const segments = [];
    for (let i = 0; i < 4; i++) {
        const segment = Math.random().toString(36).substring(2, 6).toUpperCase();
        segments.push(segment);
    }
    return segments.join('-');
}

main().catch(console.error);