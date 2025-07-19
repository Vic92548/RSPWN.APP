// deno_modules/routes/analytics.js - New analytics endpoint

import {
    postsCollection,
    viewsCollection,
    likesCollection,
    dislikesCollection,
    followsCollection,
    linkClicksCollection,
    reactionsCollection,
    usersCollection
} from "../database.js";

export async function analyticsHandler(request, authResult) {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('range') || '7'; // 7, 30, or 'all'
    const userId = authResult.userData.id;

    try {
        // Calculate date range
        let dateFilter = {};
        if (timeRange !== 'all') {
            const days = parseInt(timeRange);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            dateFilter = { timestamp: { $gte: startDate } };
        }

        // Get all user's posts
        const userPosts = await postsCollection.find({ userId }).toArray();
        const postIds = userPosts.map(p => p.id);

        // Aggregate metrics for each post
        const postsWithMetrics = await Promise.all(userPosts.map(async (post) => {
            // Get counts with date filtering
            const [views, likes, dislikes, follows, clicks, reactions] = await Promise.all([
                viewsCollection.countDocuments({
                    postId: post.id,
                    ...dateFilter
                }),
                likesCollection.countDocuments({
                    postId: post.id,
                    ...dateFilter
                }),
                dislikesCollection.countDocuments({
                    postId: post.id,
                    ...dateFilter
                }),
                followsCollection.countDocuments({
                    postId: post.id,
                    ...dateFilter
                }),
                linkClicksCollection.countDocuments({
                    postId: post.id,
                    ...dateFilter
                }),
                reactionsCollection.find({
                    postId: post.id,
                    ...dateFilter
                }).toArray()
            ]);

            // Group reactions by emoji
            const reactionCounts = {};
            reactions.forEach(r => {
                reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            });

            return {
                ...post,
                metrics: {
                    views,
                    likes,
                    dislikes,
                    follows,
                    clicks,
                    reactions: reactionCounts,
                    engagement: views > 0 ? ((likes + dislikes + follows) / views * 100).toFixed(2) : 0,
                    ctr: views > 0 ? (clicks / views * 100).toFixed(2) : 0
                }
            };
        }));

        // Calculate totals
        const totals = postsWithMetrics.reduce((acc, post) => {
            acc.views += post.metrics.views;
            acc.likes += post.metrics.likes;
            acc.dislikes += post.metrics.dislikes;
            acc.follows += post.metrics.follows;
            acc.clicks += post.metrics.clicks;

            // Aggregate reactions
            Object.entries(post.metrics.reactions).forEach(([emoji, count]) => {
                acc.reactions[emoji] = (acc.reactions[emoji] || 0) + count;
            });

            return acc;
        }, { views: 0, likes: 0, dislikes: 0, follows: 0, clicks: 0, reactions: {} });

        // Get time series data for charts
        const timeSeriesData = await getTimeSeriesData(postIds, timeRange);

        // Get follower growth
        const followerGrowth = await getFollowerGrowth(userId, timeRange);

        // Calculate period comparison (current vs previous period)
        const comparison = await calculatePeriodComparison(postIds, timeRange);

        // Get total followers (all time)
        const totalFollowers = await followsCollection.countDocuments({ creatorId: userId });

        return new Response(JSON.stringify({
            success: true,
            timeRange,
            posts: postsWithMetrics,
            totals: {
                ...totals,
                followers: totalFollowers
            },
            charts: {
                timeSeries: timeSeriesData,
                followerGrowth
            },
            comparison,
            generatedAt: new Date().toISOString()
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Analytics error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Failed to fetch analytics data"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get time series data for charts
async function getTimeSeriesData(postIds, timeRange) {
    const days = timeRange === 'all' ? 365 : parseInt(timeRange);
    const data = [];

    // Limit to reasonable number of data points
    const interval = days > 90 ? Math.ceil(days / 30) : 1; // Group by month if > 90 days

    for (let i = days - 1; i >= 0; i -= interval) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + interval);

        const [views, likes, clicks] = await Promise.all([
            viewsCollection.countDocuments({
                postId: { $in: postIds },
                timestamp: { $gte: date, $lt: nextDate }
            }),
            likesCollection.countDocuments({
                postId: { $in: postIds },
                timestamp: { $gte: date, $lt: nextDate }
            }),
            linkClicksCollection.countDocuments({
                postId: { $in: postIds },
                timestamp: { $gte: date, $lt: nextDate }
            })
        ]);

        data.push({
            date: date.toISOString(),
            views,
            likes,
            clicks
        });
    }

    return data;
}

// Get follower growth data
async function getFollowerGrowth(userId, timeRange) {
    const days = timeRange === 'all' ? 365 : parseInt(timeRange);
    const data = [];

    // Get all follows for this creator
    const allFollows = await followsCollection.find({
        creatorId: userId
    }).sort({ timestamp: 1 }).toArray();

    if (allFollows.length === 0) {
        return data;
    }

    // Create cumulative follower count over time
    const interval = days > 90 ? Math.ceil(days / 30) : 1;

    for (let i = days - 1; i >= 0; i -= interval) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(23, 59, 59, 999);

        const followers = allFollows.filter(f => new Date(f.timestamp) <= date).length;

        data.push({
            date: date.toISOString(),
            followers
        });
    }

    return data;
}

// Calculate comparison with previous period
async function calculatePeriodComparison(postIds, timeRange) {
    if (timeRange === 'all') return null;

    const days = parseInt(timeRange);
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - days);

    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - (days * 2));

    const [currentViews, previousViews, currentLikes, previousLikes, currentFollows, previousFollows] = await Promise.all([
        viewsCollection.countDocuments({
            postId: { $in: postIds },
            timestamp: { $gte: currentStart }
        }),
        viewsCollection.countDocuments({
            postId: { $in: postIds },
            timestamp: { $gte: previousStart, $lt: currentStart }
        }),
        likesCollection.countDocuments({
            postId: { $in: postIds },
            timestamp: { $gte: currentStart }
        }),
        likesCollection.countDocuments({
            postId: { $in: postIds },
            timestamp: { $gte: previousStart, $lt: currentStart }
        }),
        followsCollection.countDocuments({
            postId: { $in: postIds },
            timestamp: { $gte: currentStart }
        }),
        followsCollection.countDocuments({
            postId: { $in: postIds },
            timestamp: { $gte: previousStart, $lt: currentStart }
        })
    ]);

    return {
        views: {
            current: currentViews,
            previous: previousViews,
            change: previousViews > 0 ? ((currentViews - previousViews) / previousViews * 100).toFixed(1) : 100
        },
        likes: {
            current: currentLikes,
            previous: previousLikes,
            change: previousLikes > 0 ? ((currentLikes - previousLikes) / previousLikes * 100).toFixed(1) : 100
        },
        follows: {
            current: currentFollows,
            previous: previousFollows,
            change: previousFollows > 0 ? ((currentFollows - previousFollows) / previousFollows * 100).toFixed(1) : 100
        }
    };
}