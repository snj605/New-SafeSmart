import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dns from 'dns';

// Force IPv4 for SMTP compatibility on networks with broken IPv6
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
import multer from 'multer';
import cron from 'node-cron';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure paths
// Serve static files exclusively from the root of the 'dist' directory as expected by Hostinger and local setups
const distPath = path.join(__dirname, 'dist');
console.log('📂 Serving static files strictly from:', distPath);

// Multer Storage: saves uploaded images to dist/assets/uploads
const uploadDir = path.join(distPath, 'assets', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `img_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage: multerStorage, limits: { fileSize: 10 * 1024 * 1024 } });

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
    status: { type: String, enum: ['New', 'Contacted', 'Resolved'], default: 'New' },
    lastFollowUpAt: { type: Date, default: null },
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

// Image Upload Route
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
    const publicUrl = `/assets/uploads/${req.file.filename}`;
    console.log('✅ Image uploaded:', publicUrl);
    res.json({ url: publicUrl });
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

app.get('/api/inquiries', async (req, res) => {
    try {
        const inquiries = await ContactMessage.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/inquiries/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const inquiry = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status, lastFollowUpAt: Date.now() },
            { new: true }
        );
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
        res.json(inquiry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/inquiries/:id', async (req, res) => {
    try {
        const inquiry = await ContactMessage.findByIdAndDelete(req.params.id);
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
        res.json({ message: 'Inquiry deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inquiries/batch', async (req, res) => {
    try {
        const { ids, operation, status } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        if (operation === 'delete') {
            await ContactMessage.deleteMany({ _id: { $in: ids } });
            return res.json({ message: `${ids.length} inquiries deleted` });
        } else if (operation === 'updateStatus') {
            await ContactMessage.updateMany(
                { _id: { $in: ids } },
                { status, lastFollowUpAt: Date.now() }
            );
            return res.json({ message: `${ids.length} inquiries updated to ${status}` });
        }

        res.status(400).json({ message: 'Invalid operation' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'safesmart.in@gmail.com',
        pass: 'yths xpzv deoi yhni'
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
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
            from: '"SafeSmart System" <safesmart.in@gmail.com>',
            to: 'safesmart.in@gmail.com',
            subject: subject ? `[NEW INQUIRY] ${subject}` : `New Lead: ${name}`,
            html: `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
                <div style="background-color: #011f4b; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">New Security Inquiry</h1>
                    <p style="color: #60a5fa; margin: 10px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em;">SafeSmart Management Engine</p>
                </div>
                
                <div style="padding: 40px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
                    <div style="margin-bottom: 30px;">
                        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Contact Details</span>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 12px; border: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 13px; font-weight: 700; width: 30%;">Name</td>
                                <td style="padding: 12px; border: 1px solid #f1f5f9; font-size: 13px; color: #1e293b;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 13px; font-weight: 700;">Email</td>
                                <td style="padding: 12px; border: 1px solid #f1f5f9; font-size: 13px;"><a href="mailto:${email}" style="color: #005b96; text-decoration: none;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 13px; font-weight: 700;">Phone</td>
                                <td style="padding: 12px; border: 1px solid #f1f5f9; font-size: 13px; color: #1e293b;">${phone || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Inquiry Subject</span>
                        <div style="padding: 15px; background-color: #011f4b; color: #ffffff; border-radius: 8px; font-size: 14px; font-weight: 700;">
                            ${subject || 'General Information'}
                        </div>
                    </div>

                    <div>
                        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Message</span>
                        <div style="padding: 20px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; color: #334155; line-height: 1.6; border-left: 4px solid #005b96;">
                            ${message}
                        </div>
                    </div>
                </div>

                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 500;">
                    &copy; ${new Date().getFullYear()} SafeSmart Security Systems. All rights reserved.
                </div>
            </div>
            `
        };

        const clientMailOptions = {
            from: '"SafeSmart Security" <safesmart.in@gmail.com>',
            to: email,
            subject: `We've Received Your Inquiry - SafeSmart Security`,
            html: `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
                <div style="background-color: #011f4b; padding: 50px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Thank You, ${name}</h1>
                    <p style="color: #60a5fa; margin: 10px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em;">Inquiry Successfully Transmitted</p>
                </div>
                
                <div style="padding: 40px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 25px;">
                        Hello <strong>${name}</strong>,<br><br>
                        Thank you for reaching out to <strong>SafeSmart Security</strong>. We have received your inquiry regarding "<em>${subject || 'our security solutions'}</em>" and our team is already reviewing your requirements.
                    </p>

                    <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 30px; text-align: left;">
                        <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #011f4b; text-transform: uppercase; letter-spacing: 0.05em;">What's Next?</h4>
                        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                            One of our security consultants will contact you within <strong>24 business hours</strong> to provide more information.
                        </p>
                    </div>

                    <p style="font-size: 13px; color: #94a3b8;">
                        If you need immediate assistance, feel free to call us at <a href="tel:+919909915595" style="color: #005b96; text-decoration: none; font-weight: 700;">+91 99099 15595</a>.
                    </p>
                </div>

                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 500;">
                    SafeSmart Security Systems • 16 Yogi Nagar, Gondal, Gujarat
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

// --- Scheduled Tasks (Cron Jobs) ---

const sendInquiryReminder = async (type) => {
    try {
        if (mongoose.connection.readyState !== 1) return;

        const pendingInquiries = await ContactMessage.find({
            status: { $in: ['New', 'Contacted'] }
        }).sort({ createdAt: -1 });

        if (pendingInquiries.length === 0) {
            console.log(`[CRON] ${type}: No pending inquiries to report.`);
            return;
        }

        const title = type === 'MORNING' ? 'Morning Security BriefING' : 'Evening Performance Review';
        const subtitle = type === 'MORNING' ? 'Pending inquiries awaiting action' : 'Summary of unresolved inquiries for today';

        const inquiryListHtml = pendingInquiries.map(i => `
            <div style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">${i.name} - <span style="color: #005b96;">${i.status}</span></p>
                <p style="margin: 5px 0; font-size: 12px; color: #64748b;">${i.subject || 'General'}</p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">Received: ${new Date(i.createdAt).toLocaleString()}</p>
            </div>
        `).join('');

        const mailOptions = {
            from: '"SafeSmart System" <safesmart.in@gmail.com>',
            to: 'safesmart.in@gmail.com',
            subject: `[SYSTEM] ${title} - ${pendingInquiries.length} Pending`,
            html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                <div style="background-color: #011f4b; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">${title}</h1>
                    <p style="color: #60a5fa; margin: 5px 0 0; font-size: 11px; text-transform: uppercase;">${subtitle}</p>
                </div>
                <div style="background-color: #ffffff; padding: 20px;">
                    ${inquiryListHtml}
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f1f5f9;">
                    <a href="https://yogisafe.com/admin" style="background-color: #011f4b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase;">Open Admin Command Center</a>
                </div>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[CRON] ${type} Reminder Sent: ${pendingInquiries.length} inquiries.`);
    } catch (err) {
        console.error(`[CRON] ${type} Error:`, err.message);
    }
};

// 11:00 AM Reminder (Every day)
cron.schedule('0 11 * * *', () => {
    console.log('[CRON] Executing 11 AM Morning Reminder...');
    sendInquiryReminder('MORNING');
}, { timezone: "Asia/Kolkata" });

// 05:00 PM Summary (Every day)
cron.schedule('0 17 * * *', () => {
    console.log('[CRON] Executing 5 PM Evening Summary...');
    sendInquiryReminder('EVENING');
}, { timezone: "Asia/Kolkata" });

// Catchall for SPA
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Standalone Server running on port ${PORT}`));
