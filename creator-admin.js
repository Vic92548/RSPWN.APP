import { MongoClient } from 'mongodb';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class CreatorAdmin {
    constructor() {
        this.client = null;
        this.db = null;
        this.applications = null;
        this.creators = null;
        this.users = null;
    }

    async connect() {
        try {
            this.client = new MongoClient(process.env.DATABASE_URL);
            await this.client.connect();
            this.db = this.client.db('vapr');
            this.applications = this.db.collection('creatorApplications');
            this.creators = this.db.collection('creators');
            this.users = this.db.collection('users');
            console.log('✅ Connected to database\n');
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            process.exit(1);
        }
    }

    async showPendingApplications() {
        const pending = await this.applications.find({ status: 'pending' }).toArray();

        if (pending.length === 0) {
            console.log('\n📭 No pending applications\n');
            return [];
        }

        console.log(`\n📋 Found ${pending.length} pending application(s):\n`);

        for (let i = 0; i < pending.length; i++) {
            const app = pending[i];
            const user = await this.users.findOne({ id: app.userId });

            console.log(`[${i + 1}] Application from @${app.username}`);
            console.log(`    User ID: ${app.userId}`);
            console.log(`    Level: ${app.userLevel || user?.level || 0}`);
            console.log(`    Posts: ${app.postCount || 0}`);
            console.log(`    Tebex Wallet: ${app.tebexWalletId}`);
            console.log(`    Applied: ${new Date(app.createdAt).toLocaleDateString()}`);
            console.log('    ---');
        }

        return pending;
    }

    async approveApplication(app, adminId = 'admin') {
        try {
            // Update application status
            await this.applications.updateOne(
                { id: app.id },
                {
                    $set: {
                        status: 'approved',
                        approvedBy: adminId,
                        approvedAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            );

            // Create creator record
            await this.creators.insertOne({
                userId: app.userId,
                username: app.username,
                tebexWalletId: app.tebexWalletId,
                createdAt: new Date(),
                stats: {
                    totalClicks: 0,
                    totalSales: 0,
                    totalRevenue: 0
                }
            });

            console.log(`\n✅ Approved @${app.username} as a creator!`);
            console.log(`   Creator code: ${app.username}`);

        } catch (error) {
            console.error(`\n❌ Error approving application:`, error.message);
        }
    }

    async rejectApplication(app, reason, adminId = 'admin') {
        try {
            await this.applications.updateOne(
                { id: app.id },
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

            console.log(`\n❌ Rejected @${app.username}'s application`);

        } catch (error) {
            console.error(`\n❌ Error rejecting application:`, error.message);
        }
    }

    async showStats() {
        const totalCreators = await this.creators.countDocuments();
        const totalApplications = await this.applications.countDocuments();
        const pendingCount = await this.applications.countDocuments({ status: 'pending' });
        const approvedCount = await this.applications.countDocuments({ status: 'approved' });
        const rejectedCount = await this.applications.countDocuments({ status: 'rejected' });

        console.log('\n📊 Creator Program Statistics:');
        console.log(`   Total Creators: ${totalCreators}`);
        console.log(`   Total Applications: ${totalApplications}`);
        console.log(`   - Pending: ${pendingCount}`);
        console.log(`   - Approved: ${approvedCount}`);
        console.log(`   - Rejected: ${rejectedCount}`);
        console.log('');
    }

    async showCreators() {
        const creators = await this.creators.find().sort({ createdAt: -1 }).limit(20).toArray();

        if (creators.length === 0) {
            console.log('\n📭 No creators yet\n');
            return;
        }

        console.log(`\n👥 Recent Creators (${creators.length}):\n`);

        for (const creator of creators) {
            console.log(`@${creator.username}`);
            console.log(`   Clicks: ${creator.stats.totalClicks}`);
            console.log(`   Sales: ${creator.stats.totalSales}`);
            console.log(`   Revenue: $${creator.stats.totalRevenue.toFixed(2)}`);
            console.log(`   Joined: ${new Date(creator.createdAt).toLocaleDateString()}`);
            console.log('   ---');
        }
    }

    async mainMenu() {
        while (true) {
            console.log('\n🌟 VAPR Creator Program Admin');
            console.log('1. View pending applications');
            console.log('2. Process applications');
            console.log('3. View statistics');
            console.log('4. View recent creators');
            console.log('5. Exit\n');

            const choice = await question('Select an option (1-5): ');

            switch (choice) {
                case '1':
                    await this.showPendingApplications();
                    break;

                case '2':
                    await this.processApplications();
                    break;

                case '3':
                    await this.showStats();
                    break;

                case '4':
                    await this.showCreators();
                    break;

                case '5':
                    console.log('\n👋 Goodbye!\n');
                    await this.close();
                    process.exit(0);

                default:
                    console.log('\n❌ Invalid option\n');
            }
        }
    }

    async processApplications() {
        const pending = await this.showPendingApplications();

        if (pending.length === 0) {
            return;
        }

        const index = await question('\nSelect application number to process (or 0 to cancel): ');
        const appIndex = parseInt(index) - 1;

        if (index === '0') {
            return;
        }

        if (isNaN(appIndex) || appIndex < 0 || appIndex >= pending.length) {
            console.log('\n❌ Invalid selection\n');
            return;
        }

        const app = pending[appIndex];

        console.log(`\n📝 Processing application from @${app.username}`);
        console.log('1. Approve');
        console.log('2. Reject');
        console.log('3. Cancel\n');

        const action = await question('Select action (1-3): ');

        switch (action) {
            case '1':
                await this.approveApplication(app);
                break;

            case '2':
                const reason = await question('Rejection reason (optional): ');
                await this.rejectApplication(app, reason || 'Application not approved at this time');
                break;

            case '3':
                console.log('\n↩️  Cancelled\n');
                break;

            default:
                console.log('\n❌ Invalid option\n');
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
        rl.close();
    }
}

// Main execution
async function main() {
    const admin = new CreatorAdmin();

    try {
        await admin.connect();
        await admin.mainMenu();
    } catch (error) {
        console.error('Fatal error:', error);
        await admin.close();
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down...\n');
    process.exit(0);
});

main();

