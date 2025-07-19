// deno_modules/feeds/feed_manager.js

import { feedsCollection, feedMembersCollection, postFeedsCollection, postsCollection, usersCollection } from "../database.js";
import { addXP, EXPERIENCE_TABLE } from "../rpg.js";

// Create a new feed
export async function createFeed(userId, feedData) {
    try {
        const feedId = crypto.randomUUID();

        const feed = {
            id: feedId,
            name: feedData.name,
            description: feedData.description || "",
            creatorId: userId,
            isPrivate: feedData.isPrivate || false,
            coverImage: feedData.coverImage || null,
            icon: feedData.icon || "🌐",
            rules: feedData.rules || "",
            tags: feedData.tags || [],
            memberCount: 1,
            postCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await feedsCollection.insertOne(feed);

        // Creator automatically joins as owner
        await feedMembersCollection.insertOne({
            feedId: feedId,
            userId: userId,
            role: 'owner',
            joinedAt: new Date(),
            canPost: true,
            notifications: true
        });

        // Award XP for creating a feed
        await addXP(userId, 100);

        return new Response(JSON.stringify({ success: true, feed }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error creating feed:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Failed to create feed"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Join a feed
export async function joinFeed(userId, feedId) {
    try {
        const feed = await feedsCollection.findOne({ id: feedId });

        if (!feed) {
            return new Response(JSON.stringify({
                success: false,
                error: "Feed not found"
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check if already a member
        const existingMembership = await feedMembersCollection.findOne({
            feedId: feedId,
            userId: userId
        });

        if (existingMembership) {
            return new Response(JSON.stringify({
                success: false,
                error: "Already a member of this feed"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Join the feed
        await feedMembersCollection.insertOne({
            feedId: feedId,
            userId: userId,
            role: 'member',
            joinedAt: new Date(),
            canPost: true,
            notifications: true
        });

        // Update member count
        await feedsCollection.updateOne(
            { id: feedId },
            { $inc: { memberCount: 1 } }
        );

        // Award XP for joining
        await addXP(userId, 20);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error joining feed:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Failed to join feed"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Leave a feed
export async function leaveFeed(userId, feedId) {
    try {
        const membership = await feedMembersCollection.findOne({
            feedId: feedId,
            userId: userId
        });

        if (!membership) {
            return new Response(JSON.stringify({
                success: false,
                error: "Not a member of this feed"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (membership.role === 'owner') {
            return new Response(JSON.stringify({
                success: false,
                error: "Feed owner cannot leave. Please transfer ownership first."
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Remove membership
        await feedMembersCollection.deleteOne({
            feedId: feedId,
            userId: userId
        });

        // Update member count
        await feedsCollection.updateOne(
            { id: feedId },
            { $inc: { memberCount: -1 } }
        );

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error leaving feed:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Failed to leave feed"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get user's feeds
export async function getUserFeeds(userId) {
    try {
        const memberships = await feedMembersCollection.find({ userId }).toArray();
        const feedIds = memberships.map(m => m.feedId);

        const feeds = await feedsCollection.find({
            id: { $in: feedIds }
        }).toArray();

        // Add membership info to each feed
        const feedsWithMembership = feeds.map(feed => {
            const membership = memberships.find(m => m.feedId === feed.id);
            return {
                ...feed,
                membership: {
                    role: membership.role,
                    joinedAt: membership.joinedAt,
                    canPost: membership.canPost,
                    notifications: membership.notifications
                }
            };
        });

        return new Response(JSON.stringify(feedsWithMembership), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error getting user feeds:", error);
        return new Response(JSON.stringify({ error: "Failed to get feeds" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get public feeds for discovery
export async function getPublicFeeds(limit = 20, offset = 0) {
    try {
        const feeds = await feedsCollection
            .find({ isPrivate: false })
            .sort({ memberCount: -1, postCount: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();

        return new Response(JSON.stringify(feeds), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error getting public feeds:", error);
        return new Response(JSON.stringify({ error: "Failed to get feeds" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get feed details
export async function getFeedDetails(feedId, userId = null) {
    try {
        const feed = await feedsCollection.findOne({ id: feedId });

        if (!feed) {
            return new Response(JSON.stringify({ error: "Feed not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check membership if user is provided
        let membership = null;
        if (userId) {
            membership = await feedMembersCollection.findOne({
                feedId: feedId,
                userId: userId
            });
        }

        // Get recent posts count
        const recentPosts = await postFeedsCollection.countDocuments({
            feedId: feedId,
            addedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        return new Response(JSON.stringify({
            ...feed,
            membership: membership,
            recentPostsCount: recentPosts,
            canView: !feed.isPrivate || membership !== null
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error getting feed details:", error);
        return new Response(JSON.stringify({ error: "Failed to get feed details" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get posts from user's joined feeds
export async function getUserFeedPosts(userId, limit = 10, offset = 0) {
    try {
        // Get user's feed memberships
        const memberships = await feedMembersCollection.find({ userId }).toArray();
        const feedIds = memberships.map(m => m.feedId);

        if (feedIds.length === 0) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get posts from these feeds
        const postFeeds = await postFeedsCollection
            .find({ feedId: { $in: feedIds } })
            .sort({ addedAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();

        const postIds = postFeeds.map(pf => pf.postId);

        // Get full post data
        const posts = await postsCollection.find({
            id: { $in: postIds }
        }).toArray();

        // Add feed info to each post
        const postsWithFeeds = await Promise.all(posts.map(async post => {
            const postFeedEntries = postFeeds.filter(pf => pf.postId === post.id);
            const feedDetails = await feedsCollection.find({
                id: { $in: postFeedEntries.map(pf => pf.feedId) }
            }).toArray();

            const user = await usersCollection.findOne({ id: post.userId });

            return {
                ...post,
                username: user?.username || 'Unknown',
                feeds: feedDetails.map(f => ({
                    id: f.id,
                    name: f.name,
                    icon: f.icon
                }))
            };
        }));

        // Sort by timestamp
        postsWithFeeds.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return new Response(JSON.stringify(postsWithFeeds), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error getting feed posts:", error);
        return new Response(JSON.stringify({ error: "Failed to get feed posts" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Search feeds
export async function searchFeeds(query, isPrivate = null) {
    try {
        const searchFilter = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ]
        };

        if (isPrivate !== null) {
            searchFilter.isPrivate = isPrivate;
        }

        const feeds = await feedsCollection
            .find(searchFilter)
            .sort({ memberCount: -1 })
            .limit(20)
            .toArray();

        return new Response(JSON.stringify(feeds), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error searching feeds:", error);
        return new Response(JSON.stringify({ error: "Search failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}