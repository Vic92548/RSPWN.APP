import { addXP, EXPERIENCE_TABLE } from "../rpg.js";
import { sendMessageToDiscordWebhook } from "../discord.js";
import { usersCollection, followsCollection, registrationReferralsCollection } from "../database.js";

export async function acceptInvitation(invitedUserId, ambassadorUserId) {
    try {
        if (invitedUserId === ambassadorUserId) {
            return { success: false, message: "You can't invite yourself!" };
        }

        const invitee = await usersCollection.findOne({ id: invitedUserId });

        if (!invitee) {
            return { success: false, message: "Invitee user not found" };
        }

        const existingInvitation = await registrationReferralsCollection.findOne({ invitedUserId });

        if (existingInvitation) {
            return { success: false, message: "Invitation already accepted by this user" };
        }

        const ambassador = await usersCollection.findOne({ id: ambassadorUserId });

        if (!ambassador) {
            return { success: false, message: "Ambassador user not found" };
        }

        const referral = await registrationReferralsCollection.insertOne({
            invitedUserId: invitedUserId,
            ambassadorUserId: ambassadorUserId,
            timestamp: new Date()
        });

        const totalInvitations = await registrationReferralsCollection.countDocuments({ ambassadorUserId: ambassadorUserId });

        await addXP(ambassadorUserId, EXPERIENCE_TABLE.INVITE);

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1238786271514595398/VTlL7WzN9mNYq-ebtpT0cINS54HLlGjVp9fZ5MvSHytRdI5QrJe7fbSXWfopz8tJ1drZ",
            `@${invitee.username} accepted invitation from ${ambassador.username} 🥳 Total invitations accepted: ${totalInvitations}`
        );

        const existingFollows = await followsCollection.find({ followerId: invitedUserId, creatorId: ambassadorUserId }).toArray();

        if (existingFollows.length > 0) {
            console.log("Already following this post.");
            return { success: true, message: "User already following" };
        }

        const follow = await followsCollection.insertOne({
            postId: "invitation",
            followerId: invitedUserId,
            creatorId: ambassadorUserId,
            timestamp: new Date()
        });

        const [follower, creator, followerCount] = await Promise.all([
            usersCollection.findOne({ id: invitedUserId }, { projection: { username: 1, level: 1 } }),
            usersCollection.findOne({ id: ambassadorUserId }, { projection: { username: 1, level: 1 } }),
            followsCollection.countDocuments({ creatorId: ambassadorUserId })
        ]);

        sendMessageToDiscordWebhook(
            "https://discord.com/api/webhooks/1237068985233833994/-Q63qOJO3H-6HwkZoHSwmTaaelnLiDXBxNj4fA_9oJlDMN_AKO4rhGKfQBM8uvKR46vu",
            ":incoming_envelope: **@" + follower.username + "**(lvl " + follower.level + ") is now following :arrow_right: **@" + creator.username + "**(lvl " + creator.level + "), followers: **" + followerCount + "**"
        );

        return { success: true, message: "Invitation accepted successfully", referral: referral, totalInvitations: totalInvitations };
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return { success: false, message: "Failed to accept invitation" };
    }
}
