import { MongoClient } from 'mongodb';
import readline from 'readline';
import dotenv from 'dotenv';
import { Resend } from 'resend';

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
        this.resend = new Resend(process.env.RESEND_API_KEY);
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

    async sendWelcomeEmail(user, creatorCode) {
        try {
            const emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6B46C1; text-align: center;">🎉 Welcome to the VAPR Creator Program!</h1>
                    
                    <p>Hey <strong>@${user.username}</strong>,</p>
                    
                    <p>Congratulations! Your application to the VAPR Creator Program has been approved. You're now officially part of our amazing creator community!</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="color: #6B46C1; margin-top: 0;">Your Creator Details:</h3>
                        <p><strong>Your Creator Code is your username:</strong></p>
                        <div style="background: #fff; border: 2px dashed #6B46C1; padding: 15px; text-align: center; margin: 10px 0; border-radius: 8px;">
                            <code style="font-size: 24px; font-weight: bold; color: #6B46C1; font-family: monospace;">${creatorCode}</code>
                            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Click to select and copy this code</p>
                        </div>
                        <p><strong>Tebex Wallet ID:</strong> Connected ✅</p>
                        <p style="font-size: 14px; color: #666; margin-top: 10px;">
                            <em>Note: Your creator code is the same as your Discord username. Share this code with your audience so they can support you when purchasing games!</em>
                        </p>
                    </div>
                    
                    <h3 style="color: #6B46C1;">What's Next?</h3>
                    <ul>
                        <li>Start creating amazing content and tag games in your posts</li>
                        <li>Share your creator code <strong>${creatorCode}</strong> with your audience</li>
                        <li>When someone uses your code to purchase a game, you'll earn commission</li>
                        <li>Track your performance in the creator dashboard</li>
                        <li>Earn revenue from game sales through your content</li>
                    </ul>
                    
                    <h3 style="color: #6B46C1;">Need Help?</h3>
                    <p>I'm Victor, the founder of VAPR, and I'm here to help you succeed! Feel free to reach out anytime:</p>
                    <ul>
                        <li>📧 Email: <a href="mailto:victor@victorgamestudio.com">victor@victorgamestudio.com</a></li>
                        <li>💬 Discord: <strong>victorgamestudio</strong></li>
                    </ul>
                    
                    <p>Thank you for being part of this adventure! We're excited to see what amazing content you'll create and how you'll help grow our gaming community.</p>
                    
                    <p style="margin-top: 30px;">Cheers,<br>
                    <strong>Victor</strong><br>
                    Founder, VAPR</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
                    
                    <p style="text-align: center; color: #888; font-size: 12px;">
                        VAPR - Where Gaming Content Thrives<br>
                        <a href="https://vapr.club" style="color: #6B46C1;">vapr.club</a>
                    </p>
                </div>
            `;

            const response = await this.resend.emails.send({
                from: 'VAPR Creator Program <creators@vapr.club>',
                to: [user.email],
                subject: '🎉 Welcome to the VAPR Creator Program!',
                html: emailContent
            });

            console.log('   📧 Welcome email sent successfully!');
            return response;
        } catch (error) {
            console.error('   ⚠️  Failed to send welcome email:', error.message);
            // Don't throw - email failure shouldn't block the approval process
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
            console.log(`    Email: ${user?.email || 'Not available'}`);
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

            // Get user details for email
            const user = await this.users.findOne({ id: app.userId });
            if (user && user.email) {
                await this.sendWelcomeEmail(user, app.username);
            } else {
                console.log('   ⚠️  No email address available for welcome email');
            }

            // Send Discord notification if webhook is configured
            const discordWebhook = process.env.DISCORD_CREATOR_WEBHOOK_URL;
            if (discordWebhook) {
                await this.sendDiscordNotification(
                    discordWebhook,
                    `✅ Creator application approved for **@${app.username}**\nThey can now earn from their content! Welcome email has been sent.`
                );
            }

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

    async sendDiscordNotification(webhookUrl, message) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });
        } catch (error) {
            console.error('Failed to send Discord notification:', error.message);
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
            const user = await this.users.findOne({ id: creator.userId });
            console.log(`@${creator.username}`);
            console.log(`   Email: ${user?.email || 'Not available'}`);
            console.log(`   Clicks: ${creator.stats.totalClicks}`);
            console.log(`   Sales: ${creator.stats.totalSales}`);
            console.log(`   Revenue: $${creator.stats.totalRevenue.toFixed(2)}`);
            console.log(`   Joined: ${new Date(creator.createdAt).toLocaleDateString()}`);
            console.log('   ---');
        }
    }

    async resendWelcomeEmail() {
        const creators = await this.creators.find().sort({ createdAt: -1 }).limit(50).toArray();

        if (creators.length === 0) {
            console.log('\n📭 No creators found\n');
            return;
        }

        console.log(`\n📧 Creators available for email resend:\n`);

        for (let i = 0; i < creators.length; i++) {
            const creator = creators[i];
            const user = await this.users.findOne({ id: creator.userId });
            console.log(`[${i + 1}] @${creator.username} - ${user?.email || 'No email'}`);
        }

        const index = await question('\nSelect creator number to resend welcome email (or 0 to cancel): ');
        const creatorIndex = parseInt(index) - 1;

        if (index === '0') {
            return;
        }

        if (isNaN(creatorIndex) || creatorIndex < 0 || creatorIndex >= creators.length) {
            console.log('\n❌ Invalid selection\n');
            return;
        }

        const creator = creators[creatorIndex];
        const user = await this.users.findOne({ id: creator.userId });

        if (!user || !user.email) {
            console.log('\n❌ No email address available for this creator\n');
            return;
        }

        console.log(`\n📧 Resending welcome email to @${creator.username} (${user.email})...`);
        await this.sendWelcomeEmail(user, creator.username);
    }

    async mainMenu() {
        while (true) {
            console.log('\n🌟 VAPR Creator Program Admin');
            console.log('1. View pending applications');
            console.log('2. Process applications');
            console.log('3. View statistics');
            console.log('4. View recent creators');
            console.log('5. Resend welcome email');
            console.log('6. Exit\n');

            const choice = await question('Select an option (1-6): ');

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
                    await this.resendWelcomeEmail();
                    break;

                case '6':
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
        console.log('1. Approve (sends welcome email)');
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