import { MongoClient } from "mongodb";
import Database from 'better-sqlite3';
import EventEmitter from 'events';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

const client = new MongoClient(databaseUrl);
await client.connect();
console.log("Connected to MongoDB");
const db = client.db("vapr");

const sqliteDb = new Database(':memory:');
sqliteDb.pragma('foreign_keys = ON');
sqliteDb.pragma('journal_mode = WAL');

class CacheSystem extends EventEmitter {
    constructor() {
        super();
        this.changeStreams = new Map();
        this.collections = new Map();
    }

    async initCollection(name, mongoCollection) {
        sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS ${name} (
                                                   _id TEXT PRIMARY KEY,
                                                   _doc JSON NOT NULL,
                                                   _updated_at INTEGER DEFAULT (strftime('%s', 'now'))
                )
        `);

        const indexMap = {
            posts: ['userId', 'timestamp', 'id'],
            users: ['id', 'username', 'email'],
            views: ['postId', 'userId'],
            likes: ['postId', 'userId'],
            dislikes: ['postId', 'userId'],
            skips: ['postId', 'userId'],
            follows: ['followerId', 'creatorId'],
            reactions: ['postId', 'userId'],
            games: ['id', 'ownerId', 'slug'],
            gameKeys: ['gameId', 'key'],
            userGames: ['userId', 'gameId'],
            creators: ['userId', 'username'],
            partnerCreatorLinks: ['partnerId', 'creatorId']
        };

        if (indexMap[name]) {
            indexMap[name].forEach(field => {
                try {
                    sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_${name}_${field} ON ${name}(json_extract(_doc, '$.${field}'))`);
                } catch (e) {
                }
            });
        }

        console.log(`Syncing ${name}...`);
        const docs = await mongoCollection.find({}).toArray();
        const stmt = sqliteDb.prepare(`INSERT OR REPLACE INTO ${name} (_id, _doc) VALUES (?, ?)`);
        const insertMany = sqliteDb.transaction((documents) => {
            for (const doc of documents) {
                let docId;
                if (name === 'users' && doc.id) {
                    docId = doc.id;
                } else {
                    docId = doc._id?.toString() || doc.id?.toString() || JSON.stringify(doc._id);
                }
                stmt.run(docId, JSON.stringify(doc));
            }
        });
        insertMany(docs);
        console.log(`Synced ${docs.length} documents for ${name}`);

        const changeStream = mongoCollection.watch([], { fullDocument: 'updateLookup' });

        changeStream.on('change', (change) => {
            try {
                switch (change.operationType) {
                    case 'insert':
                        console.log(`[ChangeStream ${name}] Processing INSERT`);
                        let insertId;
                        if (name === 'users' && change.fullDocument.id) {
                            insertId = change.fullDocument.id;
                        } else {
                            insertId = change.fullDocument._id?.toString() || change.fullDocument.id?.toString();
                        }
                        sqliteDb.prepare(`INSERT OR REPLACE INTO ${name} (_id, _doc) VALUES (?, ?)`).run(
                            insertId,
                            JSON.stringify(change.fullDocument)
                        );
                        break;
                    case 'update':
                    case 'replace':
                        if (change.fullDocument) {
                            let updateId;

                            // For users collection, ALWAYS use the 'id' field
                            if (name === 'users' && change.fullDocument.id) {
                                updateId = change.fullDocument.id;
                            } else {
                                updateId = change.documentKey._id?.toString() || change.documentKey.id?.toString();
                            }

                            const result = sqliteDb.prepare(`UPDATE ${name} SET _doc = ?, _updated_at = ? WHERE _id = ?`).run(
                                JSON.stringify(change.fullDocument),
                                Date.now(),
                                updateId
                            );

                            if (result.changes === 0 && name === 'users') {
                                // For users, try inserting if update failed
                                console.log(`[ChangeStream ${name}] Update failed, attempting insert for user ${change.fullDocument.id}`);
                                sqliteDb.prepare(`INSERT OR REPLACE INTO ${name} (_id, _doc, _updated_at) VALUES (?, ?, ?)`).run(
                                    change.fullDocument.id,
                                    JSON.stringify(change.fullDocument),
                                    Date.now()
                                );
                            }
                        }
                        break;
                    case 'delete':
                        console.log(`[ChangeStream ${name}] Processing DELETE`);
                        const deleteId = change.documentKey._id?.toString() || change.documentKey.id?.toString();
                        sqliteDb.prepare(`DELETE FROM ${name} WHERE _id = ?`).run(deleteId);
                        break;
                }
            } catch (error) {
                console.error(`Error handling change for ${name}:`, error);
            }
        });

        changeStream.on('error', (error) => {
            console.error(`Change stream error for ${name}:`, error);
            setTimeout(() => {
                console.log(`Attempting to reconnect change stream for ${name}`);
                this.initCollection(name, mongoCollection);
            }, 5000);
        });

        this.changeStreams.set(name, changeStream);
        this.collections.set(name, mongoCollection);
    }

    buildWhereClause(filter) {
        if (!filter || Object.keys(filter).length === 0) {
            return { where: '', params: [] };
        }

        const conditions = [];
        const params = [];

        Object.entries(filter).forEach(([key, value]) => {
            if (key === '_id') {
                if (typeof value === 'object' && value.$in) {
                    const placeholders = value.$in.map(() => '?').join(',');
                    conditions.push(`_id IN (${placeholders})`);
                    params.push(...value.$in.map(v => v?.toString() || v));
                } else {
                    conditions.push('_id = ?');
                    params.push(value?.toString() || value);
                }
            } else if (key === 'id') {
                if (typeof value === 'object' && value.$in) {
                    const placeholders = value.$in.map(() => '?').join(',');
                    conditions.push(`json_extract(_doc, '$.id') IN (${placeholders})`);
                    params.push(...value.$in.map(v => v?.toString() || v));
                } else {
                    conditions.push(`json_extract(_doc, '$.id') = ?`);
                    params.push(value?.toString() || value);
                }
            } else if (key === '$or' && Array.isArray(value)) {
                const orConds = value.map(f => {
                    const sub = this.buildWhereClause(f);
                    params.push(...sub.params);
                    return sub.where.replace('WHERE ', '');
                });
                conditions.push(`(${orConds.join(' OR ')})`);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.entries(value).forEach(([op, val]) => {
                    const field = key === '_id' ? '_id' : `json_extract(_doc, '$.${key}')`;

                    let processedVal = val;
                    if (val instanceof Date) {
                        processedVal = val.toISOString();
                    } else if (typeof val === 'boolean') {
                        processedVal = val ? 1 : 0;
                    }

                    switch (op) {
                        case '$gte':
                            conditions.push(`${field} >= ?`);
                            params.push(processedVal);
                            break;
                        case '$gt':
                            conditions.push(`${field} > ?`);
                            params.push(processedVal);
                            break;
                        case '$lte':
                            conditions.push(`${field} <= ?`);
                            params.push(processedVal);
                            break;
                        case '$lt':
                            conditions.push(`${field} < ?`);
                            params.push(processedVal);
                            break;
                        case '$ne':
                            conditions.push(`${field} != ?`);
                            params.push(processedVal);
                            break;
                        case '$exists':
                            conditions.push(`${field} IS ${val ? 'NOT NULL' : 'NULL'}`);
                            break;
                        case '$in':
                            if (Array.isArray(val) && val.length > 0) {
                                const placeholders = val.map(() => '?').join(',');
                                conditions.push(`${field} IN (${placeholders})`);
                                params.push(...val.map(v => {
                                    if (v instanceof Date) return v.toISOString();
                                    if (typeof v === 'boolean') return v ? 1 : 0;
                                    return v?.toString() || v;
                                }));
                            }
                            break;
                        case '$nin':
                            if (Array.isArray(val) && val.length > 0) {
                                const placeholders = val.map(() => '?').join(',');
                                conditions.push(`${field} NOT IN (${placeholders})`);
                                params.push(...val.map(v => {
                                    if (v instanceof Date) return v.toISOString();
                                    if (typeof v === 'boolean') return v ? 1 : 0;
                                    return v?.toString() || v;
                                }));
                            }
                            break;
                    }
                });
            } else {
                conditions.push(`json_extract(_doc, '$.${key}') = ?`);
                if (value instanceof Date) {
                    params.push(value.toISOString());
                } else if (typeof value === 'boolean') {
                    params.push(value ? 1 : 0);
                } else {
                    params.push(value);
                }
            }
        });

        return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
    }
}

const cache = new CacheSystem();

class CachedCollection {
    constructor(name, mongoCollection) {
        this.name = name;
        this.mongoCollection = mongoCollection;
        this.replicationPromises = new Map();
    }

    async init() {
        await cache.initCollection(this.name, this.mongoCollection);
    }

    async waitForReplication(documentId, timeout = 5000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const cached = await this.findOne({ id: documentId });
            if (cached) {
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.warn(`Replication timeout for ${this.name} document ${documentId}`);
        return false;
    }

    async syncDocument(filter) {
        try {
            const doc = await this.mongoCollection.findOne(filter);
            if (doc) {
                let docId;
                if (this.name === 'users' && doc.id) {
                    docId = doc.id;
                } else {
                    docId = doc._id?.toString() || doc.id?.toString() || JSON.stringify(doc._id);
                }

                const stmt = sqliteDb.prepare(`INSERT OR REPLACE INTO ${this.name} (_id, _doc) VALUES (?, ?)`);
                stmt.run(docId, JSON.stringify(doc));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error syncing document in ${this.name}:`, error);
            return false;
        }
    }

    async findOne(filter = {}, options = {}) {
        const { where, params } = cache.buildWhereClause(filter);
        const row = sqliteDb.prepare(`SELECT _doc FROM ${this.name} ${where} LIMIT 1`).get(...params);
        if (!row) return null;

        const doc = JSON.parse(row._doc);
        if (options.projection) {
            const projected = {};
            const isInclusion = Object.values(options.projection).some(v => v === 1);

            if (isInclusion) {
                Object.entries(options.projection).forEach(([k, v]) => {
                    if (v === 1 && doc[k] !== undefined) projected[k] = doc[k];
                });
                if (options.projection._id !== 0) {
                    projected._id = doc._id;
                }
                if (options.projection.id !== 0 && doc.id !== undefined) {
                    projected.id = doc.id;
                }
            } else {
                Object.assign(projected, doc);
                Object.entries(options.projection).forEach(([k, v]) => {
                    if (v === 0) delete projected[k];
                });
            }
            return projected;
        }
        return doc;
    }

    find(filter = {}, options = {}) {
        const self = this;
        const state = { filter, options };

        return {
            async toArray() {
                const { where, params } = cache.buildWhereClause(state.filter);
                const orderBy = state.options.sort ?
                    `ORDER BY ${Object.entries(state.options.sort).map(([k, v]) => {
                        if (k === '_id') return `_id ${v === 1 ? 'ASC' : 'DESC'}`;
                        return `json_extract(_doc, '$.${k}') ${v === 1 ? 'ASC' : 'DESC'}`;
                    }).join(', ')}` : '';
                const limit = state.options.limit ? `LIMIT ${state.options.limit}` : '';
                const offset = state.options.skip ? `OFFSET ${state.options.skip}` : '';

                const rows = sqliteDb.prepare(
                    `SELECT _doc FROM ${self.name} ${where} ${orderBy} ${limit} ${offset}`
                ).all(...params);

                return rows.map(row => {
                    const doc = JSON.parse(row._doc);
                    if (state.options.projection) {
                        const projected = {};
                        const isInclusion = Object.values(state.options.projection).some(v => v === 1);

                        if (isInclusion) {
                            Object.entries(state.options.projection).forEach(([k, v]) => {
                                if (v === 1 && doc[k] !== undefined) projected[k] = doc[k];
                            });
                            if (state.options.projection._id !== 0) projected._id = doc._id;
                            if (state.options.projection.id !== 0 && doc.id !== undefined) projected.id = doc.id;
                        } else {
                            Object.assign(projected, doc);
                            Object.entries(state.options.projection).forEach(([k, v]) => {
                                if (v === 0) delete projected[k];
                            });
                        }
                        return projected;
                    }
                    return doc;
                });
            },
            sort(spec) { state.options.sort = spec; return this; },
            limit(n) { state.options.limit = n; return this; },
            skip(n) { state.options.skip = n; return this; },
            project(proj) { state.options.projection = proj; return this; }
        };
    }

    async countDocuments(filter = {}) {
        const { where, params } = cache.buildWhereClause(filter);
        const result = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${this.name} ${where}`).get(...params);
        return result.count;
    }

    aggregate(pipeline) {
        const self = this;
        return {
            async toArray() {
                return self.mongoCollection.aggregate(pipeline).toArray();
            }
        };
    }

    async insertOne(doc, options = {}) {
        const result = await this.mongoCollection.insertOne(doc);

        if (options.waitForReplication) {
            const docId = doc.id || doc._id?.toString() || result.insertedId?.toString();
            await this.waitForReplication(docId, options.replicationTimeout || 5000);
        }

        if (options.waitForReplication && options.returnDocument) {
            const insertedDoc = await this.findOne({ id: doc.id || result.insertedId?.toString() });
            return { ...result, document: insertedDoc };
        }

        return result;
    }

    async insertMany(docs, options = {}) {
        const result = await this.mongoCollection.insertMany(docs);

        if (options.waitForReplication) {
            const waitPromises = docs.map((doc, index) => {
                const docId = doc.id || doc._id?.toString() || result.insertedIds[index]?.toString();
                return this.waitForReplication(docId, options.replicationTimeout || 5000);
            });
            await Promise.all(waitPromises);
        }

        return result;
    }

    async updateOne(filter, update, options = {}) {
        const result = await this.mongoCollection.updateOne(filter, update, options);

        if (options.waitForReplication && result.modifiedCount > 0) {
            const docId = filter.id || filter._id?.toString();
            if (docId) {
                await this.waitForReplication(docId, options.replicationTimeout || 5000);
            }
        }

        return result;
    }

    async updateMany(filter, update, options = {}) {
        const result = await this.mongoCollection.updateMany(filter, update, options);

        if (options.waitForReplication && result.modifiedCount > 0) {
            console.warn('waitForReplication with updateMany may not wait for all documents');
        }

        return result;
    }

    async deleteOne(filter, options = {}) {
        return this.mongoCollection.deleteOne(filter);
    }

    async deleteMany(filter, options = {}) {
        return this.mongoCollection.deleteMany(filter);
    }
}

const collectionNames = [
    'posts', 'users', 'views', 'likes', 'videos', 'dislikes', 'skips',
    'follows', 'reactions', 'linkClicks', 'registrationReferrals', 'xpLog',
    'secretKeys', 'games', 'gameKeys', 'userGames', 'gameVersions',
    'gameUpdates', 'creatorApplications', 'creators', 'gameCreatorClicks',
    'playtimeSessions', 'tebexConfigs', 'partnerCreatorLinks', 'buckets', 'bucketItems', 'gameReviews'
];

const collections = {};
for (const name of collectionNames) {
    const cached = new CachedCollection(name, db.collection(name));
    await cached.init();
    collections[name] = cached;
}

const postsCollection = collections.posts;
const usersCollection = collections.users;
const viewsCollection = collections.views;
const likesCollection = collections.likes;
const videosCollection = collections.videos;
const dislikesCollection = collections.dislikes;
const skipsCollection = collections.skips;
const followsCollection = collections.follows;
const reactionsCollection = collections.reactions;
const linkClicksCollection = collections.linkClicks;
const registrationReferralsCollection = collections.registrationReferrals;
const xpLogCollection = collections.xpLog;
const secretKeysCollection = collections.secretKeys;
const gamesCollection = collections.games;
const gameKeysCollection = collections.gameKeys;
const userGamesCollection = collections.userGames;
const gameVersionsCollection = collections.gameVersions;
const gameUpdatesCollection = collections.gameUpdates;
const creatorApplicationsCollection = collections.creatorApplications;
const creatorsCollection = collections.creators;
const gameCreatorClicksCollection = collections.gameCreatorClicks;
const playtimeSessionsCollection = collections.playtimeSessions;
const tebexConfigsCollection = collections.tebexConfigs;
const partnerCreatorLinksCollection = collections.partnerCreatorLinks;
const bucketsCollection = collections.buckets;
const bucketItemsCollection = collections.bucketItems;
const gameReviewsCollection = collections.gameReviews;

process.on('SIGINT', async () => {
    console.log('Closing database connections...');
    for (const stream of cache.changeStreams.values()) {
        await stream.close();
    }
    sqliteDb.close();
    await client.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Closing database connections...');
    for (const stream of cache.changeStreams.values()) {
        await stream.close();
    }
    sqliteDb.close();
    await client.close();
    process.exit(0);
});

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
    gameCreatorClicksCollection,
    playtimeSessionsCollection,
    tebexConfigsCollection,
    partnerCreatorLinksCollection,
    bucketsCollection,
    bucketItemsCollection,
    gameReviewsCollection
};