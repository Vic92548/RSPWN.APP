import { playtimeSessionsCollection, userGamesCollection } from './database.js';

// Record a single playtime session for a user and game
export async function recordPlaytimeSession(userId, session) {
    try {
        const { gameId, startedAt, endedAt, durationSeconds } = session || {};

        if (!gameId || typeof gameId !== 'string') {
            return new Response(JSON.stringify({ success: false, error: 'gameId is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const duration = Number(durationSeconds);
        if (!Number.isFinite(duration) || duration <= 0) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid durationSeconds' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Ensure the user owns the game
        const ownership = await userGamesCollection.findOne({ userId, gameId });
        if (!ownership) {
            return new Response(JSON.stringify({ success: false, error: 'You do not own this game' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const started = startedAt ? new Date(startedAt) : new Date(Date.now() - duration * 1000);
        const ended = endedAt ? new Date(endedAt) : new Date();

        await playtimeSessionsCollection.insertOne({
            userId,
            gameId,
            startedAt: started,
            endedAt: ended,
            durationSeconds: duration,
            createdAt: new Date()
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error recording playtime session:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to record session' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Return totals per game for the user
export async function getUserPlaytimeTotals(userId) {
    try {
        const totals = await playtimeSessionsCollection.aggregate([
            { $match: { userId } },
            { $group: { _id: '$gameId', totalSeconds: { $sum: '$durationSeconds' }, sessions: { $sum: 1 } } },
            { $project: { _id: 0, gameId: '$_id', totalSeconds: 1, sessions: 1 } }
        ]).toArray();

        return new Response(JSON.stringify({ success: true, totals }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching playtime totals:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch totals' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
