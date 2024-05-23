import { MongoClient } from "https://deno.land/x/mongo@v0.28.0/mod.ts";
import { sendMessageToDiscordWebhook } from './discord.js';
import { joinGuild } from './discord_bot.js';

const databaseUrl = Deno.env.get("DATABASE_URL");

const client = new MongoClient();
await client.connect(databaseUrl);
const db = client.database("vapr");

// Environment variable-based configuration
const clientId = Deno.env.get("DISCORD_ClientID");
const clientSecret = Deno.env.get("DISCORD_ClientSecret");
const DOMAIN = Deno.env.get("DOMAIN");
const redirectUri = `https://${DOMAIN}/auth/discord/callback`;

const usersCollection = db.collection("users");
const secretKeysCollection = db.collection("secretKeys");

export async function updateBackgroundId(userId, newBackgroundId) {
    try {
        // Update the user's backgroundId in the database
        const result = await usersCollection.updateOne(
            { id: userId },
            { $set: { backgroundId: newBackgroundId } }
        );

        if (result.modifiedCount === 1) {
            console.log(`Updated user ${userId} backgroundId to ${newBackgroundId}`);
            return { success: true };
        } else {
            console.error('No user found with the provided id:', userId);
            return { success: false, message: "No user found with the provided id" };
        }
    } catch (error) {
        console.error('Failed to update backgroundId for user:', userId, error);
        return { success: false, message: "Failed to update backgroundId" };
    }
}

function generateSecretKey() {
    const byteLength = 32;  // Typically sufficient for security needs
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes));
}

export async function authenticateRequest(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { isValid: false };
    }

    const token = authHeader.slice(7);  // Remove "Bearer "
    const secretKey = await secretKeysCollection.findOne({ key: token });

    if (secretKey && secretKey.userId) {
        const userData = await usersCollection.findOne({ id: secretKey.userId });

        if (userData) {
            return { isValid: true, userData };
        }
    }
    return { isValid: false };
}

export async function handleOAuthCallback(request) {
    const url = new URL(request.url, `https://${DOMAIN}/`);
    const code = url.searchParams.get("code");
    if (!code) return new Response("Authorization code not found", { status: 400 });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri
        })
    });

    if (!tokenResponse.ok) {
        return new Response("Failed to obtain access token", { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
        return new Response("Failed to fetch user data", { status: userResponse.status });
    }

    const userData = await userResponse.json();

    joinGuild(accessToken, "1226141081964515449", userData.id);

    let user = await usersCollection.findOne({ id: userData.id });

    if (!user) {
        await usersCollection.insertOne({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            provider: 'discord',
            level: 0,
            xp: 0,
            xp_required: 700
        });

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1235274235438436413/wIBKtVBz9QvyqqUN8Fu4jSoKfXsQn-ior-92FzPNPKxbDrI2i1VhzV4ps_XqzdjPlb9q",
            `${userData.username} joined VAPR we are now ${(await usersCollection.countDocuments())} members!`
        );
    } else if (user.username !== userData.username) {
        await usersCollection.updateOne(
            { id: userData.id },
            { $set: { username: userData.username } }
        );
    }

    const secret_key = generateSecretKey();
    await secretKeysCollection.insertOne({
        key: secret_key,
        userId: userData.id
    });

    const htmlTemplate = await Deno.readTextFile("discord_callback.html");
    const htmlContent = htmlTemplate
        .replace('{{jwt}}', secret_key)
        .replace('{{userData}}', JSON.stringify(userData).replace(/"/g, '\\"'));

    return new Response(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html" }
    });
}

export function redirectToDiscordLogin() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
    return Response.redirect(authUrl);
}
