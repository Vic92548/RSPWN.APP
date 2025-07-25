import { usersCollection, secretKeysCollection } from './database.js';
import { sendMessageToDiscordWebhook } from './discord.js';
import { joinGuild } from './discord_bot.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientId = process.env.DISCORD_ClientID;
const clientSecret = process.env.DISCORD_ClientSecret;
const BASE_URL = process.env.BASE_URL;
const redirectUri = `${BASE_URL}/auth/discord/callback`;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production');
}

export async function updateBackgroundId(userId, newBackgroundId) {
    try {
        const sanitizedBackgroundId = newBackgroundId.replace(/[^a-zA-Z0-9_-]/g, '');

        const result = await usersCollection.updateOne(
            { id: userId },
            { $set: { backgroundId: sanitizedBackgroundId } }
        );

        if (result.modifiedCount === 1) {
            console.log(`Updated user ${userId} backgroundId to ${sanitizedBackgroundId}`);
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

function generateSecureToken(userId) {
    const payload = {
        userId: userId,
        iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = value;
        }
    });
    return cookies;
}

export async function authenticateRequest(request) {
    let token = null;

    const authHeader = request.headers.authorization || request.headers.get?.("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
    } else {
        const cookieHeader = request.headers.cookie || request.headers.get?.("Cookie") || request.headers.Cookie;
        if (cookieHeader) {
            const cookies = parseCookies(cookieHeader);
            token = cookies.jwt;
        } else if (request.cookies && request.cookies.jwt) {
            token = request.cookies.jwt;
        }
    }

    if (!token) {
        return { isValid: false };
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
        return { isValid: false };
    }

    const userData = await usersCollection.findOne({ id: decoded.userId });
    if (!userData) {
        return { isValid: false };
    }

    return { isValid: true, userData };
}

function parseStateFromCookie(cookieHeader) {
    if (!cookieHeader) return null;
    const cookies = parseCookies(cookieHeader);
    return cookies.oauth_state;
}

export async function handleOAuthCallback(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) return new Response("Authorization code not found", { status: 400 });

    const cookieHeader = request.headers.cookie || request.headers.get?.("Cookie");
    const storedState = parseStateFromCookie(cookieHeader);

    if (!state || state !== storedState) {
        return new Response("Invalid state parameter", { status: 400 });
    }

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

    try {
        await joinGuild(accessToken, "1226141081964515449", userData.id);
    } catch (error) {
        console.error("Failed to add user to guild:", error);
    }

    let user = await usersCollection.findOne({ id: userData.id });

    if (!user) {
        await usersCollection.insertOne({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            provider: 'discord',
            avatar: userData.avatar,
            level: 0,
            xp: 0,
            xp_required: 700,
            createdAt: new Date(),
            lastLoginAt: new Date()
        });

        const discordJoinWebhook = process.env.DISCORD_JOIN_WEBHOOK_URL;

        if (discordJoinWebhook) {
            sendMessageToDiscordWebhook(
                discordJoinWebhook,
                `${userData.username} joined VAPR we are now ${(await usersCollection.countDocuments())} members!`
            );
        }
    } else {
        await usersCollection.updateOne(
            { id: userData.id },
            {
                $set: {
                    username: userData.username,
                    email: userData.email,
                    avatar: userData.avatar,
                    lastLoginAt: new Date()
                }
            }
        );
    }

    const jwtToken = generateSecureToken(userData.id);

    const htmlTemplate = await fs.readFile(path.join(__dirname, '..', 'discord_callback.html'), 'utf8');
    const htmlContent = htmlTemplate
        .replace('{{jwt}}', '')
        .replace('{{userData}}', JSON.stringify(userData).replace(/"/g, '\\"'));

    return new Response(htmlContent, {
        status: 200,
        headers: {
            "Content-Type": "text/html",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
            "Set-Cookie": `jwt=${jwtToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
        }
    });
}

export function redirectToDiscordLogin() {
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join&state=${state}`;

    return new Response(null, {
        status: 302,
        headers: {
            'Location': authUrl,
            'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
        }
    });
}