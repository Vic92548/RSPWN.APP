import { bucketsCollection, bucketItemsCollection, usersCollection, postsCollection, gamesCollection } from './database.js';

// Create a new bucket
export async function createBucket(userId, bucketData) {
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

        const bucket = {
            id: crypto.randomUUID(),
            name: bucketData.name,
            description: bucketData.description || '',
            ownerId: userId,
            ownerUsername: user.username,
            type: bucketData.type || 'general', // general, game_posts, playlist, favorites, etc.
            visibility: bucketData.visibility || 'private', // private, public, unlisted
            metadata: bucketData.metadata || {}, // Store additional data like gameId for game_posts
            itemCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await bucketsCollection.insertOne(bucket);

        return new Response(JSON.stringify({
            success: true,
            bucket
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error creating bucket:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create bucket'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get buckets for a user
export async function getUserBuckets(userId, includePublic = false) {
    try {
        const query = includePublic
            ? { $or: [{ ownerId: userId }, { visibility: 'public' }] }
            : { ownerId: userId };

        const buckets = await bucketsCollection
            .find(query)
            .sort({ updatedAt: -1 })
            .toArray();

        return new Response(JSON.stringify({
            success: true,
            buckets
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error fetching buckets:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch buckets'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get a specific bucket
export async function getBucket(bucketId, userId = null) {
    try {
        const bucket = await bucketsCollection.findOne({ id: bucketId });

        if (!bucket) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Bucket not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check access permissions
        if (bucket.visibility === 'private' && bucket.ownerId !== userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Access denied'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            bucket
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error fetching bucket:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch bucket'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Add item to bucket
export async function addItemToBucket(bucketId, userId, itemData) {
    try {
        const bucket = await bucketsCollection.findOne({ id: bucketId });

        if (!bucket) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Bucket not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check ownership
        if (bucket.ownerId !== userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check if item already exists
        const existingItem = await bucketItemsCollection.findOne({
            bucketId,
            itemId: itemData.itemId,
            itemType: itemData.itemType
        });

        if (existingItem) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Item already in bucket'
            }), {
                status: 409,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Validate item exists
        let itemDetails = null;
        if (itemData.itemType === 'post') {
            const post = await postsCollection.findOne({ id: itemData.itemId });
            if (!post) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Post not found'
                }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            const postOwner = await usersCollection.findOne({ id: post.userId });
            itemDetails = {
                title: post.title,
                content: post.content,
                mediaType: post.mediaType,
                username: postOwner?.username || 'Unknown',
                userId: post.userId,
                timestamp: post.timestamp
            };
        }

        const bucketItem = {
            id: crypto.randomUUID(),
            bucketId,
            itemId: itemData.itemId,
            itemType: itemData.itemType, // post, game, user, etc.
            itemDetails, // Cache some details for quick display
            notes: itemData.notes || '',
            metadata: itemData.metadata || {},
            addedBy: userId,
            addedAt: new Date(),
            position: await bucketItemsCollection.countDocuments({ bucketId }) // For ordering
        };

        await bucketItemsCollection.insertOne(bucketItem);

        // Update bucket item count and timestamp
        await bucketsCollection.updateOne(
            { id: bucketId },
            {
                $inc: { itemCount: 1 },
                $set: { updatedAt: new Date() }
            }
        );

        return new Response(JSON.stringify({
            success: true,
            item: bucketItem
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error adding item to bucket:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to add item'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Remove item from bucket
export async function removeItemFromBucket(bucketId, itemId, userId) {
    try {
        const bucket = await bucketsCollection.findOne({ id: bucketId });

        if (!bucket) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Bucket not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (bucket.ownerId !== userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const result = await bucketItemsCollection.deleteOne({
            bucketId,
            id: itemId
        });

        if (result.deletedCount === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Item not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Update bucket item count
        await bucketsCollection.updateOne(
            { id: bucketId },
            {
                $inc: { itemCount: -1 },
                $set: { updatedAt: new Date() }
            }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Item removed successfully'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error removing item:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to remove item'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get bucket items
export async function getBucketItems(bucketId, userId = null, options = {}) {
    try {
        const bucket = await bucketsCollection.findOne({ id: bucketId });

        if (!bucket) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Bucket not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check access permissions
        if (bucket.visibility === 'private' && bucket.ownerId !== userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Access denied'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const query = { bucketId };
        const limit = options.limit || 50;
        const offset = options.offset || 0;

        const items = await bucketItemsCollection
            .find(query)
            .sort({ position: 1, addedAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();

        // Enrich items with full details
        const enrichedItems = await Promise.all(items.map(async (item) => {
            if (item.itemType === 'post') {
                const post = await postsCollection.findOne({ id: item.itemId });
                if (post) {
                    const user = await usersCollection.findOne({ id: post.userId });
                    item.currentDetails = {
                        ...post,
                        username: user?.username || 'Unknown',
                        userAvatar: user?.avatar || null,
                        userLevel: user?.level || 0
                    };
                }
            }
            return item;
        }));

        const totalCount = await bucketItemsCollection.countDocuments(query);

        return new Response(JSON.stringify({
            success: true,
            items: enrichedItems,
            totalCount,
            hasMore: totalCount > (offset + limit)
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error fetching bucket items:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch items'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Update bucket
export async function updateBucket(bucketId, userId, updates) {
    try {
        const bucket = await bucketsCollection.findOne({ id: bucketId });

        if (!bucket) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Bucket not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (bucket.ownerId !== userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const allowedUpdates = ['name', 'description', 'visibility', 'metadata'];
        const updateData = { updatedAt: new Date() };

        for (const field of allowedUpdates) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        await bucketsCollection.updateOne(
            { id: bucketId },
            { $set: updateData }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Bucket updated successfully'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error updating bucket:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to update bucket'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Delete bucket
export async function deleteBucket(bucketId, userId) {
    try {
        const bucket = await bucketsCollection.findOne({ id: bucketId });

        if (!bucket) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Bucket not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (bucket.ownerId !== userId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Delete all items in the bucket
        await bucketItemsCollection.deleteMany({ bucketId });

        // Delete the bucket
        await bucketsCollection.deleteOne({ id: bucketId });

        return new Response(JSON.stringify({
            success: true,
            message: 'Bucket deleted successfully'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error deleting bucket:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to delete bucket'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get posts for game management (special function for partners)
export async function getPostsForGameManagement(gameId, ownerId) {
    try {
        const game = await gamesCollection.findOne({ id: gameId });

        if (!game) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Game not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (game.ownerId !== ownerId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get all posts that tagged this game
        const posts = await postsCollection
            .find({ taggedGameId: gameId })
            .sort({ timestamp: -1 })
            .toArray();

        // Get the official posts bucket for this game
        const officialBucket = await bucketsCollection.findOne({
            ownerId,
            type: 'game_posts',
            'metadata.gameId': gameId
        });

        let approvedPostIds = [];
        if (officialBucket) {
            const bucketItems = await bucketItemsCollection
                .find({ bucketId: officialBucket.id })
                .toArray();
            approvedPostIds = bucketItems.map(item => item.itemId);
        }

        // Enrich posts with user data and approval status
        const enrichedPosts = await Promise.all(posts.map(async (post) => {
            const user = await usersCollection.findOne({ id: post.userId });
            return {
                ...post,
                username: user?.username || 'Unknown',
                userAvatar: user?.avatar || null,
                userLevel: user?.level || 0,
                isApproved: approvedPostIds.includes(post.id)
            };
        }));

        return new Response(JSON.stringify({
            success: true,
            posts: enrichedPosts,
            bucketId: officialBucket?.id || null
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error fetching posts for game:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch posts'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}