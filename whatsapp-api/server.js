require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const wa = require('./client');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 7002;
const API_KEY = process.env.WA_API_KEY;

if (!API_KEY) {
    console.error('❌ WA_API_KEY not set! Run: node generate-key.js');
    // process.exit(1);
}

// ── Redis ──────────────────────────────────────────────────
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const publisher = createClient({ url: redisUrl });
publisher.connect().then(() => console.log('✅ Redis connected')).catch(err => console.error('❌ Redis error:', err));

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60000, max: 100 }));

// ── Auth ──────────────────────────────────────────────────
function requireAuth(req, res, next) {
    if (req.headers['x-api-key'] !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
}

// ── Init WhatsApp client on startup ───────────────────────
wa.init();

// Track incoming replies
wa.onMessage = async (msg) => {
    logger.logMessage({
        phone: msg.from,
        message: msg.body,
        status: 'received',
        direction: 'in',
    });
};

// ─────────────────────────────────────────────────────────
// ROUTE 1: Status + QR info
// ─────────────────────────────────────────────────────────
app.get('/status', (req, res) => {
    res.json(wa.getStatus());
});

// ─────────────────────────────────────────────────────────
// ROUTE 2: Get QR code as base64 image
// ─────────────────────────────────────────────────────────
app.get('/qr', (req, res) => {
    if (wa.isReady) {
        return res.json({ connected: true, message: 'Already connected, no QR needed' });
    }
    if (!wa.qrCodeData) {
        return res.json({ qr: null, message: 'QR not ready yet, retry in 5 seconds' });
    }
    res.json({
        qr: wa.qrCodeData,     // base64 PNG — display as <img src={qr} />
        message: 'Scan this QR code with WhatsApp → Linked Devices → Link a Device'
    });
});

// QR as HTML page (easy browser view)
app.get('/qr-page', (req, res) => {
    if (wa.isReady) {
        return res.send('<h2 style="color:green">✅ WhatsApp Connected!</h2>');
    }
    if (!wa.qrCodeData) {
        return res.send('<h2>⏳ QR not ready, refresh in 5 seconds...</h2><script>setTimeout(()=>location.reload(),5000)</script>');
    }
    res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>WhatsApp QR — AgencyFlow</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:40px;background:#07080A;color:white">
      <h2>📱 Scan to Connect WhatsApp</h2>
      <p>Open WhatsApp → ⋮ → Linked Devices → Link a Device</p>
      <img src="${wa.qrCodeData}" style="width:300px;border-radius:12px" />
      <p style="color:#8B93A8">Page auto-refreshes every 10 seconds</p>
      <script>setTimeout(()=>location.reload(), 10000)</script>
    </body>
    </html>
  `);
});

// ─────────────────────────────────────────────────────────
// ROUTE 3: Send single text message
// ─────────────────────────────────────────────────────────
app.post('/send', requireAuth, async (req, res) => {
    const { phone, message, campaign_id } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'phone and message are required' });
    }

    try {
        const result = await wa.sendText(phone, message);
        logger.logMessage({ campaign_id, phone, message, status: 'sent', message_id: result.message_id });
        res.json({ success: true, message_id: result.message_id });
    } catch (err) {
        logger.logMessage({ campaign_id, phone, message, status: 'failed', error: err.message });
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// ROUTE 4: Send image
// ─────────────────────────────────────────────────────────
app.post('/send-image', requireAuth, async (req, res) => {
    const { phone, image_url, caption } = req.body;
    if (!phone || !image_url) {
        return res.status(400).json({ error: 'phone and image_url are required' });
    }

    try {
        const result = await wa.sendImage(phone, image_url, caption);
        res.json({ success: true, message_id: result.message_id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// ROUTE 5: Start bulk campaign
// ─────────────────────────────────────────────────────────
app.post('/send-bulk', requireAuth, async (req, res) => {
    const { contacts, message, campaign_id, delay_ms = 3000 } = req.body;
    // contacts = [{name, phone}]

    if (!contacts || contacts.length === 0) {
        return res.status(400).json({ error: 'contacts array is required' });
    }
    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }
    if (!wa.isReady) {
        return res.status(503).json({ error: 'WhatsApp not connected. Visit /qr-page to scan QR.' });
    }

    const campId = campaign_id || uuid();
    logger.createCampaign(campId, contacts.length);

    res.json({
        started: true,
        campaign_id: campId,
        total: contacts.length,
        stream_url: `/stream/${campId}`,
        message: 'Campaign started. Connect to stream_url for live updates.',
    });

    // Run in background
    runBulkCampaign({ campaignId: campId, contacts, message, delay_ms });
});

async function runBulkCampaign({ campaignId, contacts, message, delay_ms }) {
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const phone = String(contact.phone || '').trim();
        const name = contact.name || 'there';

        if (!phone) {
            failed++;
            continue;
        }

        // Personalize message
        const personalized = message
            .replace(/{name}/g, name)
            .replace(/{phone}/g, phone)
            .replace(/{company}/g, contact.company || '');

        try {
            const result = await wa.sendText(phone, personalized);
            sent++;

            logger.logMessage({
                campaign_id: campaignId, phone, name,
                message: personalized, status: 'sent', message_id: result.message_id,
            });
            logger.updateCampaign(campaignId, { sent, failed });

            // Publish live event to Redis
            await publisher.publish(`wa:campaign:${campaignId}`, JSON.stringify({
                type: 'delivery',
                index: i + 1,
                total: contacts.length,
                phone,
                name,
                status: 'sent',
                sent,
                failed,
                timestamp: new Date().toISOString(),
            }));

        } catch (err) {
            failed++;
            logger.logMessage({
                campaign_id: campaignId, phone, name,
                message: personalized, status: 'failed', error: err.message,
            });
            logger.updateCampaign(campaignId, { sent, failed });

            await publisher.publish(`wa:campaign:${campaignId}`, JSON.stringify({
                type: 'delivery', index: i + 1, total: contacts.length,
                phone, name, status: 'failed', error: err.message, sent, failed,
                timestamp: new Date().toISOString(),
            }));
        }

        // Delay between messages (important — avoid WhatsApp ban)
        if (i < contacts.length - 1) {
            await new Promise(r => setTimeout(r, delay_ms));
        }
    }

    // Campaign complete
    logger.updateCampaign(campaignId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
    });
    await publisher.publish(`wa:campaign:${campaignId}`, JSON.stringify({
        type: 'complete', sent, failed,
        total: contacts.length,
        rate: `${Math.round((sent / contacts.length) * 100)}%`,
    }));

    console.log(`✅ WhatsApp campaign ${campaignId}: ${sent} sent, ${failed} failed`);
}

// ─────────────────────────────────────────────────────────
// ROUTE 6: SSE live stream
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

    const subscriber = createClient({ url: redisUrl });
    await subscriber.connect();

    await subscriber.subscribe(`wa:campaign:${campaignId}`, (message) => {
        res.write(`data: ${message}\n\n`);
        if (JSON.parse(message).type === 'complete') {
            subscriber.disconnect();
            res.end();
        }
    });

    req.on('close', () => subscriber.disconnect());
});

// ─────────────────────────────────────────────────────────
// ROUTE 7: Campaign history
// ─────────────────────────────────────────────────────────
app.get('/campaigns', requireAuth, (req, res) => {
    res.json({ campaigns: logger.getCampaigns() });
});

app.get('/campaigns/:id/logs', requireAuth, (req, res) => {
    res.json({ logs: logger.getCampaignLogs(req.params.id) });
});

// ─────────────────────────────────────────────────────────
// ROUTE 8: Logout WhatsApp
// ─────────────────────────────────────────────────────────
app.post('/logout', requireAuth, async (req, res) => {
    await wa.logout();
    res.json({ success: true, message: 'Logged out. Restart server to scan new QR.' });
});

app.listen(PORT, () => {
    console.log(`\n💬 AgencyFlow WhatsApp API running at http://localhost:${PORT}`);
    console.log(`📱 Scan QR at: http://localhost:${PORT}/qr-page`);
    // console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 20) : 'NOT SET'}...\n`);
});
