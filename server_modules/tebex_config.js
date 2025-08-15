import { tebexConfigsCollection, gamesCollection, usersCollection } from './database.js';

export async function setTebexConfig(userId, tebexConfig) {
    try {
        const user = await usersCollection.findOne({ id: userId });
        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const userGames = await gamesCollection.find({ ownerId: userId }).toArray();
        if (userGames.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You must be a game developer to configure Tebex'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const config = {
            userId,
            username: user.username,
            webstoreToken: tebexConfig.webstoreToken,
            storeName: tebexConfig.storeName || user.username + "'s Store",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const testResponse = await fetch(`https://headless.tebex.io/api/accounts/${tebexConfig.webstoreToken}/packages`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!testResponse.ok) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid Tebex webstore token'
                }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to validate Tebex token'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        await tebexConfigsCollection.updateOne(
            { userId },
            { $set: config },
            { upsert: true }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Tebex configuration saved successfully'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error setting Tebex config:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to save Tebex configuration'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getTebexConfig(userId) {
    try {
        const config = await tebexConfigsCollection.findOne({ userId });

        if (!config) {
            return new Response(JSON.stringify({
                success: true,
                config: null
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const safeConfig = {
            ...config,
            webstoreToken: config.webstoreToken,
            hasConfig: true
        };

        return new Response(JSON.stringify({
            success: true,
            config: safeConfig
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting Tebex config:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get Tebex configuration'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getAllTebexConfigs() {
    try {
        const configs = await tebexConfigsCollection.find({ isActive: true }).toArray();

        const publicConfigs = configs.map(config => ({
            userId: config.userId,
            username: config.username,
            storeName: config.storeName,
            webstoreToken: config.webstoreToken
        }));

        return new Response(JSON.stringify({
            success: true,
            configs: publicConfigs
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting all Tebex configs:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get Tebex configurations'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function removeTebexConfig(userId) {
    try {
        await tebexConfigsCollection.deleteOne({ userId });

        return new Response(JSON.stringify({
            success: true,
            message: 'Tebex configuration removed successfully'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error removing Tebex config:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to remove Tebex configuration'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}