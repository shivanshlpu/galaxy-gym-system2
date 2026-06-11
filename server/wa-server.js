const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' })); // Reduced limit to save memory

let isReady = false;
let isIdle = true; // Tracks if we are waiting for user to click connect
let currentQrBase64 = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--disable-accelerated-2d-canvas', 
            '--no-first-run', 
            '--no-zygote', 
            '--disable-gpu'
            // Removed --single-process as it can cause OOM in some Chrome versions
        ]
    }
});

        client.on('qr', async (qr) => {
            console.log('\n======================================================');
            console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP LINKED DEVICES:');
            console.log('======================================================\n');
            qrcode.generate(qr, { small: true });
            try {
                currentQrBase64 = await QRCode.toDataURL(qr);
                isIdle = false;
                console.log('✅ QR Code generated for frontend.');
            } catch (err) {
                console.error('Failed to generate base64 QR', err);
            }
        });

        client.on('ready', () => {
            isReady = true;
            isIdle = false;
            currentQrBase64 = null;
            console.log('\n✅ WhatsApp Client is READY and CONNECTED!\n');
        });

        client.on('auth_failure', msg => {
            isReady = false;
            isIdle = true;
            currentQrBase64 = null;
            console.error('❌ Authentication failure:', msg);
        });

        client.on('disconnected', (reason) => {
            isReady = false;
            isIdle = true;
            currentQrBase64 = null;
            console.log('❌ WhatsApp Client was disconnected:', reason);
        });

        // This endpoint exactly matches what the GymOS server expects
        app.post('/send', async (req, res) => {
            if (!isReady) {
                return res.status(503).json({ success: false, error: 'WhatsApp client is waking up or needs QR scan. Try again in 30 seconds.' });
            }
            const { phone, message, mediaBase64 } = req.body;
            try {
                if (!phone || !message) {
                    return res.status(400).json({ success: false, error: 'Phone and message are required' });
                }
                
                let digits = phone.replace(/\D/g, '');
                // If it's a 10 digit number, assume India (+91)
                if (digits.length === 10) {
                    digits = '91' + digits;
                }
                const targetNumber = `${digits}@c.us`;
                
                let media;
                if (mediaBase64) {
                    const matches = mediaBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        media = new MessageMedia(matches[1], matches[2], 'poster.jpg');
                    }
                }
                
                await client.sendMessage(targetNumber, message, media ? { media } : undefined);
                console.log(`📨 Sent message to ${targetNumber} ${media ? '(with image)' : ''}`);
                res.json({ success: true });
            } catch (error) {
                console.error('❌ Failed to send message:', error.message);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Get Current Status
        app.get('/status', (req, res) => {
            res.json({
                success: true,
                data: {
                    isReady,
                    isIdle,
                    qr: currentQrBase64
                }
            });
        });

        // Manual Connect 
        app.post('/connect', async (req, res) => {
            if (!isIdle && !isReady && currentQrBase64) {
                return res.json({ success: true, message: 'Already connecting' });
            }
            try {
                isIdle = false;
                client.initialize();
                res.json({ success: true, message: 'Initialization started' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Disconnect and Force New QR
        app.post('/disconnect', async (req, res) => {
            try {
                isReady = false;
                currentQrBase64 = null;
                await client.logout();
                isIdle = true;
                res.json({ success: true, message: 'Disconnected' });
            } catch (error) {
                try {
                    await client.destroy();
                    isIdle = true;
                    res.json({ success: true, message: 'Destroyed' });
                } catch(e) {
                    res.status(500).json({ success: false, error: e.message });
                }
            }
        });

// Health check endpoint for UptimeRobot to keep server awake
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Smart Startup Logic
// LocalAuth creates a directory named .wwebjs_auth
if (fs.existsSync('./.wwebjs_auth')) {
    console.log('\n🔍 Found existing local session on disk. Auto-initializing...');
    isIdle = false;
    client.initialize();
} else {
    console.log('\n🔍 No existing session found. Waiting for Connect signal from frontend...');
    isIdle = true;
}



const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Standalone WhatsApp Microservice running on port ${PORT}`);
    console.log('Waiting for WhatsApp to initialize...\n');
});
