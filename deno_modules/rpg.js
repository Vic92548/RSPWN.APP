import { MongoClient } from "npm:mongodb@6";

const databaseUrl = Deno.env.get("DATABASE_URL");

const client = new MongoClient(databaseUrl);
await client.connect();
const db = client.db("vapr");
const usersCollection = db.collection("users");

/**
 * Adds XP to the user's data and handles leveling up if necessary.
 *
 * @param {string} userId - The user ID.
 * @param {number} amount - The amount of XP to add.
 */
export async function addXP(userId, amount) {
    // Retrieve the user data from the database
    console.log("Finding user with id : " + userId + " to add xp to...");

    let user = await usersCollection.findOne({ id: userId });

    console.log(user);

    // Initialize user data if not already set
    user.level = user.level ?? 0;
    user.xp = user.xp ?? 0;
    user.xp_required = user.xp_required ?? 700;

    // Add the given amount of XP to the user's current XP
    user.xp += amount;

    // Check if the user's XP meets or exceeds the required XP to level up
    while (user.xp >= user.xp_required) {
        // Increase the level
        user.level++;

        // Subtract the required XP from the current XP
        user.xp -= user.xp_required;

        // Increase the required XP for the next level by 10%
        user.xp_required *= 1.1;
        user.xp_required = Math.ceil(user.xp_required);  // Ensure it's an integer
    }

    console.log("Updating user data...");

    // Update the user record in the database with the new XP, level, and XP required
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

    console.log("XP added successfully!");
}

export const EXPERIENCE_TABLE = {
    POST: 450,
    LIKE: 20,
    DISLIKE: 20,
    SKIP: 10,
    INVITE: 650
};
