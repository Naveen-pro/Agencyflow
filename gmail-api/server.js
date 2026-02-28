require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { sendEmail, sendBulkEmails, verifyAllAccounts } = require('./mailer');
const accounts = require('./accounts');
const logger = require('./logger');

const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 7003;
const API_KEY = process.env.EMAIL_API_KEY;

if (!API_KEY) {
    console.error('❌ EMAIL_API_KEY not set in .env! Run: node generate-key.js');
    // process.exit(1);
}

// ── Redis for SSE pub/sub ──────────────────────────────────
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const publisher = createClient({ url: redisUrl });
publisher.connect().then(() => console.log('✅ Redis connected')).catch(err => console.error('❌ Redis connection error:', err));

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60000, max: 100 }));

// ── Auth ──────────────────────────────────────────────────
function requireAuth(req, res, next) {
    const key = req.headers['x-api-key'];
    if (!key || key !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
}

// ─────────────────────────────────────────────────────────
// ROUTE 1: Health check
// ─────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        const verified = await verifyAllAccounts();
        const stats = accounts.getStats();
        res.json({
            status: 'ok',
            accounts: verified,
            usage: stats,
            total_capacity: stats.reduce((sum, a) => sum + a.remaining, 0),
        });
    } catch (err) {
        res.json({ status: 'error', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// ROUTE 2: Send single email
// ─────────────────────────────────────────────────────────
app.post('/send', requireAuth, async (req, res) => {
    const { to, subject, html, text, from_name, reply_to } = req.body;

    if (!to || !subject) {
        return res.status(400).json({ error: 'to and subject are required' });
    }

    try {
        const result = await sendEmail({ to, subject, html, text, from_name, reply_to });
        logger.logEmail({
            campaign_id: null,
            to_email: to,
            subject: subject,
            from_email: result.from,
            status: 'sent',
            message_id: result.message_id,
        });
        res.json({ success: true, message_id: result.message_id, from: result.from });
    } catch (err) {
        logger.logEmail({ to_email: to, subject, status: 'failed', error: err.message });
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// ROUTE 3: Send test email to yourself
// ─────────────────────────────────────────────────────────
app.post('/send-test', requireAuth, async (req, res) => {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'to is required' });

    try {
        const result = await sendEmail({
            to,
            subject: '✅ AgencyFlow Email Test — It Works!',
            html: `<h2>🎉 Your Gmail API is working!</h2>
                  <p>This test email was sent from your own Gmail account via AgencyFlow.</p>
                  <p><b>Sent at:</b> ${new Date().toLocaleString()}</p>
                  <hr>
                  <p style="color:#888;font-size:12px">AgencyFlow — Your own email infrastructure</p>`,
            from_name: 'AgencyFlow',
        });
        res.json({ success: true, message: 'Test email sent!', from: result.from });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// ROUTE 4: Start bulk email campaign (JSON)
// ─────────────────────────────────────────────────────────
app.post('/send-bulk', requireAuth, async (req, res) => {
    const {
        contacts,    // [{name, email, company}]
        subject,
        html,
        from_name,
        reply_to,
        delay_ms = 1200,
    } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ error: 'contacts array is required' });
    }
    if (!subject || !html) {
        return res.status(400).json({ error: 'subject and html are required' });
    }

    const campaignId = req.body.campaign_id || uuid();

    // Save campaign to SQLite
    logger.createCampaign(campaignId, {
        total: contacts.length,
        subject: subject,
        from_name: from_name || 'AgencyFlow',
    });

    // Return immediately — campaign runs in background
    res.json({
        started: true,
        campaign_id: campaignId,
        total: contacts.length,
        stream_url: `/stream/${campaignId}`,
        message: 'Campaign started. Connect to stream_url for live updates.',
    });

    // Run in background (no await)
    runBulkCampaign({ campaignId, contacts, subject, html, from_name, reply_to, delay_ms });
});

// ─────────────────────────────────────────────────────────
// ROUTE 4B: Start Mega Campaign via CSV Upload (100k+ support)
// ─────────────────────────────────────────────────────────
app.post('/send-mega', requireAuth, upload.single('file'), async (req, res) => {
    const { subject, html, from_name, reply_to, delay_ms = 1000 } = req.body;

    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });
    if (!subject || !html) return res.status(400).json({ error: 'subject and html are required' });

    const contacts = [];
    const campaignId = uuid();

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            // Expecting columns: email, name, company
            if (row.email) contacts.push(row);
        })
        .on('end', async () => {
            // Delete temporary file
            fs.unlinkSync(req.file.path);

            if (contacts.length === 0) {
                return console.error('Empty CSV or missing "email" column');
            }

            logger.createCampaign(campaignId, {
                total: contacts.length,
                subject: subject,
                from_name: from_name || 'AgencyFlow',
            });

            console.log(`🚀 Starting Mega Campaign ${campaignId} with ${contacts.length} contacts`);
            runBulkCampaign({ campaignId, contacts, subject, html, from_name, reply_to, delay_ms: parseInt(delay_ms) });
        });

    res.json({
        started: true,
        campaign_id: campaignId,
        message: 'CSV parsed. Campaign running in background.',
        stream_url: `/stream/${campaignId}`,
    });
});

// ─────────────────────────────────────────────────────────
// Background campaign runner
// ─────────────────────────────────────────────────────────
async function runBulkCampaign({ campaignId, contacts, subject, html, from_name, reply_to, delay_ms }) {
    let sent = 0;
    let failed = 0;

    await sendBulkEmails({
        contacts, subject, html, from_name, reply_to, delay_ms,
        onProgress: async (log) => {
            if (log.status === 'sent') sent++;
            else failed++;

            // Save to SQLite
            logger.logEmail({
                campaign_id: campaignId,
                to_email: log.email,
                to_name: log.name,
                subject: subject,
                from_email: log.from,
                status: log.status,
                message_id: log.id,
                error: log.error,
            });
            logger.updateCampaign(campaignId, { sent, failed });

            // Publish to Redis → SSE stream picks this up
            const payload = JSON.stringify({
                type: 'delivery',
                index: log.index,
                total: log.total,
                email: log.email,
                name: log.name,
                status: log.status,
                error: log.error || null,
                sent,
                failed,
                timestamp: new Date().toISOString(),
            });
            await publisher.publish(`email:campaign:${campaignId}`, payload);
        },
    });

    // Mark complete
    logger.updateCampaign(campaignId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
    });

    // Publish completion event
    await publisher.publish(`email:campaign:${campaignId}`, JSON.stringify({
        type: 'complete',
        sent,
        failed,
        total: contacts.length,
        rate: `${Math.round((sent / contacts.length) * 100)}%`,
    }));

    console.log(`✅ Email campaign ${campaignId}: ${sent} sent, ${failed} failed`);
}

// ─────────────────────────────────────────────────────────
// ROUTE 5: SSE Live Stream for campaign
// ─────────────────────────────────────────────────────────
app.get('/stream/:campaignId', requireAuth, async (req, res) => {
    const { campaignId } = req.params;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', campaign_id: campaignId })}\n\n`);

    // Subscribe to Redis channel
    const subscriber = createClient({ url: redisUrl });
    await subscriber.connect();

    await subscriber.subscribe(`email:campaign:${campaignId}`, (message) => {
        res.write(`data: ${message}\n\n`);
        const parsed = JSON.parse(message);
        if (parsed.type === 'complete') {
            subscriber.disconnect();
            res.end();
        }
    });

    req.on('close', () => {
        subscriber.disconnect();
    });
});

// ─────────────────────────────────────────────────────────
// ROUTE 6: Campaign history and logs
// ─────────────────────────────────────────────────────────
app.get('/campaigns', requireAuth, (req, res) => {
    res.json({ campaigns: logger.getCampaigns(50) });
});

app.get('/campaigns/:id', requireAuth, (req, res) => {
    const campaign = logger.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const logs = logger.getCampaignLogs(req.params.id);
    res.json({ campaign, logs });
});

// ─────────────────────────────────────────────────────────
// ROUTE 7: Account stats
// ─────────────────────────────────────────────────────────
app.get('/accounts', requireAuth, async (req, res) => {
    const verified = await verifyAllAccounts();
    const usage = accounts.getStats();
    res.json({ accounts: verified, usage });
});

app.listen(PORT, () => {
    console.log(`\n📧 AgencyFlow Gmail API running at http://localhost:${PORT}`);
    // console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 20) : 'NOT SET'}...`);
    console.log(`📊 Health:  http://localhost:${PORT}/health\n`);
});
