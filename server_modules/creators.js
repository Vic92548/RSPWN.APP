import {
    creatorApplicationsCollection,
    creatorsCollection,
    gameCreatorClicksCollection,
    usersCollection,
    postsCollection,
    followsCollection,
    likesCollection,
    viewsCollection,
    reactionsCollection,
    gamesCollection,
    partnerCreatorLinksCollection
} from './database.js';
import { sendMessageToDiscordWebhook } from './discord.js';

export async function applyForCreatorProgram(userId, tebexWalletId) {
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

        const existingApplication = await creatorApplicationsCollection.findOne({ userId });
        if (existingApplication) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You have already applied for the creator program',
                status: existingApplication.status
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const existingCreator = await creatorsCollection.findOne({ userId });
        if (existingCreator) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You are already a creator'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!tebexWalletId || !/^[a-zA-Z0-9_-]+$/.test(tebexWalletId)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid Tebex wallet ID format'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const postCount = await postsCollection.countDocuments({ userId });

        const application = {
            id: crypto.randomUUID(),
            userId,
            username: user.username,
            tebexWalletId,
            userLevel: user.level || 0,
            postCount,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await creatorApplicationsCollection.insertOne(application);

        const discordWebhook = process.env.DISCORD_CREATOR_WEBHOOK_URL;
        if (discordWebhook) {
            sendMessageToDiscordWebhook(
                discordWebhook,
                `📝 New creator application from **@${user.username}** (Level ${user.level || 0})\nPosts: ${postCount}\nWallet ID: \`${tebexWalletId}\``
            );
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Application submitted successfully',
            application: {
                id: application.id,
                status: application.status
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error applying for creator program:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to submit application'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function approveCreatorApplication(adminId, applicationId) {
    try {
        const admin = await usersCollection.findOne({ id: adminId });
        if (!admin || !admin.isAdmin) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const application = await creatorApplicationsCollection.findOne({ id: applicationId });
        if (!application) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Application not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (application.status !== 'pending') {
            return new Response(JSON.stringify({
                success: false,
                error: 'Application already processed'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        await creatorApplicationsCollection.updateOne(
            { id: applicationId },
            {
                $set: {
                    status: 'approved',
                    approvedBy: adminId,
                    approvedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        await creatorsCollection.insertOne({
            userId: application.userId,
            username: application.username,
            tebexWalletId: application.tebexWalletId,
            createdAt: new Date(),
            stats: {
                totalClicks: 0,
                totalSales: 0,
                totalRevenue: 0
            }
        });

        const discordWebhook = process.env.DISCORD_CREATOR_WEBHOOK_URL;
        if (discordWebhook) {
            sendMessageToDiscordWebhook(
                discordWebhook,
                `✅ Creator application approved for **@${application.username}**\nThey can now earn from their content!`
            );
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Application approved successfully'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error approving application:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to approve application'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getCreatorApplicationStatus(userId) {
    try {
        const application = await creatorApplicationsCollection.findOne({ userId });
        const creator = await creatorsCollection.findOne({ userId });

        if (creator) {
            return new Response(JSON.stringify({
                success: true,
                isCreator: true,
                creatorCode: creator.username
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (application) {
            return new Response(JSON.stringify({
                success: true,
                isCreator: false,
                application: {
                    status: application.status,
                    createdAt: application.createdAt,
                    message: application.rejectionReason || null
                }
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            isCreator: false,
            application: null
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting creator status:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get creator status'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getPendingApplications(adminId) {
    try {
        const admin = await usersCollection.findOne({ id: adminId });
        if (!admin || !admin.isAdmin) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const applications = await creatorApplicationsCollection
            .find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .toArray();

        const enrichedApplications = await Promise.all(
            applications.map(async (app) => {
                const user = await usersCollection.findOne({ id: app.userId });
                const postCount = await postsCollection.countDocuments({ userId: app.userId });

                return {
                    ...app,
                    userLevel: user?.level || 0,
                    userAvatar: user?.avatar || null,
                    postCount
                };
            })
        );

        return new Response(JSON.stringify({
            success: true,
            applications: enrichedApplications
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting pending applications:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get applications'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function rejectCreatorApplication(adminId, applicationId, reason) {
    try {
        const admin = await usersCollection.findOne({ id: adminId });
        if (!admin || !admin.isAdmin) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const application = await creatorApplicationsCollection.findOne({ id: applicationId });
        if (!application) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Application not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (application.status !== 'pending') {
            return new Response(JSON.stringify({
                success: false,
                error: 'Application already processed'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        await creatorApplicationsCollection.updateOne(
            { id: applicationId },
            {
                $set: {
                    status: 'rejected',
                    rejectedBy: adminId,
                    rejectedAt: new Date(),
                    rejectionReason: reason,
                    updatedAt: new Date()
                }
            }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Application rejected'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error rejecting application:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to reject application'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function trackGameCreatorClick(userId, gameId, postId) {
    try {
        const post = await postsCollection.findOne({ id: postId });
        if (!post) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Post not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const creator = await creatorsCollection.findOne({ userId: post.userId });
        if (!creator) {
            return new Response(JSON.stringify({
                success: true,
                tracked: false
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        await gameCreatorClicksCollection.updateOne(
            { userId, gameId },
            {
                $set: {
                    creatorId: post.userId,
                    creatorUsername: creator.username,
                    postId,
                    lastClickedAt: new Date()
                }
            },
            { upsert: true }
        );

        await creatorsCollection.updateOne(
            { userId: post.userId },
            { $inc: { 'stats.totalClicks': 1 } }
        );

        return new Response(JSON.stringify({
            success: true,
            tracked: true,
            creatorCode: creator.username
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error tracking game creator click:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to track click'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getCreatorCodeForPurchase(userId, gameId) {
    try {
        const click = await gameCreatorClicksCollection.findOne({
            userId,
            gameId
        });

        if (click) {
            return new Response(JSON.stringify({
                success: true,
                hasCreatorCode: true,
                creatorCode: click.creatorUsername
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            hasCreatorCode: false
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting creator code:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get creator code'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getCreatorStats(creatorId) {
    try {
        const creator = await creatorsCollection.findOne({ userId: creatorId });
        if (!creator) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Creator not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const recentClicks = await gameCreatorClicksCollection
            .find({
                creatorId,
                lastClickedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            })
            .sort({ lastClickedAt: -1 })
            .limit(100)
            .toArray();

        return new Response(JSON.stringify({
            success: true,
            stats: creator.stats,
            recentClicks: recentClicks.length,
            creatorCode: creator.username
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting creator stats:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get creator stats'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getCreatorFollowers(creatorId, limit = 50, offset = 0) {
    try {
        const creator = await usersCollection.findOne({ id: creatorId });
        if (!creator) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Creator not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const followers = await followsCollection
            .find({ creatorId })
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();

        const followerIds = followers.map(f => f.followerId);
        const followerUsers = await usersCollection
            .find({
                id: { $in: followerIds }
            }, {
                projection: {
                    id: 1,
                    username: 1,
                    avatar: 1,
                    level: 1
                }
            })
            .toArray();

        const userMap = new Map(followerUsers.map(u => [u.id, u]));

        const followersWithDetails = followers
            .map(follow => {
                const user = userMap.get(follow.followerId);
                if (!user) return null;

                return {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar,
                    level: user.level || 0,
                    followedAt: follow.timestamp
                };
            })
            .filter(f => f !== null);

        const totalCount = await followsCollection.countDocuments({ creatorId });

        return new Response(JSON.stringify({
            success: true,
            followers: followersWithDetails,
            total: totalCount,
            hasMore: totalCount > (offset + limit)
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting creator followers:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get followers'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getPopularContentFromFollowedCreators(userId, limit = 20) {
    try {
        const followedCreators = await followsCollection
            .find({ followerId: userId })
            .toArray();

        const creatorIds = followedCreators.map(f => f.creatorId);

        if (creatorIds.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                posts: [],
                message: 'Not following any creators yet'
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const posts = await postsCollection
            .find({
                userId: { $in: creatorIds },
                timestamp: { $gte: thirtyDaysAgo }
            })
            .toArray();

        const postsWithMetrics = await Promise.all(posts.map(async (post) => {
            const [likes, views, reactions, followers] = await Promise.all([
                likesCollection.countDocuments({ postId: post.id }),
                viewsCollection.countDocuments({ postId: post.id }),
                reactionsCollection.countDocuments({ postId: post.id }),
                followsCollection.countDocuments({ postId: post.id })
            ]);

            const creator = await usersCollection.findOne(
                { id: post.userId },
                { projection: { username: 1, avatar: 1, level: 1 } }
            );

            let taggedGame = null;
            if (post.taggedGameId) {
                const game = await gamesCollection.findOne(
                    { id: post.taggedGameId },
                    { projection: { id: 1, title: 1, coverImage: 1 } }
                );
                taggedGame = game;
            }

            const engagementScore = likes + (reactions * 0.5) + (followers * 2);

            return {
                id: post.id,
                title: post.title,
                content: post.content,
                mediaType: post.mediaType,
                timestamp: post.timestamp,
                creator: {
                    id: creator?.id || post.userId,
                    username: creator?.username || 'Unknown',
                    avatar: creator?.avatar || null,
                    level: creator?.level || 0
                },
                metrics: {
                    likes,
                    views,
                    reactions,
                    followers,
                    engagement: views > 0 ? ((likes + reactions + followers) / views * 100).toFixed(2) : 0
                },
                engagementScore,
                taggedGame
            };
        }));

        const sortedPosts = postsWithMetrics
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, limit);

        return new Response(JSON.stringify({
            success: true,
            posts: sortedPosts
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting popular content:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get popular content'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getTopEngagedFollowers(creatorId, limit = 10, timeRange = 30) {
    try {
        const creator = await usersCollection.findOne({ id: creatorId });
        if (!creator) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Creator not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - timeRange);

        const creatorPosts = await postsCollection
            .find({
                userId: creatorId,
                timestamp: { $gte: dateFilter }
            })
            .toArray();

        const postIds = creatorPosts.map(p => p.id);

        if (postIds.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                followers: [],
                message: 'No posts in the specified time range'
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const engagementData = await Promise.all([
            likesCollection.aggregate([
                { $match: { postId: { $in: postIds }, timestamp: { $gte: dateFilter } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } }
            ]).toArray(),

            viewsCollection.aggregate([
                { $match: { postId: { $in: postIds }, timestamp: { $gte: dateFilter } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } }
            ]).toArray(),

            reactionsCollection.aggregate([
                { $match: { postId: { $in: postIds }, timestamp: { $gte: dateFilter } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } }
            ]).toArray(),

            followsCollection.aggregate([
                { $match: { postId: { $in: postIds }, timestamp: { $gte: dateFilter } } },
                { $group: { _id: '$followerId', count: { $sum: 1 } } }
            ]).toArray()
        ]);

        const [likesByUser, viewsByUser, reactionsByUser, followsByUser] = engagementData;

        const engagementMap = new Map();

        likesByUser.forEach(item => {
            if (!engagementMap.has(item._id)) {
                engagementMap.set(item._id, { likes: 0, views: 0, reactions: 0, follows: 0 });
            }
            engagementMap.get(item._id).likes = item.count;
        });

        viewsByUser.forEach(item => {
            if (!engagementMap.has(item._id)) {
                engagementMap.set(item._id, { likes: 0, views: 0, reactions: 0, follows: 0 });
            }
            engagementMap.get(item._id).views = item.count;
        });

        reactionsByUser.forEach(item => {
            if (!engagementMap.has(item._id)) {
                engagementMap.set(item._id, { likes: 0, views: 0, reactions: 0, follows: 0 });
            }
            engagementMap.get(item._id).reactions = item.count;
        });

        followsByUser.forEach(item => {
            if (!engagementMap.has(item._id)) {
                engagementMap.set(item._id, { likes: 0, views: 0, reactions: 0, follows: 0 });
            }
            engagementMap.get(item._id).follows = item.count;
        });

        const followerIds = await followsCollection
            .find({ creatorId })
            .toArray()
            .then(follows => follows.map(f => f.followerId));

        const engagedFollowers = [];

        for (const [userId, engagement] of engagementMap) {
            if (!followerIds.includes(userId)) continue;

            const engagementScore =
                (engagement.likes * 5) +
                (engagement.reactions * 3) +
                (engagement.follows * 10) +
                (engagement.views * 1);

            if (engagementScore > 0) {
                engagedFollowers.push({
                    userId,
                    engagement,
                    engagementScore
                });
            }
        }

        engagedFollowers.sort((a, b) => b.engagementScore - a.engagementScore);

        const topEngaged = engagedFollowers.slice(0, limit);

        const userIds = topEngaged.map(e => e.userId);
        const users = await usersCollection
            .find({
                id: { $in: userIds }
            }, {
                projection: {
                    id: 1,
                    username: 1,
                    avatar: 1,
                    level: 1
                }
            })
            .toArray();

        const userMap = new Map(users.map(u => [u.id, u]));

        const followDates = await followsCollection
            .find({
                creatorId,
                followerId: { $in: userIds }
            })
            .toArray();

        const followDateMap = new Map(followDates.map(f => [f.followerId, f.timestamp]));

        const result = topEngaged.map(engaged => {
            const user = userMap.get(engaged.userId);
            return {
                id: engaged.userId,
                username: user?.username || 'Unknown',
                avatar: user?.avatar || null,
                level: user?.level || 0,
                followedAt: followDateMap.get(engaged.userId) || new Date(),
                engagementScore: engaged.engagementScore,
                engagementStats: {
                    likes: engaged.engagement.likes,
                    views: engaged.engagement.views,
                    reactions: engaged.engagement.reactions,
                    follows: engaged.engagement.follows
                }
            };
        });

        return new Response(JSON.stringify({
            success: true,
            followers: result,
            timeRange: timeRange
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting top engaged followers:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get top engaged followers'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getPopularContentLovedByFollowers(creatorId, limit = 20, timeRange = 30) {
    try {
        const creator = await usersCollection.findOne({ id: creatorId });
        if (!creator) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Creator not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - timeRange);

        const myFollowers = await followsCollection
            .find({ creatorId })
            .toArray();

        const followerIds = myFollowers.map(f => f.followerId);

        if (followerIds.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                posts: [],
                message: 'No followers yet'
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const followerLikes = await likesCollection
            .find({
                userId: { $in: followerIds },
                timestamp: { $gte: dateFilter }
            })
            .toArray();

        const postIdCounts = {};
        followerLikes.forEach(like => {
            postIdCounts[like.postId] = (postIdCounts[like.postId] || 0) + 1;
        });

        const popularPostIds = Object.entries(postIdCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit * 2)
            .map(([postId]) => postId);

        if (popularPostIds.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                posts: [],
                message: 'Your followers haven\'t liked any posts recently'
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const posts = await postsCollection
            .find({
                id: { $in: popularPostIds },
                userId: { $ne: creatorId }
            })
            .toArray();

        const postsWithMetrics = await Promise.all(posts.map(async (post) => {
            const [totalLikes, totalViews, totalReactions, creator] = await Promise.all([
                likesCollection.countDocuments({ postId: post.id }),
                viewsCollection.countDocuments({ postId: post.id }),
                reactionsCollection.countDocuments({ postId: post.id }),
                usersCollection.findOne(
                    { id: post.userId },
                    { projection: { id: 1, username: 1, avatar: 1, level: 1 } }
                )
            ]);

            let taggedGame = null;
            if (post.taggedGameId) {
                const game = await gamesCollection.findOne(
                    { id: post.taggedGameId },
                    { projection: { id: 1, title: 1, coverImage: 1 } }
                );
                taggedGame = game;
            }

            const followerLikeCount = postIdCounts[post.id] || 0;

            return {
                id: post.id,
                title: post.title,
                content: post.content,
                mediaType: post.mediaType,
                timestamp: post.timestamp,
                creator: {
                    id: creator?.id || post.userId,
                    username: creator?.username || 'Unknown',
                    avatar: creator?.avatar || null,
                    level: creator?.level || 0
                },
                metrics: {
                    totalLikes,
                    totalViews,
                    totalReactions,
                    followerLikes: followerLikeCount,
                    followerLikePercentage: followerIds.length > 0
                        ? ((followerLikeCount / followerIds.length) * 100).toFixed(1)
                        : 0
                },
                taggedGame
            };
        }));

        const sortedPosts = postsWithMetrics
            .sort((a, b) => b.metrics.followerLikes - a.metrics.followerLikes)
            .slice(0, limit);

        return new Response(JSON.stringify({
            success: true,
            posts: sortedPosts,
            totalFollowers: followerIds.length
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting popular content loved by followers:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get popular content'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function getCreatorsForPartner(partnerId) {
    try {
        const games = await gamesCollection.find({ ownerId: partnerId }).toArray();
        if (games.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You must be a game developer to access this'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const allCreators = await creatorsCollection.find({}).toArray();

        const existingLinks = await partnerCreatorLinksCollection
            .find({ partnerId })
            .toArray();

        const linkedCreatorIds = new Set(existingLinks.map(link => link.creatorId));

        const creatorsWithStatus = await Promise.all(allCreators.map(async (creator) => {
            const user = await usersCollection.findOne({ id: creator.userId });
            const link = existingLinks.find(l => l.creatorId === creator.userId);

            return {
                creatorId: creator.userId,
                username: creator.username,
                creatorCode: creator.username,
                tebexWalletId: creator.tebexWalletId || null,
                avatar: user?.avatar || null,
                isAddedToTebex: link?.addedToTebex || false,
                confirmedAt: link?.confirmedAt || null,
                revenueShare: 20, // Fixed at 20% for now
                customerDiscount: 5 // Fixed at 5% for now
            };
        }));

        return new Response(JSON.stringify({
            success: true,
            creators: creatorsWithStatus,
            totalCreators: allCreators.length,
            addedCount: existingLinks.filter(l => l.addedToTebex).length
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting creators for partner:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get creators list'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function confirmCreatorAdded(partnerId, creatorId) {
    try {
        const games = await gamesCollection.find({ ownerId: partnerId }).toArray();
        if (games.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const creator = await creatorsCollection.findOne({ userId: creatorId });
        if (!creator) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Creator not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        await partnerCreatorLinksCollection.updateOne(
            { partnerId, creatorId },
            {
                $set: {
                    partnerId,
                    creatorId,
                    creatorCode: creator.username,
                    addedToTebex: true,
                    confirmedAt: new Date(),
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Creator marked as added'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error confirming creator added:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to confirm creator'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function removeCreatorConfirmation(partnerId, creatorId) {
    try {
        const games = await gamesCollection.find({ ownerId: partnerId }).toArray();
        if (games.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Unauthorized'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        await partnerCreatorLinksCollection.updateOne(
            { partnerId, creatorId },
            {
                $set: {
                    addedToTebex: false,
                    confirmedAt: null,
                    updatedAt: new Date()
                }
            }
        );

        return new Response(JSON.stringify({
            success: true,
            message: 'Creator confirmation removed'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error removing creator confirmation:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to remove confirmation'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function checkPartnerCreatorCompliance(partnerId) {
    try {
        const allCreators = await creatorsCollection.countDocuments({});

        const confirmedLinks = await partnerCreatorLinksCollection.countDocuments({
            partnerId,
            addedToTebex: true
        });

        const isCompliant = confirmedLinks >= allCreators;

        return new Response(JSON.stringify({
            success: true,
            isCompliant,
            totalCreators: allCreators,
            confirmedCreators: confirmedLinks,
            missingCreators: Math.max(0, allCreators - confirmedLinks)
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error checking compliance:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to check compliance'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}