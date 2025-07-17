import { usersCollection, registrationReferralsCollection, xpLogCollection } from "../database.js";

export async function leaderboardHandler(_request) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const xpToday = await xpLogCollection.aggregate([
        { $match: { timestamp: { $gte: todayStart } } },
        { $group: { _id: "$userId", xp: { $sum: "$amount" } } }
    ]).toArray();

    const xpMap = Object.fromEntries(xpToday.map(e => [e._id, e.xp]));

    const referrals = await registrationReferralsCollection.find().toArray();
    const creatorMap = {};

    referrals.forEach(r => {
        if (!creatorMap[r.ambassadorUserId]) creatorMap[r.ambassadorUserId] = [];
        creatorMap[r.ambassadorUserId].push(r.invitedUserId);
    });

    const leaderboard = [];

    for (const creatorId in creatorMap) {
        const ownXp = xpMap[creatorId] || 0;
        const invitees = creatorMap[creatorId];
        const inviteesXp = invitees.reduce((sum, id) => sum + (xpMap[id] || 0), 0);
        const score = ownXp + inviteesXp;

        const creator = await usersCollection.findOne({ id: creatorId }, { projection: { username: 1, level: 1 } });

        leaderboard.push({
            id: creatorId,
            username: creator?.username || "Unknown",
            level: creator?.level || 0,
            ownXp,
            inviteesXp,
            score
        });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify(leaderboard.slice(0, 10)), {
        headers: { "Content-Type": "application/json" }
    });
}
