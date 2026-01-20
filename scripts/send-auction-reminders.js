
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' }); // Load env vars
// Provide fallback for normal .env if .env.local missing
if (!process.env.RESEND_API_KEY) require('dotenv').config();

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@karkey.space';

async function sendReminders() {
    console.log('[Reminder Script] Starting...');

    try {
        // 1. Check if it's Saturday (0 = Sunday, 6 = Saturday)
        // We want this to run roughly when the auction opens (Friday night / Saturday morning)
        // You can remove this check if the CRON itself is strictly scheduled for Saturday.
        // But keeping it adds safety.
        const now = new Date();
        const day = now.getDay();

        // Uncomment strictly if you want to enforce day check in code:
        // if (day !== 6) {
        //   console.log('[Reminder Script] Not Saturday. Exiting.');
        //   return;
        // }

        // 2. Get active subscribers
        const subscribers = await prisma.auction_reminders.findMany({
            where: { is_active: true },
            select: { email: true },
        });

        if (subscribers.length === 0) {
            console.log('[Reminder Script] No subscribers found.');
            return;
        }

        console.log(`[Reminder Script] Found ${subscribers.length} subscribers.`);

        // 3. Send Emails
        // We recycle the content logic here for the standalone script
        // (Simpler than importing TS lib/email.ts which might need compilation)
        const subject = 'The Weekend Collection is Live! - Karkey';

        // Simplified Template for the script
        const getBody = () => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background-color: #f4f4f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
          <div style="background: #103090; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">Karkey</h1>
            <p>Weekend Collection</p>
          </div>
          <div style="padding: 30px; text-align: center;">
            <h2 style="color: #103090;">The Auction Has Begun</h2>
            <p style="color: #4b5563;">The weekend auction event is now live. Discover our exclusive collection.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://karkey.space'}/auctions" 
               style="display: inline-block; padding: 12px 24px; background-color: #B8071C; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
               View Auctions
            </a>
          </div>
        </div>
      </body>
    </html>
    `;

        // Process in batches
        const BATCH_SIZE = 50;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
            const batch = subscribers.slice(i, i + BATCH_SIZE);
            console.log(`[Reminder Script] Processing batch ${i / BATCH_SIZE + 1}...`);

            const promises = batch.map(async (sub) => {
                try {
                    await resend.emails.send({
                        from: `Karkey Auctions <${EMAIL_FROM}>`,
                        to: sub.email,
                        subject: subject,
                        html: getBody(),
                    });
                    sent++;
                } catch (e) {
                    console.error(`[Reminder Script] Failed to send to ${sub.email}:`, e.message);
                    failed++;
                }
            });

            await Promise.all(promises);
        }

        console.log(`[Reminder Script] Finished. Sent: ${sent}, Failed: ${failed}`);

    } catch (error) {
        console.error('[Reminder Script] Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sendReminders();
