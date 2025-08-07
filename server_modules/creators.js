import {
    creatorApplicationsCollection,
    creatorsCollection,
    gameCreatorClicksCollection,
    usersCollection,
    postsCollection
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