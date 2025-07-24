import { MongoClient } from "npm:mongodb@6";

const databaseUrl = Deno.env.get("DATABASE_URL");

const client = new MongoClient(databaseUrl);
await client.connect();
const db = client.db("vapr");
const usersCollection = db.collection("users");
const xpLogCollection = db.collection("xpLog");

export async function addXP(userId, amount) {
    console.log("Finding user with id : " + userId + " to add xp to...");

    let user = await usersCollection.findOne({ id: userId });

    console.log(user);

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

    console.log("Updating user data...");

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

    console.log("XP added successfully!");
}

export const EXPERIENCE_TABLE = {
    POST: 450,
    LIKE: 20,
    DISLIKE: 20,
    SKIP: 10,
    INVITE: 650
};