import { usersCollection, xpLogCollection } from './database.js';

export async function addXP(userId, amount) {
    let user = await usersCollection.findOne({ id: userId });

    user.level = user.level ?? 0;
    user.xp = user.xp ?? 0;
    user.xp_required = user.xp_required ?? 700;

    user.xp += amount;

    while (user.xp >= user.xp_required) {
        user.level++;

        user.xp -= user.xp_required;

        user.xp_required *= 1.1;
        user.xp_required = Math.ceil(user.xp_required);
    }

    await usersCollection.updateOne(
        { id: userId },
        {
            $set: {
                xp: user.xp,
                level: user.level,
                xp_required: user.xp_required
            }
        }
    );

    await xpLogCollection.insertOne({
        userId,
        amount,
        timestamp: new Date()
    });
}

export const EXPERIENCE_TABLE = {
    POST: 450,
    LIKE: 20,
    DISLIKE: 20,
    SKIP: 10,
    INVITE: 650
};