import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced dist path resolution for different environments
const getDistPath = () => {
    // Configure paths
    // In local dev, dist is in project root. On Hostinger, files might be in public_html itself
    const paths = [
        path.join(__dirname, 'dist', 'browser'), // Note: Angular 17+ Application builder outputs to browser/ by default even if outputPath is just 'dist'
        path.join(__dirname, 'dist'),
        path.join(__dirname, 'browser')
    ];
    for (const p of paths) {
        if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
            return p;
        }
    }
    return paths[0]; // fallback
};

const distPath = getDistPath();
console.log('📂 Serving static files from:', distPath);

app.use(express.static(distPath));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
console.log('📡 Environment Check:');
console.log('- __dirname:', __dirname);
console.log('- process.cwd():', process.cwd());
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);

if (!MONGO_URI) {
    console.error('❌ CRITICAL ERROR: MONGO_URI is not defined in environment variables');
    console.log('Current Env Keys:', Object.keys(process.env).filter(k => !k.includes('PASS') && !k.includes('KEY')));
} else {
    console.log('Attempting to connect to MongoDB with URI starting with:', MONGO_URI.substring(0, 20) + '...');
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4,
  })
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch((err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
        console.error('Full Error:', err);
    });
}

// Schema for Site Data
const SiteDataSchema = new mongoose.Schema({
    environment: { type: String, enum: ['staging', 'production'], required: true, unique: true },
    data: { type: Object, required: true },
    updatedAt: { type: Date, default: Date.now }
});

const SiteData = mongoose.model('SiteData', SiteDataSchema);

// Seeding Logic
async function seedDatabase() {
    if (mongoose.connection.readyState !== 1) return;
    try {
        const stagingCount = await SiteData.countDocuments({ environment: 'staging' });
        const productionCount = await SiteData.countDocuments({ environment: 'production' });

        if (stagingCount === 0 || productionCount === 0) {
            console.log('Database empty. Seeding initial data...');
            const initialSeed = {
                categories: [],
                products: [],
                blogs: [],
                content: {
                    home: {
                        hero: { slides: [] },
                        welcome: { title: 'SafeSmart Security', subtitle: 'Ultimate Protection Systems' },
                        intro: { title: 'Redefining Security', description: '' },
                        trust: { title: 'Certified Excellence', badges: [] },
                        whyChooseUs: { title: 'Why Choose Us?', features: [] }
                    },
                    about: { heroTitle: 'Our Heritage', heroSubtitle: 'Forged in Integrity', content: '', title: '', subtitle: '' },
                    contact: {
                        email: 'safesmart.in@gmail.com',
                        phone: '+91 99099 15595',
                        whatsapp: '919909915595',
                        address: '16 - Yogi Nagar, Gondal, Gujarat',
                        social: { facebook: '', instagram: '', linkedin: '' }
                    }
                }
            };

            if (stagingCount === 0) await SiteData.create({ environment: 'staging', data: initialSeed });
            if (productionCount === 0) await SiteData.create({ environment: 'production', data: initialSeed });
            console.log('Seeding complete.');
        }
    } catch (err) {
        console.error('Seeding error:', err.message);
    }
}

mongoose.connection.on('connected', seedDatabase);

// Schema for Contact Messages
const ContactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: false },
    subject: { type: String, required: false },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ContactMessage = mongoose.model('ContactMessage', ContactMessageSchema);

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        distFound: fs.existsSync(distPath),
        env: {
            hasMongoUri: !!process.env.MONGO_URI,
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT
        }
    });
});

// API Routes
app.get('/api/site-data/:env', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database not available' });
    }
    try {
        const doc = await SiteData.findOne({ environment: req.params.env }).maxTimeMS(2000);
        if (!doc) return res.status(404).json({ message: 'No data found' });
        res.json(doc.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/save-preview', async (req, res) => {
    try {
        const { data } = req.body;
        console.log('Updating Staging data...');
        await SiteData.findOneAndUpdate(
            { environment: 'staging' },
            { data, updatedAt: Date.now() },
            { upsert: true }
        );
        res.json({ message: 'Preview updated successfully' });
    } catch (err) {
        console.error('SAVE-PREVIEW ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/deploy', async (req, res) => {
    try {
        console.log('Deploying Staging -> Production...');
        const staging = await SiteData.findOne({ environment: 'staging' });
        if (!staging) return res.status(400).json({ message: 'No staging data' });

        await SiteData.findOneAndUpdate(
            { environment: 'production' },
            { data: staging.data, updatedAt: Date.now() },
            { upsert: true }
        );
        res.json({ message: 'Deployed successfully' });
    } catch (err) {
        console.error('DEPLOY ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: (parseInt(process.env.SMTP_PORT) || 465) === 465,
    auth: {
        user: 'safesmart.in@gmail.com',
        pass: 'yths xpzv deoi yhni'
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    family: 4
});

transporter.verify((error) => {
    if (error) console.warn('⚠️ SMTP Warning:', error.message);
    else console.log('✅ SMTP Ready');
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ message: 'Missing fields' });

        if (mongoose.connection.readyState === 1) {
            const newMessage = new ContactMessage({ name, email, phone, subject, message });
            await newMessage.save().catch(e => console.error('DB Save error', e.message));
        }

        res.status(201).json({ message: 'Inquiry received' });

        const adminMailOptions = {
            from: '"Safe Smart Contact" <safesmart.in@gmail.com>',
            to: 'safesmart.in@gmail.com',
            subject: subject ? `[SECURITY INQUIRY] ${subject}` : `New Inquiry from ${name}`,
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 20px 50px rgba(0,0,0,0.1);">
                <div style="background-color: #030405; padding: 50px 40px; text-align: center; border-bottom: 4px solid #61FF00;">
                    <div style="color: #61FF00; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5em; margin-bottom: 12px;">Security Protocol Activated</div>
                    <h1 style="color: #ffffff; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase; font-size: 28px; letter-spacing: -0.02em;">New System Inquiry</h1>
                </div>
                
                <div style="padding: 40px; background-color: #ffffff;">
                    <div style="margin-bottom: 35px; border-left: 4px solid #61FF00; padding-left: 20px;">
                        <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 6px;">Lead Identification</span>
                        <div style="font-size: 22px; font-weight: 900; color: #030405; font-style: italic;">${name}</div>
                    </div>

                    <div style="display: grid; gap: 20px; margin-bottom: 35px;">
                        <div style="background-color: #f9fafb; padding: 25px; border-radius: 20px; border: 1px solid #f3f4f6; display: block;">
                            <span style="font-size: 9px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Digital Credentials</span>
                            <a href="mailto:${email}" style="color: #030405; font-weight: 700; text-decoration: none; font-size: 15px;">${email}</a>
                        </div>
                        <div style="background-color: #f9fafb; padding: 25px; border-radius: 20px; border: 1px solid #f3f4f6; display: block;">
                            <span style="font-size: 9px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Direct Communication</span>
                            <a href="tel:${phone ? phone.replace(/\s+/g, '') : ''}" style="display: inline-flex; align-items: center; background-color: #61FF00; color: #030405; padding: 10px 20px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
                                <span style="margin-right: 8px;">📞</span> ${phone || 'N/A'}
                            </a>
                        </div>
                    </div>

                    <div style="background-color: #030405; padding: 35px; border-radius: 24px; color: #ffffff; margin-bottom: 10px;">
                        <span style="font-size: 9px; font-weight: 900; color: #61FF00; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 12px;">Strategic Subject</span>
                        <div style="font-weight: 900; margin-bottom: 20px; font-size: 18px; font-style: italic;">${subject || 'General Security Inquiry'}</div>
                        
                        <div style="height: 1px; background-color: rgba(255,255,255,0.1); margin-bottom: 20px;"></div>

                        <span style="font-size: 9px; font-weight: 900; color: #61FF00; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 12px;">Message Content</span>
                        <div style="font-size: 15px; color: #d1d5db; line-height: 1.7; font-weight: 500;">${message}</div>
                    </div>
                </div>

                <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #9ca3af; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em; border-top: 1px solid #f3f4f6;">
                    SafeSmart Security Systems • Internal Intelligence
                </div>
            </div>
            `
        };

        const clientMailOptions = {
            from: '"SafeSmart Security" <safesmart.in@gmail.com>',
            to: email,
            subject: `Thank You for Contacting SafeSmart Security`,
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 20px 50px rgba(0,0,0,0.1);">
                <div style="background-color: #030405; padding: 50px 40px; text-align: center; border-bottom: 4px solid #61FF00;">
                    <div style="color: #61FF00; font-size: 11px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5em; margin-bottom: 12px;">Transmission Received</div>
                    <h1 style="color: #ffffff; margin: 0; font-style: italic; font-weight: 900; text-transform: uppercase; font-size: 28px; letter-spacing: -0.02em;">We Hear You Loud & Clear</h1>
                </div>
                
                <div style="padding: 40px; background-color: #ffffff; text-align: center;">
                    <div style="font-size: 20px; font-weight: 800; color: #030405; margin-bottom: 20px;">Hello ${name},</div>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.8; margin-bottom: 30px; font-weight: 500;">
                        Thank you for reaching out to **SafeSmart Security Systems**. Your inquiry regarding <span style="color: #030405; font-weight: 800;">"${subject || 'our security products'}"</span> has been securely received by our engineering team.
                    </p>

                    <div style="background-color: #f9fafb; padding: 30px; border-radius: 24px; border: 1px solid #f3f4f6; margin-bottom: 35px;">
                        <h4 style="margin: 0 0 15px 0; color: #030405; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; font-weight: 900;">Next Security Steps</h4>
                        <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.6;">
                            Our security experts are currently analyzing your requirements. You can expect a professional response via your encrypted email or provided voice line (${phone || email}) within the next <span style="color: #030405; font-weight: 800;">24 business hours</span>.
                        </p>
                    </div>

                    <a href="https://safesmart.in" style="display: inline-block; background-color: #030405; color: #61FF00; padding: 18px 40px; border-radius: 15px; font-weight: 900; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; transition: all 0.3s ease;">
                        Explore Our Full Range
                    </a>
                </div>

                <div style="background-color: #030405; padding: 40px; text-align: center; color: #ffffff;">
                    <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em; color: #61FF00; margin-bottom: 15px;">SafeSmart Security</div>
                    <p style="font-size: 12px; color: #9ca3af; margin: 0; font-weight: 500;">16 - Yogi Nagar, Opp. Railway Track,<br>Gondal - 360 311, Gujarat (India)</p>
                    <div style="margin-top: 20px; font-size: 14px; font-weight: 800;">
                        <span style="color: #61FF00;">•</span> Professional <span style="color: #61FF00;">•</span> Certified <span style="color: #61FF00;">•</span> Secure
                    </div>
                </div>
            </div>
            `
        };

        transporter.sendMail(adminMailOptions).catch(e => console.error('Admin Email error', e.message));
        transporter.sendMail(clientMailOptions).catch(e => console.error('Client Email error', e.message));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Catchall for SPA
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Standalone Server running on port ${PORT}`));
