const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const mongoose = require('mongoose');
const useMongoDBAuthState = require('./utils/useMongoDBAuthState');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB for WhatsApp Session'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const app = express();
app.use(express.json({ limit: '50mb' }));

let isReady = false;
let isIdle = true;
let currentQrBase64 = null;
let sock = null;
let clearStateFn = null;

async function connectToWhatsApp() {
    isIdle = false;
    const { state, saveCreds, clearState } = await useMongoDBAuthState();
    clearStateFn = clearState;

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // Disable heavy logging
        browser: ["GymOS", "Chrome", "1.0.0"],
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
                console.log('✅ QR Code generated for frontend.');
            } catch (err) {
                console.error('Failed to generate base64 QR', err);
            }
        }

        if (connection === 'close') {
            isReady = false;
            currentQrBase64 = null;
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ WhatsApp connection closed due to', lastDisconnect.error?.message || lastDisconnect.error, ', reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                console.log('👋 Logged out from WhatsApp.');
                isIdle = true;
                if (clearStateFn) {
                    await clearStateFn();
                }
            }
        } else if (connection === 'open') {
            console.log('\n✅ WhatsApp Client is READY and CONNECTED!\n');
            isReady = true;
            isIdle = false;
            currentQrBase64 = null;
        }
    });
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
        await connectToWhatsApp();
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
        if (sock) {
            await sock.logout();
            sock = null;
        }
        isIdle = true;
        if (clearStateFn) {
            await clearStateFn();
        }
        res.json({ success: true, message: 'Disconnected' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint for UptimeRobot to keep server awake
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Smart Startup Logic
const AuthModel = mongoose.models.BaileysAuth || mongoose.model('BaileysAuth', new mongoose.Schema({}, { strict: false }));
AuthModel.countDocuments({}).then(count => {
    if (count > 0) {
        console.log('\n🔍 Found existing session in MongoDB. Auto-initializing...');
        connectToWhatsApp();
    } else {
        console.log('\n🔍 No existing session found. Waiting for Connect signal from frontend...');
        isIdle = true;
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Standalone WhatsApp Microservice running on port ${PORT} (Powered by Baileys + MongoDB)`);
});
