const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json({ limit: '50mb' }));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
    }
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('\n======================================================');
    console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP LINKED DEVICES:');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp Client is READY and CONNECTED!\n');
});

client.on('auth_failure', msg => {
    console.error('❌ Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Client was disconnected:', reason);
});

client.initialize();

// This endpoint exactly matches what the GymOS server expects
app.post('/send', async (req, res) => {
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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 Standalone WhatsApp Microservice running on port ${PORT}`);
    console.log('Waiting for WhatsApp to initialize...\n');
});
