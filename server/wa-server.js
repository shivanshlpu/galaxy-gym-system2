const { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const mongoose = require('mongoose');
const useMongoDBAuthState = require('./utils/useMongoDBAuthState');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB for WhatsApp Session');
        mongoose.connection.db.collection('baileysauths').countDocuments({}).then(count => {
            if (count > 0) {
                console.log('\n🔍 Found existing session in MongoDB. Auto-initializing...');
                connectToWhatsApp();
            } else {
                console.log('\n🔍 No existing session found. Waiting for Connect signal from frontend...');
                isIdle = true;
            }
        });
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API key authentication — all routes except /ping require valid key
const WA_API_KEY = process.env.WA_API_KEY;
app.use((req, res, next) => {
  if (req.path === '/ping') return next();
  if (!WA_API_KEY) {
    console.error('⚠️  WA_API_KEY not set — rejecting all requests for security');
    return res.status(500).json({ success: false, error: 'WhatsApp service misconfigured' });
  }
  const key = req.headers['x-api-key'];
  if (key !== WA_API_KEY) {
    return res.status(403).json({ success: false, error: 'Invalid API key' });
  }
  next();
});

let isReady = false;
let isIdle = true;
let currentQrBase64 = null;
let sock = null;
let clearStateFn = null;
let reconnectAttempts = 0;
let isConnecting = false;

async function connectToWhatsApp() {
    if (isConnecting) {
        console.log('⚠️ WhatsApp connection initialization already in progress...');
        return;
    }
    isConnecting = true;
    isIdle = false;

    if (sock) {
        try {
            sock.ev.removeAllListeners();
            sock.end(undefined);
        } catch (e) {
            console.error('Note: error closing previous socket:', e.message);
        }
        sock = null;
    }

    try {
        const { state, saveCreds, clearState } = await useMongoDBAuthState();
        clearStateFn = async () => {
            try {
                await clearState();
                console.log('✅ Cleared MongoDB auth state.');
            } catch (e) {
                console.error('Failed to clear MongoDB auth state:', e.message);
            }
            try {
                if (fs.existsSync('./.wwebjs_auth')) {
                    fs.rmSync('./.wwebjs_auth', { recursive: true, force: true });
                    console.log('✅ Removed local .wwebjs_auth directory.');
                }
            } catch (e) {
                console.error('Failed to remove local auth directory:', e.message);
            }
        };

        const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));
        console.log(`📡 Initializing Baileys WhatsApp client with version v${version.join('.')}`);

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }), // Disable heavy logging
            browser: Browsers.macOS('Desktop'),
            syncFullHistory: false,
            markOnlineOnConnect: false,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n======================================================');
                console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP LINKED DEVICES:');
                console.log('======================================================\n');
                qrcode.generate(qr, { small: true });
                try {
                    currentQrBase64 = await QRCode.toDataURL(qr);
                    console.log('✅ Fresh QR Code generated for frontend.');
                } catch (err) {
                    console.error('Failed to generate base64 QR', err);
                }
            }

            if (connection === 'close') {
                isReady = false;
                currentQrBase64 = null;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
                const isBadSession = statusCode === DisconnectReason.badSession || statusCode === 403;
                reconnectAttempts++;

                console.log(`❌ WhatsApp connection closed due to ${lastDisconnect?.error?.message || lastDisconnect?.error || 'Unknown Error'} (Status: ${statusCode || 'N/A'}), attempt #${reconnectAttempts}`);
                
                // If logged out, bad session, or failed repeatedly (3+ times), wipe auth state & force fresh QR code generation!
                if (isLoggedOut || isBadSession || reconnectAttempts >= 3) {
                    console.log('🧹 Session invalid, logged out, or max reconnect attempts reached. Clearing session state to generate fresh QR code...');
                    reconnectAttempts = 0;
                    if (sock) {
                        try { sock.ev.removeAllListeners(); } catch (e) {}
                        sock = null;
                    }
                    if (clearStateFn) {
                        await clearStateFn();
                    }
                    // Delay briefly before reconnecting with clean state so fresh QR code is generated
                    setTimeout(() => {
                        connectToWhatsApp();
                    }, 1500);
                } else {
                    // Retry reconnection with backoff delay
                    setTimeout(() => {
                        connectToWhatsApp();
                    }, 3000);
                }
            } else if (connection === 'open') {
                console.log('\n✅ WhatsApp Client is READY and CONNECTED!\n');
                isReady = true;
                isIdle = false;
                reconnectAttempts = 0;
                currentQrBase64 = null;
            }
        });
    } catch (err) {
        console.error('❌ Failed to initialize WhatsApp socket:', err.message);
    } finally {
        isConnecting = false;
    }
}

// POST /send - Matches exactly what the GymOS server expects
app.post('/send', async (req, res) => {
    if (!isReady || !sock) {
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
        // Baileys uses @s.whatsapp.net instead of @c.us
        const targetNumber = `${digits}@s.whatsapp.net`;
        
        let msgPayload = { text: message };
        if (mediaBase64) {
            try {
                let base64Data = mediaBase64;
                if (mediaBase64.includes('base64,')) {
                    base64Data = mediaBase64.split('base64,')[1];
                }
                msgPayload = {
                    image: Buffer.from(base64Data, 'base64'),
                    caption: message
                };
            } catch (err) {
                console.error("❌ Failed to parse media buffer:", err.message);
                // Fallback to text if image parsing fails
                msgPayload = { text: message };
            }
        }
        
        await sock.sendMessage(targetNumber, msgPayload);
        console.log(`📨 Sent message to ${targetNumber} ${mediaBase64 ? '(with image)' : ''}`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Failed to send message:', error.stack || error.message);
        const isProd = process.env.NODE_ENV === 'production';
        res.status(500).json({ success: false, error: isProd ? 'Failed to send message.' : error.message });
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
    if (isReady) {
        return res.json({ success: true, message: 'Already connected' });
    }
    if (!isIdle && currentQrBase64) {
        return res.json({ success: true, message: 'Already connecting, QR code ready' });
    }
    try {
        reconnectAttempts = 0;
        if (clearStateFn && !currentQrBase64) {
            await clearStateFn();
        }
        connectToWhatsApp();
        res.json({ success: true, message: 'Initialization started' });
    } catch (error) {
        console.error('❌ Connect Error:', error.stack || error.message);
        const isProd = process.env.NODE_ENV === 'production';
        res.status(500).json({ success: false, error: isProd ? 'Connection failed.' : error.message });
    }
});

// Disconnect and Force New QR
app.post('/disconnect', async (req, res) => {
    try {
        isReady = false;
        isIdle = false;
        currentQrBase64 = null;
        reconnectAttempts = 0;
        if (sock) {
            try {
                sock.ev.removeAllListeners();
                await sock.logout();
            } catch (e) {
                console.log('Note: Error during socket logout:', e.message);
            }
            sock = null;
        }
        if (clearStateFn) {
            await clearStateFn();
        }
        // Auto-reconnect with fresh state to generate a new QR code
        setTimeout(() => {
            connectToWhatsApp();
        }, 1000);
        res.json({ success: true, message: 'Disconnected and generating new QR code...' });
    } catch (error) {
        console.error('❌ Disconnect Error:', error.stack || error.message);
        const isProd = process.env.NODE_ENV === 'production';
        res.status(500).json({ success: false, error: isProd ? 'Disconnection failed.' : error.message });
    }
});

// Health check endpoint for UptimeRobot to keep server awake
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Smart Startup Logic has been moved to mongoose.connect.then()

const PORT = process.env.WA_PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Standalone WhatsApp Microservice running on port ${PORT} (Powered by Baileys + MongoDB)`);
});
