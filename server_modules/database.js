import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

const client = new MongoClient(databaseUrl);
await client.connect();
console.log("Connected");
const db = client.db("vapr");

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
const secretKeysCollection = db.collection("secretKeys");
const gamesCollection = db.collection("games");
const gameKeysCollection = db.collection("gameKeys");
const userGamesCollection = db.collection("userGames");
const gameVersionsCollection = db.collection("gameVersions");
const gameUpdatesCollection = db.collection("gameUpdates");
const creatorApplicationsCollection = db.collection("creatorApplications");
const creatorsCollection = db.collection("creators");
const gameCreatorClicksCollection = db.collection("gameCreatorClicks");

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
    secretKeysCollection,
    gamesCollection,
    gameKeysCollection,
    userGamesCollection,
    gameVersionsCollection,
    gameUpdatesCollection,
    creatorApplicationsCollection,
    creatorsCollection,
    gameCreatorClicksCollection
};