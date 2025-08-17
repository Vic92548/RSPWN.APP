import { gameReviewsCollection, gamesCollection, userGamesCollection, usersCollection } from './database.js';

// Create a review
export async function createGameReview(userId, gameId, rating, content) {
    try {
        // Check if user owns the game
        const ownership = await userGamesCollection.findOne({ userId, gameId });
        if (!ownership) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You must own this game to review it'
            }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check if game exists
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

        // Check if user already reviewed this game
        const existingReview = await gameReviewsCollection.findOne({ userId, gameId });
        if (existingReview) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You have already reviewed this game'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Rating must be between 1 and 5'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Create review
        const review = {
            id: crypto.randomUUID(),
            userId,
            gameId,
            rating,
            content: content.trim(),
            helpful: 0,
            helpfulVotes: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await gameReviewsCollection.insertOne(review);

        // Get user info for response
        const user = await usersCollection.findOne({ id: userId });

        return new Response(JSON.stringify({
            success: true,
            review: {
                ...review,
                username: user?.username || 'Unknown',
                avatar: user?.avatar || null,
                level: user?.level || 0
            }
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error creating review:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create review'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get reviews for a game
export async function getGameReviews(gameId, userId = null) {
    try {
        const reviews = await gameReviewsCollection
            .find({ gameId })
            .sort({ createdAt: -1 })
            .toArray();

        // Get user info for all reviews
        const userIds = [...new Set(reviews.map(r => r.userId))];
        const users = await usersCollection
            .find({ id: { $in: userIds } })
            .toArray();

        const userMap = new Map(users.map(u => [u.id, u]));

        const enrichedReviews = reviews.map(review => {
            const user = userMap.get(review.userId);
            const hasVoted = userId ? review.helpfulVotes?.includes(userId) : false;

            return {
                ...review,
                username: user?.username || 'Unknown',
                avatar: user?.avatar || null,
                level: user?.level || 0,
                hasVoted
            };
        });

        return new Response(JSON.stringify({
            success: true,
            reviews: enrichedReviews
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch reviews'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Mark review as helpful
export async function markReviewHelpful(reviewId, userId) {
    try {
        const review = await gameReviewsCollection.findOne({ id: reviewId });
        if (!review) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Review not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Check if user already voted
        if (review.helpfulVotes?.includes(userId)) {
            // Remove vote
            await gameReviewsCollection.updateOne(
                { id: reviewId },
                {
                    $pull: { helpfulVotes: userId },
                    $inc: { helpful: -1 }
                }
            );
        } else {
            // Add vote
            await gameReviewsCollection.updateOne(
                { id: reviewId },
                {
                    $push: { helpfulVotes: userId },
                    $inc: { helpful: 1 }
                }
            );
        }

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error marking review helpful:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to update review'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Update review
export async function updateGameReview(reviewId, userId, updates) {
    try {
        const review = await gameReviewsCollection.findOne({ id: reviewId, userId });
        if (!review) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Review not found or unauthorized'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const updateData = {
            updatedAt: new Date()
        };

        if (updates.rating !== undefined) {
            if (updates.rating < 1 || updates.rating > 5) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Rating must be between 1 and 5'
                }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }
            updateData.rating = updates.rating;
        }

        if (updates.content !== undefined) {
            updateData.content = updates.content.trim();
        }

        await gameReviewsCollection.updateOne(
            { id: reviewId },
            { $set: updateData }
        );

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error updating review:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to update review'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Delete review
export async function deleteGameReview(reviewId, userId) {
    try {
        const result = await gameReviewsCollection.deleteOne({ id: reviewId, userId });

        if (result.deletedCount === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Review not found or unauthorized'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error deleting review:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to delete review'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// Get review stats for a game
export async function getGameReviewStats(gameId) {
    try {
        const stats = await gameReviewsCollection.aggregate([
            { $match: { gameId } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]).toArray();

        if (stats.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                stats: {
                    totalReviews: 0,
                    averageRating: 0,
                    ratingDistribution: {
                        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
                    }
                }
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Calculate rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats[0].ratingDistribution.forEach(rating => {
            distribution[rating]++;
        });

        return new Response(JSON.stringify({
            success: true,
            stats: {
                totalReviews: stats[0].totalReviews,
                averageRating: Math.round(stats[0].averageRating * 10) / 10,
                ratingDistribution: distribution
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error getting review stats:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get review stats'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}