import { MongoClient } from "https://deno.land/x/mongo@v0.28.0/mod.ts";

const databaseUrl = Deno.env.get("DATABASE_URL");

const client = new MongoClient();
await client.connect(databaseUrl);
const db = client.database("vapr");

const postsCollection = db.collection("posts");
const usersCollection = db.collection("users");
const viewsCollection = db.collection("views");
const likesCollection = db.collection("likes");
const dislikesCollection = db.collection("dislikes");
const followsCollection = db.collection("follows");
const reactionsCollection = db.collection("reactions");
const registrationReferralsCollection = db.collection("registrationReferrals");

export {
    postsCollection,
    usersCollection,
    viewsCollection,
    likesCollection,
    dislikesCollection,
    followsCollection,
    reactionsCollection,
    registrationReferralsCollection
};
