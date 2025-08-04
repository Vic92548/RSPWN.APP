import { gamesCollection, gameVersionsCollection } from './database.js';

async function uploadGameUpdateToBunnyCDN(file, gameId, version) {
    try {
        const accessKey = process.env.BUNNY_CDN_ACCESSKEY;
        const storageZoneUrl = process.env.BUNNY_CDN_STORAGE_URL;
        const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;

        if (!accessKey || !storageZoneUrl || !cdnHostname) {
            throw new Error("Bunny CDN configuration is missing from environment variables.");
        }

        // Create a unique filename with game ID and version
        const sanitizedVersion = version.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${gameId}_v${sanitizedVersion}.zip`;
        const uploadUrl = `${storageZoneUrl}game-updates/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "AccessKey": accessKey,
                "Content-Type": "application/zip",
                "accept": "application/json"
            },
            body: file.buffer
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to upload game update. Response:", errorText);
            return { success: false, msg: errorText };
        }

        console.log("Game update uploaded successfully to Bunny CDN");
        return {
            success: true,
            url: `https://${cdnHostname}/game-updates/${fileName}`,
            size: file.size
        };
    } catch (error) {
        console.error("Error in uploadGameUpdateToBunnyCDN:", error);
        return { success: false, msg: error.message };
    }
}

export async function uploadGameUpdate(gameId, ownerId, file) {
    try {
        // Verify ownership
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

        // Extract version from filename or use timestamp
        const fileName = file.originalname || file.name || '';
        const versionMatch = fileName.match(/v?(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : new Date().getTime().toString();

        // Upload to Bunny CDN
        const uploadResult = await uploadGameUpdateToBunnyCDN(file, gameId, version);

        if (!uploadResult.success) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to upload file: ' + uploadResult.msg
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            downloadUrl: uploadResult.url,
            size: Math.round(uploadResult.size / 1024 / 1024), // Convert to MB
            version: version
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error uploading game update:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to upload game update'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}