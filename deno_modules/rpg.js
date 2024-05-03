/**
 * Adds XP to the user's data and handles leveling up if necessary.
 *
 * @param {Object} userData - The user data object containing level, xp, and xp_required.
 * @param {number} amount - The amount of XP to add.
 */
export async function addXP(userData, amount) {
    // Initialize user data if not already set
    userData.level = userData.level ?? 0;
    userData.xp = userData.xp ?? 0;
    userData.xp_required = userData.xp_required ?? 700;

    // Add the given amount of XP to the user's current XP
    userData.xp += amount;

    // Check if the user's XP meets or exceeds the required XP to level up
    while (userData.xp >= userData.xp_required) {
        // Increase the level
        userData.level++;

        // Subtract the required XP from the current XP
        userData.xp -= userData.xp_required;

        // Increase the required XP for the next level by 10%
        userData.xp_required *= 1.1;
        userData.xp_required = Math.ceil(userData.xp_required);  // Ensure it's an integer
    }

    const kv = await Deno.openKv();
    await kv.set(["discordUser", userData.id], userData);

}

export const EXPERIENCE_TABLE = {
    POST: 450,
    LIKE: 20,
    DISLIKE: 20,
    SKIP: 10
}