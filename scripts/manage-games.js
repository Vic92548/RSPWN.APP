import { MongoClient } from 'mongodb';
import readline from 'readline';
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
        console.log('\n🎮 VAPR Game Management Tool\n');

        const db = client.db('vapr');
        const gamesCollection = db.collection('games');
        const gameKeysCollection = db.collection('gameKeys');
        const userGamesCollection = db.collection('userGames');
        const usersCollection = db.collection('users');

        while (true) {
            console.log('\nOptions:');
            console.log('1. List all games');
            console.log('2. View game details');
            console.log('3. Update game');
            console.log('4. Delete game');
            console.log('5. Generate keys for a game');
            console.log('6. View keys for a game');
            console.log('7. View game ownership stats');
            console.log('8. Exit');

            const choice = await question('\nSelect option (1-8): ');

            switch (choice) {
                case '1':
                    const games = await gamesCollection.find({}).toArray();
                    console.log(`\n📚 Total games: ${games.length}\n`);
                    for (const game of games) {
                        const owner = await usersCollection.findOne({ id: game.ownerId });
                        console.log(`${game.title}`);
                        console.log(`  ID: ${game.id}`);
                        console.log(`  Owner: ${owner ? owner.username : 'Unknown'}`);
                        console.log(`  External: ${game.externalLink || 'None'}`);
                        console.log('');
                    }
                    break;

                case '2':
                    const gameId = await question('Enter game ID: ');
                    const game = await gamesCollection.findOne({ id: gameId });
                    if (game) {
                        const owner = await usersCollection.findOne({ id: game.ownerId });
                        const totalKeys = await gameKeysCollection.countDocuments({ gameId: game.id });
                        const usedKeys = await gameKeysCollection.countDocuments({ gameId: game.id, usedBy: { $ne: null } });
                        const owners = await userGamesCollection.countDocuments({ gameId: game.id });

                        console.log('\n📋 Game Details:');
                        console.log('================');
                        console.log(`Title: ${game.title}`);
                        console.log(`ID: ${game.id}`);
                        console.log(`Description: ${game.description}`);
                        console.log(`Owner: ${owner ? owner.username : 'Unknown'}`);
                        console.log(`Cover: ${game.coverImage}`);
                        console.log(`External Link: ${game.externalLink || 'None'}`);
                        console.log(`Download URL: ${game.downloadUrl || 'None'}`);
                        console.log(`\n📊 Statistics:`);
                        console.log(`Total Keys: ${totalKeys}`);
                        console.log(`Used Keys: ${usedKeys}`);
                        console.log(`Available Keys: ${totalKeys - usedKeys}`);
                        console.log(`Total Owners: ${owners}`);
                    } else {
                        console.log('❌ Game not found!');
                    }
                    break;

                case '3':
                    const updateId = await question('Enter game ID to update: ');
                    const gameToUpdate = await gamesCollection.findOne({ id: updateId });
                    if (gameToUpdate) {
                        console.log(`\nUpdating: ${gameToUpdate.title}`);
                        console.log('(Press Enter to keep current value)\n');

                        const updates = {};

                        const newTitle = await question(`Title [${gameToUpdate.title}]: `);
                        if (newTitle.trim()) updates.title = newTitle;

                        const newDesc = await question(`Description [${gameToUpdate.description}]: `);
                        if (newDesc.trim()) updates.description = newDesc;

                        const newCover = await question(`Cover Image [${gameToUpdate.coverImage}]: `);
                        if (newCover.trim()) updates.coverImage = newCover;

                        const newExternal = await question(`External Link [${gameToUpdate.externalLink || 'None'}]: `);
                        if (newExternal.trim()) updates.externalLink = newExternal;

                        const newDownload = await question(`Download URL [${gameToUpdate.downloadUrl || 'None'}]: `);
                        if (newDownload.trim()) updates.downloadUrl = newDownload;

                        if (Object.keys(updates).length > 0) {
                            await gamesCollection.updateOne({ id: updateId }, { $set: updates });
                            console.log('✅ Game updated successfully!');
                        } else {
                            console.log('ℹ️ No changes made.');
                        }
                    } else {
                        console.log('❌ Game not found!');
                    }
                    break;

                case '4':
                    const deleteId = await question('Enter game ID to delete: ');
                    const gameToDelete = await gamesCollection.findOne({ id: deleteId });
                    if (gameToDelete) {
                        console.log(`\n⚠️  WARNING: This will delete "${gameToDelete.title}"`);
                        const confirmDelete = await question('Are you sure? (yes/no): ');
                        if (confirmDelete.toLowerCase() === 'yes') {
                            await gamesCollection.deleteOne({ id: deleteId });
                            await gameKeysCollection.deleteMany({ gameId: deleteId });
                            await userGamesCollection.deleteMany({ gameId: deleteId });
                            console.log('✅ Game and all related data deleted!');
                        } else {
                            console.log('❌ Deletion cancelled.');
                        }
                    } else {
                        console.log('❌ Game not found!');
                    }
                    break;

                case '5':
                    const genGameId = await question('Enter game ID: ');
                    const genGame = await gamesCollection.findOne({ id: genGameId });
                    if (genGame) {
                        const keyCount = parseInt(await question('How many keys to generate? ')) || 5;

                        const keys = [];
                        for (let i = 0; i < keyCount; i++) {
                            const key = generateKey();
                            keys.push({
                                key,
                                gameId: genGameId,
                                createdBy: genGame.ownerId,
                                createdAt: new Date(),
                                usedBy: null,
                                usedAt: null
                            });
                        }

                        await gameKeysCollection.insertMany(keys);
                        console.log(`\n✅ Generated ${keyCount} keys:`);
                        keys.forEach(k => console.log(`  🔑 ${k.key}`));
                    } else {
                        console.log('❌ Game not found!');
                    }
                    break;

                case '6':
                    const viewKeysId = await question('Enter game ID: ');
                    const keysGame = await gamesCollection.findOne({ id: viewKeysId });
                    if (keysGame) {
                        const keys = await gameKeysCollection.find({ gameId: viewKeysId }).toArray();
                        console.log(`\n🔑 Keys for "${keysGame.title}":\n`);

                        const availableKeys = keys.filter(k => !k.usedBy);
                        const usedKeys = keys.filter(k => k.usedBy);

                        if (availableKeys.length > 0) {
                            console.log('Available Keys:');
                            availableKeys.forEach(k => console.log(`  ✅ ${k.key}`));
                        }

                        if (usedKeys.length > 0) {
                            console.log('\nUsed Keys:');
                            for (const k of usedKeys) {
                                const user = await usersCollection.findOne({ id: k.usedBy });
                                console.log(`  ❌ ${k.key} (used by ${user ? user.username : 'Unknown'})`);
                            }
                        }

                        console.log(`\nTotal: ${keys.length} | Available: ${availableKeys.length} | Used: ${usedKeys.length}`);
                    } else {
                        console.log('❌ Game not found!');
                    }
                    break;

                case '7':
                    const allGames = await gamesCollection.find({}).toArray();
                    console.log('\n📊 Game Ownership Statistics:\n');

                    for (const g of allGames) {
                        const owners = await userGamesCollection.countDocuments({ gameId: g.id });
                        const totalKeys = await gameKeysCollection.countDocuments({ gameId: g.id });
                        const usedKeys = await gameKeysCollection.countDocuments({ gameId: g.id, usedBy: { $ne: null } });

                        console.log(`${g.title}`);
                        console.log(`  Owners: ${owners}`);
                        console.log(`  Keys: ${usedKeys}/${totalKeys} used`);
                        console.log('');
                    }
                    break;

                case '8':
                    console.log('\n👋 Goodbye!');
                    process.exit(0);

                default:
                    console.log('❌ Invalid option!');
            }

            await question('\nPress Enter to continue...');
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