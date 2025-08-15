import { gamesCollection, gameKeysCollection, userGamesCollection, usersCollection, playtimeSessionsCollection } from './database.js';

export async function getAllGames(userId = null) {
    try {
        const publicGames = await gamesCollection.find({ isHidden: { $ne: true } }).toArray();

        let userOwnedGames = [];
        let userAccessGames = [];

        if (userId && userId !== 'anonymous') {
            userOwnedGames = await gamesCollection.find({ ownerId: userId }).toArray();

            const userGames = await userGamesCollection.find({ userId }).toArray();
            const ownedGameIds = userGames.map(ug => ug.gameId);

            if (ownedGameIds.length > 0) {
                userAccessGames = await gamesCollection.find({
                    id: { $in: ownedGameIds },
                    isHidden: true,
                    ownerId: { $ne: userId }
                }).toArray();
            }
        }

        const allGames = [...publicGames, ...userOwnedGames, ...userAccessGames];
        const uniqueGames = Array.from(new Map(allGames.map(g => [g.id, g])).values());

        return new Response(JSON.stringify({ success: true, games: uniqueGames }), {
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

        const playtimeAgg = await playtimeSessionsCollection.aggregate([
            { $match: { userId, gameId: { $in: gameIds } } },
            { $group: { _id: '$gameId', totalSeconds: { $sum: '$durationSeconds' } } }
        ]).toArray();
        const totalsMap = new Map(playtimeAgg.map(row => [row._id, row.totalSeconds || 0]));

        const gamesWithOwnership = games.map(game => {
            const userGame = userGames.find(ug => ug.gameId === game.id);
            return {
                ...game,
                ownedAt: userGame.ownedAt,
                acquiredBy: userGame.acquiredBy,
                totalPlaytimeSeconds: totalsMap.get(game.id) || 0
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

export async function getDeveloperGames(userId) {
    try {
        const games = await gamesCollection.find({ ownerId: userId }).toArray();

        const enrichedGames = await Promise.all(games.map(async (game) => {
            const playerCount = await userGamesCollection.countDocuments({ gameId: game.id });

            const totalKeys = await gameKeysCollection.countDocuments({ gameId: game.id });
            const usedKeys = await gameKeysCollection.countDocuments({
                gameId: game.id,
                usedBy: { $ne: null }
            });

            const playtimeAgg = await playtimeSessionsCollection.aggregate([
                { $match: { gameId: game.id } },
                { $group: { _id: null, totalSeconds: { $sum: '$durationSeconds' } } }
            ]).toArray();
            const totalPlaytimeSeconds = playtimeAgg[0]?.totalSeconds || 0;

            const developerOwnership = await userGamesCollection.findOne({
                userId,
                gameId: game.id
            });

            return {
                ...game,
                stats: {
                    playerCount,
                    totalKeys,
                    usedKeys,
                    availableKeys: totalKeys - usedKeys,
                    totalPlaytimeSeconds
                },
                ownedAt: developerOwnership?.ownedAt || game.createdAt,
                acquiredBy: developerOwnership?.acquiredBy || 'developer',
                personalPlaytimeSeconds: developerOwnership ? (await playtimeSessionsCollection.aggregate([
                    { $match: { userId, gameId: game.id } },
                    { $group: { _id: null, totalSeconds: { $sum: '$durationSeconds' } } }
                ]).toArray())[0]?.totalSeconds || 0 : 0
            };
        }));

        return new Response(JSON.stringify({ success: true, games: enrichedGames }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error fetching developer games:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch developer games' }), {
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
            acquiredBy: 'key',
            keyTag: gameKey.tag || null
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

export async function generateGameKeys(gameId, ownerId, count = 5, tag = null) {
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
                usedAt: null,
                tag: tag
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

        const keys = await gameKeysCollection.aggregate([
            { $match: { gameId } },
            {
                $lookup: {
                    from: "users",
                    localField: "usedBy",
                    foreignField: "id",
                    as: "user"
                }
            },
            {
                $project: {
                    key: 1,
                    createdAt: 1,
                    usedBy: 1,
                    usedAt: 1,
                    tag: 1,
                    user: { $arrayElemAt: ["$user", 0] }
                }
            }
        ]).toArray();

        const keysWithUserInfo = keys.map(key => ({
            ...key,
            userInfo: key.user ? {
                id: key.user.id,
                username: key.user.username,
                avatar: key.user.avatar
            } : null
        }));

        return new Response(JSON.stringify({ success: true, keys: keysWithUserInfo }), {
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

export async function downloadKeysAsCSV(gameId, ownerId, tag = null) {
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

        const query = { gameId, usedBy: null };
        if (tag) {
            query.tag = tag;
        }

        const keys = await gameKeysCollection.find(query).toArray();

        const csvContent = keys.map(key => key.key).join(',\n');

        return new Response(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${game.title.replace(/[^a-z0-9]/gi, '_')}_keys${tag ? `_${tag}` : ''}.csv"`
            }
        });
    } catch (error) {
        console.error('Error downloading keys:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to download keys' }), {
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

export async function getGameAnalytics(gameId, ownerId, timeRange = 30) {
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

        const now = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);

        const gameOwners = await userGamesCollection.find({ gameId }).toArray();
        const playerIds = gameOwners.map(go => go.userId);

        const sessions = await playtimeSessionsCollection
            .find({
                gameId,
                startedAt: { $gte: startDate }
            })
            .toArray();

        const dailyActiveUsers = {};
        const dailyPlaytime = {};
        const dailySessions = {};

        for (let i = 0; i < timeRange; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateStr = date.toISOString().split('T')[0];

            dailyActiveUsers[dateStr] = new Set();
            dailyPlaytime[dateStr] = 0;
            dailySessions[dateStr] = 0;
        }

        sessions.forEach(session => {
            const dateStr = new Date(session.startedAt).toISOString().split('T')[0];
            if (dailyActiveUsers[dateStr]) {
                dailyActiveUsers[dateStr].add(session.userId);
                dailyPlaytime[dateStr] += session.durationSeconds;
                dailySessions[dateStr]++;
            }
        });

        const chartData = Object.keys(dailyActiveUsers)
            .sort()
            .map(date => ({
                date,
                activeUsers: dailyActiveUsers[date].size,
                totalPlaytimeHours: Math.round(dailyPlaytime[date] / 3600 * 10) / 10,
                sessions: dailySessions[date],
                avgPlaytimeHours: dailyActiveUsers[date].size > 0
                    ? Math.round((dailyPlaytime[date] / dailyActiveUsers[date].size / 3600) * 10) / 10
                    : 0
            }));

        const totalPlaytimeSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
        const uniquePlayers = new Set(sessions.map(s => s.userId)).size;
        const avgSessionLength = sessions.length > 0 ? totalPlaytimeSeconds / sessions.length : 0;

        const playerRetention = await calculateRetention(gameId, playerIds, startDate);

        const playtimeDistribution = await playtimeSessionsCollection.aggregate([
            { $match: { gameId, startedAt: { $gte: startDate } } },
            { $group: {
                    _id: '$userId',
                    totalPlaytime: { $sum: '$durationSeconds' }
                }},
            { $bucket: {
                    groupBy: '$totalPlaytime',
                    boundaries: [0, 3600, 7200, 18000, 36000, 72000, 180000, Infinity],
                    default: 'Other',
                    output: {
                        count: { $sum: 1 },
                        players: { $push: '$_id' }
                    }
                }}
        ]).toArray();

        const peakHours = await calculatePeakHours(sessions);

        return new Response(JSON.stringify({
            success: true,
            analytics: {
                overview: {
                    totalPlayers: gameOwners.length,
                    activePlayers: uniquePlayers,
                    totalPlaytimeHours: Math.round(totalPlaytimeSeconds / 3600),
                    avgSessionMinutes: Math.round(avgSessionLength / 60),
                    totalSessions: sessions.length
                },
                charts: {
                    daily: chartData,
                    retention: playerRetention,
                    playtimeDistribution: playtimeDistribution.map(bucket => ({
                        range: getPlaytimeRangeLabel(bucket._id),
                        count: bucket.count
                    })),
                    peakHours
                },
                timeRange
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error fetching game analytics:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch analytics' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

async function calculateRetention(gameId, playerIds, startDate) {
    const retentionData = [];
    const cohortSize = playerIds.length;

    for (let day = 0; day <= 7; day++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() + day);
        const nextDay = new Date(checkDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const sessions = await playtimeSessionsCollection.find({
            gameId,
            userId: { $in: playerIds },
            startedAt: { $gte: checkDate, $lt: nextDay }
        }).toArray();

        const uniqueUsers = new Set(sessions.map(s => s.userId));
        const activePlayers = Array.from(uniqueUsers);

        retentionData.push({
            day,
            retention: cohortSize > 0 ? (activePlayers.length / cohortSize * 100).toFixed(1) : 0
        });
    }

    return retentionData;
}

async function calculatePeakHours(sessions) {
    const hourCounts = new Array(24).fill(0);

    sessions.forEach(session => {
        const hour = new Date(session.startedAt).getHours();
        hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sessions: count
    }));
}

function getPlaytimeRangeLabel(boundary) {
    const ranges = {
        0: '0-1h',
        3600: '1-2h',
        7200: '2-5h',
        18000: '5-10h',
        36000: '10-20h',
        72000: '20-50h',
        180000: '50h+',
        'Other': 'Unknown'
    };
    return ranges[boundary] || 'Unknown';
}