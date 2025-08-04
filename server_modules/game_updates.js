import { gamesCollection, gameVersionsCollection, gameUpdatesCollection, userGamesCollection } from './database.js';

export async function createGameVersion(gameId, ownerId, versionData) {
    try {
        const game = await gamesCollection.findOne({ id: gameId });

        if (!game) {
            return new Response(JSON.stringify({ success: false, error: 'Game not found' }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (game.ownerId !== ownerId) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const version = {
            id: crypto.randomUUID(),
            gameId,
            version: versionData.version,
            downloadUrl: versionData.downloadUrl,
            size: versionData.size || null,
            changelog: versionData.changelog || '',
            releaseNotes: versionData.releaseNotes || '',
            isRequired: versionData.isRequired || false,
            minimumVersion: versionData.minimumVersion || null,
            createdAt: new Date(),
            createdBy: ownerId,
            downloads: 0
        };

        await gameVersionsCollection.insertOne(version);

        // Update the game's current version and download URL
        await gamesCollection.updateOne(
            { id: gameId },
            {
                $set: {
                    currentVersion: version.version,
                    downloadUrl: version.downloadUrl,
                    lastUpdated: new Date()
                }
            }
        );

        // Create update notifications for all users who own the game
        const gameOwners = await userGamesCollection.find({ gameId }).toArray();
        const updateNotifications = gameOwners.map(owner => ({
            userId: owner.userId,
            gameId,
            versionId: version.id,
            fromVersion: owner.installedVersion || 'unknown',
            toVersion: version.version,
            isRequired: version.isRequired,
            seen: false,
            downloaded: false,
            createdAt: new Date()
        }));

        if (updateNotifications.length > 0) {
            await gameUpdatesCollection.insertMany(updateNotifications);
        }

        return new Response(JSON.stringify({ success: true, version }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error creating game version:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create version' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getGameVersions(gameId) {
    try {
        const versions = await gameVersionsCollection
            .find({ gameId })
            .sort({ createdAt: -1 })
            .toArray();

        return new Response(JSON.stringify({ success: true, versions }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error fetching game versions:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch versions' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function checkForUpdates(userId) {
    try {
        const updates = await gameUpdatesCollection.aggregate([
            { $match: { userId, downloaded: false } },
            {
                $lookup: {
                    from: "games",
                    localField: "gameId",
                    foreignField: "id",
                    as: "game"
                }
            },
            {
                $lookup: {
                    from: "gameVersions",
                    localField: "versionId",
                    foreignField: "id",
                    as: "version"
                }
            },
            { $unwind: "$game" },
            { $unwind: "$version" },
            {
                $project: {
                    gameId: 1,
                    gameTitle: "$game.title",
                    gameCover: "$game.coverImage",
                    fromVersion: 1,
                    toVersion: 1,
                    isRequired: 1,
                    seen: 1,
                    changelog: "$version.changelog",
                    releaseNotes: "$version.releaseNotes",
                    downloadUrl: "$version.downloadUrl",
                    size: "$version.size",
                    createdAt: 1
                }
            }
        ]).toArray();

        return new Response(JSON.stringify({ success: true, updates }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error checking for updates:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to check updates' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function markUpdateAsSeen(userId, gameId) {
    try {
        await gameUpdatesCollection.updateMany(
            { userId, gameId, seen: false },
            { $set: { seen: true } }
        );

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error marking update as seen:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to mark as seen' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function markUpdateAsDownloaded(userId, gameId, version) {
    try {
        await gameUpdatesCollection.updateMany(
            { userId, gameId },
            { $set: { downloaded: true } }
        );

        await userGamesCollection.updateOne(
            { userId, gameId },
            { $set: { installedVersion: version, lastUpdated: new Date() } }
        );

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error marking update as downloaded:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to mark as downloaded' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Compare versions (semantic versioning)
export function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;

        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }

    return 0;
}