import { MongoClient } from "mongodb";
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const COLLECTION_INDEXES = JSON.parse(readFileSync('./mongodb-indexes.json', 'utf8'));

class IndexOptimizer {
    constructor() {
        this.client = null;
        this.db = null;
        this.report = {
            analyzed: [],
            created: [],
            dropped: [],
            errors: [],
            suggestions: []
        };
    }

    async connect() {
        console.log("🔗 Connecting to MongoDB...");
        this.client = new MongoClient(databaseUrl);
        await this.client.connect();
        this.db = this.client.db("vapr");
        console.log("✅ Connected successfully\n");
    }

    async analyzeCollection(collectionName) {
        console.log(`\n📊 Analyzing collection: ${collectionName}`);
        console.log("─".repeat(50));

        try {
            const collection = this.db.collection(collectionName);

            const stats = await collection.estimatedDocumentCount();
            console.log(`📈 Document count: ${stats.toLocaleString()}`);

            const existingIndexes = await collection.indexes();
            console.log(`📑 Existing indexes: ${existingIndexes.length}`);

            const indexStats = await this.getIndexStats(collectionName);

            const recommendedIndexes = COLLECTION_INDEXES[collectionName] || [];
            const missingIndexes = this.findMissingIndexes(existingIndexes, recommendedIndexes);

            const unusedIndexes = this.findUnusedIndexes(existingIndexes, indexStats);

            this.report.analyzed.push({
                collection: collectionName,
                documentCount: stats,
                existingIndexCount: existingIndexes.length,
                missingIndexCount: missingIndexes.length,
                unusedIndexCount: unusedIndexes.length
            });

            return {
                collection: collectionName,
                existingIndexes,
                missingIndexes,
                unusedIndexes,
                stats
            };

        } catch (error) {
            console.error(`❌ Error analyzing ${collectionName}:`, error.message);
            this.report.errors.push({
                collection: collectionName,
                error: error.message
            });
            return null;
        }
    }

    async getIndexStats(collectionName) {
        try {
            const stats = await this.db.collection(collectionName)
                .aggregate([{ $indexStats: {} }])
                .toArray();
            return stats;
        } catch (error) {
            return [];
        }
    }

    findMissingIndexes(existingIndexes, recommendedIndexes) {
        const missing = [];

        for (const recommended of recommendedIndexes) {
            const exists = existingIndexes.some(existing => {
                const existingKey = existing.key;
                const recommendedKey = recommended.fields;

                return JSON.stringify(existingKey) === JSON.stringify(recommendedKey);
            });

            if (!exists) {
                missing.push(recommended);
            }
        }

        return missing;
    }

    findUnusedIndexes(existingIndexes, indexStats) {
        const unused = [];

        const userIndexes = existingIndexes.filter(idx => idx.name !== '_id_');

        for (const index of userIndexes) {
            const stats = indexStats.find(stat => stat.name === index.name);

            if (!stats || (stats.accesses && stats.accesses.ops < 10)) {
                unused.push({
                    name: index.name,
                    key: index.key,
                    usage: stats ? stats.accesses.ops : 0
                });
            }
        }

        return unused;
    }

    async optimizeCollection(collectionName, analysis) {
        if (!analysis) return;

        console.log(`\n🔧 Optimizing ${collectionName}...`);
        const collection = this.db.collection(collectionName);

        for (const index of analysis.missingIndexes) {
            try {
                console.log(`  ➕ Creating index: ${JSON.stringify(index.fields)}`);
                await collection.createIndex(index.fields, index.options);
                this.report.created.push({
                    collection: collectionName,
                    index: index.fields
                });
            } catch (error) {
                console.error(`  ❌ Failed to create index: ${error.message}`);
                this.report.errors.push({
                    collection: collectionName,
                    operation: 'create',
                    index: index.fields,
                    error: error.message
                });
            }
        }

        if (analysis.unusedIndexes.length > 0) {
            console.log(`  ⚠️  Found ${analysis.unusedIndexes.length} potentially unused indexes`);
            for (const unused of analysis.unusedIndexes) {
                this.report.suggestions.push({
                    collection: collectionName,
                    action: 'consider_dropping',
                    index: unused.name,
                    reason: `Low usage (${unused.usage} ops)`
                });
            }
        }
    }

    async analyzeQueryPerformance() {
        console.log("\n🔍 Analyzing slow queries...");
        console.log("─".repeat(50));

        try {
            const profile = this.db.collection('system.profile');
            const slowQueries = await profile.find({
                millis: { $gt: 100 }
            })
                .sort({ millis: -1 })
                .limit(10)
                .toArray();

            if (slowQueries.length > 0) {
                console.log(`Found ${slowQueries.length} slow queries`);
                slowQueries.forEach((query, i) => {
                    console.log(`  ${i + 1}. ${query.ns} - ${query.millis}ms`);
                    if (query.command) {
                        console.log(`     Command: ${JSON.stringify(query.command).substring(0, 100)}...`);
                    }
                });
            } else {
                console.log("No slow queries found (profiler might be disabled)");
            }
        } catch (error) {
            console.log("Could not analyze query performance (profiler might be disabled)");
        }
    }

    generateReport() {
        console.log("\n📋 OPTIMIZATION REPORT");
        console.log("═".repeat(50));

        console.log("\n✅ Summary:");
        console.log(`  • Collections analyzed: ${this.report.analyzed.length}`);
        console.log(`  • Indexes created: ${this.report.created.length}`);
        console.log(`  • Errors encountered: ${this.report.errors.length}`);
        console.log(`  • Optimization suggestions: ${this.report.suggestions.length}`);

        if (this.report.created.length > 0) {
            console.log("\n✅ Created Indexes:");
            this.report.created.forEach(item => {
                console.log(`  • ${item.collection}: ${JSON.stringify(item.index)}`);
            });
        }

        if (this.report.suggestions.length > 0) {
            console.log("\n💡 Suggestions:");
            this.report.suggestions.forEach(item => {
                console.log(`  • ${item.collection}: ${item.action} index '${item.index}' (${item.reason})`);
            });
        }

        if (this.report.errors.length > 0) {
            console.log("\n❌ Errors:");
            this.report.errors.forEach(item => {
                console.log(`  • ${item.collection}: ${item.error}`);
            });
        }

        const performanceRecommendations = [
            "Monitor index usage regularly using this script",
            "Consider enabling MongoDB profiler for slow query analysis",
            "Review and drop unused indexes to save storage and improve write performance",
            "Ensure queries use indexes by checking explain() output",
            "Consider compound indexes for queries with multiple conditions"
        ];

        console.log("\n🚀 Performance Recommendations:");
        performanceRecommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
        });
    }

    async run() {
        try {
            await this.connect();

            const collections = Object.keys(COLLECTION_INDEXES);

            console.log(`🔍 Found ${collections.length} collections to optimize`);

            const analyses = [];
            for (const collectionName of collections) {
                const analysis = await this.analyzeCollection(collectionName);
                if (analysis) {
                    analyses.push(analysis);
                }
            }

            console.log("\n⚠️  Ready to optimize indexes");
            console.log("This will create missing indexes but won't drop any existing ones");
            console.log("Press Ctrl+C to abort, or wait 5 seconds to continue...");

            await new Promise(resolve => setTimeout(resolve, 5000));

            for (const analysis of analyses) {
                await this.optimizeCollection(analysis.collection, analysis);
            }

            await this.analyzeQueryPerformance();

            this.generateReport();

        } catch (error) {
            console.error("\n❌ Fatal error:", error);
        } finally {
            if (this.client) {
                await this.client.close();
                console.log("\n🔌 Disconnected from MongoDB");
            }
        }
    }
}

const optimizer = new IndexOptimizer();
optimizer.run().catch(console.error);