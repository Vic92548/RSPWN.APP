import { Resend } from "resend";
import { followsCollection, usersCollection } from "../database.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function notifyFollowersByEmail(creatorId, postId, postTitle) {
    try {
        const [creator, follows] = await Promise.all([
            usersCollection.findOne({ id: creatorId }, { projection: { username: 1, email: 1 } }),
            followsCollection.find({ creatorId }, { projection: { followerId: 1 } }).toArray()
        ]);

        if (!creator) {
            console.warn("Creator not found for email notifications.");
            return;
        }

        const followerIds = follows.map(f => f.followerId);

        const followers = await usersCollection.find(
            { id: { $in: followerIds }, email: { $exists: true, $ne: null } },
            { projection: { email: 1 } }
        ).toArray();

        if (followers.length === 0) {
            console.log("No followers with emails to notify.");
            return;
        }

        const baseUrl = process.env.BASE_URL || "https://vapr.club";
        const postUrl = `${baseUrl}/post/${postId}`;

        const emailPayload = followers.map(follower => ({
            from: `VAPR <notifications@vapr.club>`,
            to: [follower.email],
            subject: `@${creator.username} just posted: ${postTitle}`,
            html: `
               <h2>🚨 New post alert!</h2>
               <p><strong>@${creator.username}</strong> just shared a new post:</p>
               <p><a href="${postUrl}">${postTitle}</a></p>
               <p>Click to read and show some love ❤️</p>
               <small>You're receiving this email because you follow @${creator.username} on VAPR.<br>
               <a href="${baseUrl}/settings">Unfollow or manage notifications</a></small>
           `
        }));

        const response = await resend.batch.send(emailPayload);
        console.log("Emails sent:", response);
    } catch (err) {
        console.error("Failed to send follower email notifications:", err);
    }
}