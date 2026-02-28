const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');

class WhatsAppClient {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCodeData = null;   // base64 QR image for web display
        this.phoneNumber = null;
        this.status = 'disconnected';
        this.onMessage = null;   // callback for incoming messages
    }

    init() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './wa-session',
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                ],
            },
        });

        // QR code generated — user needs to scan
        this.client.on('qr', async (qr) => {
            console.log('\n📱 WhatsApp QR Code ready — scan with your phone!');
            console.log('Visit: http://localhost:7002/qr to scan in browser\n');
            this.qrCodeData = await qrcode.toDataURL(qr);
            this.isReady = false;
            this.status = 'qr_ready';
        });

        // Successfully connected
        this.client.on('ready', () => {
            console.log('✅ WhatsApp connected!');
            this.isReady = true;
            this.qrCodeData = null;
            this.status = 'connected';
            this.phoneNumber = this.client.info?.wid?.user || 'unknown';
            console.log(`📞 Connected as: +${this.phoneNumber}`);
        });

        // Auth successful
        this.client.on('authenticated', () => {
            console.log('🔐 WhatsApp authenticated');
            this.status = 'authenticated';
        });

        // Auth failed
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Auth failed:', msg);
            this.isReady = false;
            this.status = 'auth_failed';
        });

        // Disconnected
        this.client.on('disconnected', (reason) => {
            console.log('⚠️ WhatsApp disconnected:', reason);
            this.isReady = false;
            this.status = 'disconnected';
            this.phoneNumber = null;
            // Auto-reconnect after 5 seconds
            setTimeout(() => {
                console.log('🔄 Reconnecting WhatsApp...');
                this.client.initialize();
            }, 5000);
        });

        // Incoming message (track replies)
        this.client.on('message', (msg) => {
            if (this.onMessage) {
                this.onMessage({
                    from: msg.from.replace('@c.us', ''),
                    body: msg.body,
                    timestamp: new Date().toISOString(),
                    type: msg.type,
                });
            }
        });

        // Start the client
        this.client.initialize();
        console.log('🔄 Initializing WhatsApp client...');
    }

    formatPhone(phone) {
        // Remove all non-digits
        let clean = phone.replace(/\D/g, '');
        // Add country code if missing (India default)
        if (clean.length === 10 && '6789'.includes(clean[0])) {
            clean = '91' + clean;
        }
        return clean + '@c.us';
    }

    async sendText(phone, message) {
        if (!this.isReady) throw new Error('WhatsApp not connected. Scan QR first.');
        const chatId = this.formatPhone(phone);
        const result = await this.client.sendMessage(chatId, message);
        return { success: true, message_id: result.id.id };
    }

    async sendImage(phone, imageUrl, caption = '') {
        if (!this.isReady) throw new Error('WhatsApp not connected. Scan QR first.');
        const chatId = this.formatPhone(phone);
        const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
        const result = await this.client.sendMessage(chatId, media, { caption });
        return { success: true, message_id: result.id.id };
    }

    async sendDocument(phone, docUrl, caption = '') {
        if (!this.isReady) throw new Error('WhatsApp not connected.');
        const chatId = this.formatPhone(phone);
        const media = await MessageMedia.fromUrl(docUrl, { unsafeMime: true });
        const result = await this.client.sendMessage(chatId, media, { caption, sendMediaAsDocument: true });
        return { success: true, message_id: result.id.id };
    }

    async getChats() {
        if (!this.isReady) throw new Error('WhatsApp not connected.');
        const chats = await this.client.getChats();
        return chats.slice(0, 20).map(c => ({
            id: c.id.user,
            name: c.name,
            unread: c.unreadCount,
        }));
    }

    async logout() {
        if (this.client) {
            await this.client.logout();
            this.isReady = false;
            this.status = 'logged_out';
        }
    }

    getStatus() {
        return {
            status: this.status,
            connected: this.isReady,
            phone: this.phoneNumber ? `+${this.phoneNumber}` : null,
            qr_available: !!this.qrCodeData,
        };
    }
}

module.exports = new WhatsAppClient();
