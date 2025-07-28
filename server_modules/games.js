import { gamesCollection, gameKeysCollection, userGamesCollection } from './database.js';

export async function getAllGames() {
    try {
        const games = await gamesCollection.find({}).toArray();
        return new Response(JSON.stringify({ success: true, games }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error fetching games:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch games' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getUserGames(userId) {
    try {
        const userGames = await userGamesCollection.find({ userId }).toArray();
        const gameIds = userGames.map(ug => ug.gameId);
        const games = await gamesCollection.find({ id: { $in: gameIds } }).toArray();

        const gamesWithOwnership = games.map(game => {
            const userGame = userGames.find(ug => ug.gameId === game.id);
            return {
                ...game,
                ownedAt: userGame.ownedAt,
                acquiredBy: userGame.acquiredBy
            };
        });

        return new Response(JSON.stringify({ success: true, games: gamesWithOwnership }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error fetching user games:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch user games' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function redeemGameKey(userId, key) {
    try {
        const gameKey = await gameKeysCollection.findOne({ key: key.toUpperCase() });

        if (!gameKey) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid key' }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (gameKey.usedBy) {
            return new Response(JSON.stringify({ success: false, error: 'Key already used' }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const existingOwnership = await userGamesCollection.findOne({
            userId,
            gameId: gameKey.gameId
        });

        if (existingOwnership) {
            return new Response(JSON.stringify({ success: false, error: 'You already own this game' }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        await gameKeysCollection.updateOne(
            { key: key.toUpperCase() },
            { $set: { usedBy: userId, usedAt: new Date() } }
        );

        await userGamesCollection.insertOne({
            userId,
            gameId: gameKey.gameId,
            ownedAt: new Date(),
            acquiredBy: 'key'
        });

        const game = await gamesCollection.findOne({ id: gameKey.gameId });

        return new Response(JSON.stringify({ success: true, game }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error redeeming key:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to redeem key' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function generateGameKeys(gameId, ownerId, count = 5) {
    try {
        const game = await gamesCollection.findOne({ id: gameId });

        if (!game) {
            return new Response(JSON.stringify({ success: false, error: 'Game not found' }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (game.ownerId !== ownerId) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const keys = [];
        for (let i = 0; i < count; i++) {
            const key = generateKey();
            keys.push({
                key,
                gameId,
                createdBy: ownerId,
                createdAt: new Date(),
                usedBy: null,
                usedAt: null
            });
        }

        await gameKeysCollection.insertMany(keys);

        return new Response(JSON.stringify({ success: true, keys: keys.map(k => k.key) }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error generating keys:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to generate keys' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getGameKeys(gameId, ownerId) {
    try {
        const game = await gamesCollection.findOne({ id: gameId });

        if (!game) {
            return new Response(JSON.stringify({ success: false, error: 'Game not found' }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (game.ownerId !== ownerId) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const keys = await gameKeysCollection.find({ gameId }).toArray();

        return new Response(JSON.stringify({ success: true, keys }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error fetching keys:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch keys' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getGameDownloadUrl(gameId, userId) {
    try {
        const ownership = await userGamesCollection.findOne({ userId, gameId });

        if (!ownership) {
            return new Response(JSON.stringify({ success: false, error: 'You do not own this game' }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const game = await gamesCollection.findOne({ id: gameId });

        if (!game || !game.downloadUrl) {
            return new Response(JSON.stringify({ success: false, error: 'Download not available' }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: true, downloadUrl: game.downloadUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error getting download URL:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to get download URL' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
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