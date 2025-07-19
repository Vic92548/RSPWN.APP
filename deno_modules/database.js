import { MongoClient } from "npm:mongodb@6";

const databaseUrl = Deno.env.get("DATABASE_URL");

const client = new MongoClient(databaseUrl);
await client.connect();
console.log("Connected");
const db = client.db("vapr");

// Existing collections
const postsCollection = db.collection("posts");
const usersCollection = db.collection("users");
const viewsCollection = db.collection("views");
const likesCollection = db.collection("likes");
const videosCollection = db.collection("videos");
const dislikesCollection = db.collection("dislikes");
const skipsCollection = db.collection("skips");
const followsCollection = db.collection("follows");
const reactionsCollection = db.collection("reactions");
const linkClicksCollection = db.collection("linkClicks");
const registrationReferralsCollection = db.collection("registrationReferrals");
const xpLogCollection = db.collection("xpLog");

// New collections for feeds system
const feedsCollection = db.collection("feeds");
const feedMembersCollection = db.collection("feedMembers");
const postFeedsCollection = db.collection("postFeeds");

export {
    postsCollection,
    usersCollection,
    viewsCollection,
    likesCollection,
    dislikesCollection,
    followsCollection,
    reactionsCollection,
    registrationReferralsCollection,
    linkClicksCollection,
    skipsCollection,
    videosCollection,
    xpLogCollection,
    // New exports for feeds
    feedsCollection,
    feedMembersCollection,
    postFeedsCollection
};

// Feed Schema Documentation
/*
feeds: {
    id: string (UUID),
    name: string,
    description: string,
    creatorId: string (user ID),
    isPrivate: boolean,
    coverImage: string (optional),
    icon: string (emoji or image URL),
    rules: string (optional),
    tags: string[],
    memberCount: number,
    postCount: number,
    createdAt: Date,
    updatedAt: Date
}

feedMembers: {
    feedId: string,
    userId: string,
    role: string ('owner', 'moderator', 'member'),
    joinedAt: Date,
    canPost: boolean (default true),
    notifications: boolean (default true)
}

postFeeds: {
    postId: string,
    feedId: string,
    addedAt: Date,
    addedBy: string (userId)
}
*/