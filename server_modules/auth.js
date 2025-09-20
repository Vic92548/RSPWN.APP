import { usersCollection, secretKeysCollection } from './database.js';
import { sendMessageToDiscordWebhook } from './discord.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as stytch from 'stytch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STYTCH_PROJECT_ID = process.env.STYTCH_PROJECT_ID || 'project-test-79d91f96-5db2-43e9-953e-f575d25ad53b';
const STYTCH_SECRET = process.env.STYTCH_SECRET || 'secret-test-RcLdSYk1x7PZMATufPzIv-7ZDAQR_midHPY=';
const BASE_URL = process.env.BASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

const stytchClient = new stytch.Client({
    project_id: STYTCH_PROJECT_ID,
    secret: STYTCH_SECRET,
    env: stytch.envs.test
});

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

export async function handleStytchCallback(request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const token_type = url.searchParams.get("stytch_token_type");

    if (!token) return new Response("Authentication token not found", { status: 400 });

    try {
        let authResponse;

        if (token_type === 'magic_links') {
            authResponse = await stytchClient.magicLinks.authenticate({
                token: token
            });
        } else if (token_type === 'otps') {
            authResponse = await stytchClient.otps.authenticate({
                token: token
            });
        } else {
            return new Response("Invalid token type", { status: 400 });
        }

        if (authResponse.status_code !== 200) {
            return new Response("Authentication failed", { status: 401 });
        }

        const stytchUser = authResponse.user;
        const email = stytchUser.emails[0]?.email;
        const userId = stytchUser.user_id;

        let user = await usersCollection.findOne({
            $or: [
                { id: userId },
                { email: email }
            ]
        });

        if (!user) {
            const username = email.split('@')[0];

            await usersCollection.insertOne({
                id: userId,
                username: username,
                email: email,
                provider: 'stytch',
                avatar: null,
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
                    `${username} joined RSPWN we are now ${(await usersCollection.countDocuments())} members!`
                );
            }

            user = { id: userId, username, email, provider: 'stytch' };
        } else {
            await usersCollection.updateOne(
                { $or: [{ id: userId }, { email: email }] },
                {
                    $set: {
                        id: userId,
                        email: email,
                        lastLoginAt: new Date()
                    }
                }
            );
        }

        const jwtToken = generateSecureToken(userId);

        const htmlTemplate = await fs.readFile(path.join(__dirname, '..', 'stytch_callback.html'), 'utf8');
        const htmlContent = htmlTemplate
            .replace('{{userData}}', JSON.stringify({ id: userId, email, username: user.username }).replace(/"/g, '\\"'));

        return new Response(htmlContent, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
                "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
                "Set-Cookie": `jwt=${jwtToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
            }
        });
    } catch (error) {
        console.error('Stytch authentication error:', error);
        return new Response("Authentication failed", { status: 500 });
    }
}

export async function sendMagicLink(email) {
    try {
        const response = await stytchClient.magicLinks.email.loginOrCreate({
            email: email,
            login_magic_link_url: `${BASE_URL}/auth/stytch/callback`,
            signup_magic_link_url: `${BASE_URL}/auth/stytch/callback`
        });

        if (response.status_code === 200) {
            return { success: true, message: 'Magic link sent successfully' };
        } else {
            return { success: false, message: 'Failed to send magic link' };
        }
    } catch (error) {
        console.error('Error sending magic link:', error);
        return { success: false, message: 'Failed to send magic link' };
    }
}

export async function sendOTP(email) {
    try {
        const response = await stytchClient.otps.email.loginOrCreate({
            email: email
        });

        if (response.status_code === 200) {
            return { success: true, message: 'OTP sent successfully' };
        } else {
            return { success: false, message: 'Failed to send OTP' };
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        return { success: false, message: 'Failed to send OTP' };
    }
}

export async function verifyOTP(email, code) {
    try {
        const response = await stytchClient.otps.authenticate({
            method_id: email,
            code: code
        });

        if (response.status_code === 200) {
            const stytchUser = response.user;
            const userId = stytchUser.user_id;

            let user = await usersCollection.findOne({
                $or: [
                    { id: userId },
                    { email: email }
                ]
            });

            if (!user) {
                const username = email.split('@')[0];

                await usersCollection.insertOne({
                    id: userId,
                    username: username,
                    email: email,
                    provider: 'stytch',
                    avatar: null,
                    level: 0,
                    xp: 0,
                    xp_required: 700,
                    createdAt: new Date(),
                    lastLoginAt: new Date()
                });

                user = { id: userId, username, email, provider: 'stytch' };
            } else {
                await usersCollection.updateOne(
                    { $or: [{ id: userId }, { email: email }] },
                    {
                        $set: {
                            id: userId,
                            email: email,
                            lastLoginAt: new Date()
                        }
                    }
                );
            }

            const jwtToken = generateSecureToken(userId);
            return { success: true, token: jwtToken, user };
        } else {
            return { success: false, message: 'Invalid OTP' };
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, message: 'Failed to verify OTP' };
    }
}