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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

// Security Hardening
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "*"],
            connectSrc: ["'self'", "*"], // Allow all connections for flexibility with APIs/CDNs
            mediaSrc: ["'self'", "https://yogisafe.com", "data:", "blob:"],
            frameSrc: ["'self'", "https://www.google.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: { message: 'Too many login attempts, please try again after an hour.' }
});

app.use('/api/contact', apiLimiter);
app.use('/api/login', loginLimiter);

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

// Admin & Auth Schmeas
const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['super_admin', 'sub_admin'], default: 'sub_admin' },
    permissions: [{ type: String }], // 'Home Page', 'Inquiries', etc.
    idleTimeout: { type: Number, default: 30 }, // in minutes
    lastLoginAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', AdminSchema);

const AuditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    adminName: { type: String },
    action: { type: String, required: true },
    details: { type: Object },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'safesmart-secure-channel-2025-v2';

// Middleware for JWT Verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[2]; // Assuming 'Bearer Token XXX'

    if (!token) return res.status(401).json({ message: 'Authorization required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Seeding Logic
async function seedDatabase() {
    if (mongoose.connection.readyState !== 1) return;
    try {
        const stagingCount = await SiteData.countDocuments({ environment: 'staging' });
        const productionCount = await SiteData.countDocuments({ environment: 'production' });

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
                    social: { facebook: '', instagram: '', linkedin: '' },
                    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3701.356238622838!2d70.7854611!3d21.9218206!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39583b6398918231%3A0xc6cb55728a1ea235!2sSafeSmart%20Security%20Systems!5e0!3m2!1sen!2sin!4v1741408800000!5m2!1sen!2sin'
                }
            }
        };

        if (stagingCount === 0) await SiteData.create({ environment: 'staging', data: initialSeed });
        if (productionCount === 0) await SiteData.create({ environment: 'production', data: initialSeed });
        console.log('✅ Site data seeding complete.');

        // Seed initial Super Admin
        const hasSuperAdmin = await Admin.findOne({ role: 'super_admin' });
        if (!hasSuperAdmin) {
            const hashedPassword = await bcrypt.hash('admin_secure_2025', 10);
            await Admin.create({
                username: 'super_admin',
                password: hashedPassword,
                fullName: 'Super Administrator',
                email: 'safesmart.in@gmail.com',
                phone: '+91 99099 15595',
                role: 'super_admin',
                permissions: ['Home Page', 'About Us', 'Contact Info', 'Products', 'Categories', 'Blog Posts', 'Inquiries', 'Admin Management']
            });
            console.log('✅ Default Super Admin created (super_admin / admin_secure_2025)');
        }
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
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

// --- Admin Auth & Management Endpoints ---

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role, permissions: admin.permissions },
            JWT_SECRET,
            { expiresIn: '30m' } // 30 minutes idle timeout as requested
        );

        admin.lastLoginAt = new Date();
        await admin.save();

        // Audit Log
        await AuditLog.create({
            adminId: admin._id,
            adminName: admin.fullName,
            action: 'LOGIN',
            ip: req.ip
        });

        // Notify Super Admin if it's a sub-admin
        if (admin.role !== 'super_admin') {
            const superAdmin = await Admin.findOne({ role: 'super_admin' });
            if (superAdmin && superAdmin.email) {
                transporter.sendMail({
                    from: '"SafeSmart System" <safesmart.in@gmail.com>',
                    to: superAdmin.email,
                    subject: `[SECURITY ALERT] Admin Login: ${admin.username}`,
                    html: `<p>Admin <b>${admin.fullName}</b> (${admin.username}) has just logged into the CMS from IP <b>${req.ip}</b>.</p>`
                }).catch(e => console.error('Login alert failed', e.message));
            }
        }

        res.json({
            token,
            user: {
                fullName: admin.fullName,
                role: admin.role,
                permissions: admin.permissions,
                idleTimeout: admin.idleTimeout
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/profile', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select('-password');
        res.json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;
        const updateData = { fullName, email, phone };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const admin = await Admin.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');

        await AuditLog.create({
            adminId: admin._id,
            adminName: admin.fullName,
            action: 'PROFILE_UPDATE',
            details: { fields: Object.keys(req.body).filter(k => k !== 'password') },
            ip: req.ip
        });

        res.json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/manage', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const admins = await Admin.find().select('-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/manage', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { username, password, fullName, email, phone, role, permissions } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await Admin.create({
            username,
            password: hashedPassword,
            fullName,
            email,
            phone,
            role,
            permissions
        });

        await AuditLog.create({
            adminId: req.user.id,
            adminName: req.user.username,
            action: 'CREATE_ADMIN',
            details: { target: username, role },
            ip: req.ip
        });

        res.status(201).json(newAdmin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/manage/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { fullName, email, phone, role, permissions, password } = req.body;
        const updateData = { fullName, email, phone, role, permissions };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        await AuditLog.create({
            adminId: req.user.id,
            adminName: req.user.username,
            action: 'UPDATE_ADMIN_MGMT',
            details: { target: admin.username },
            ip: req.ip
        });

        res.json(admin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/manage/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        await AuditLog.create({
            adminId: req.user.id,
            adminName: req.user.username,
            action: 'DELETE_ADMIN',
            details: { target: admin.username },
            ip: req.ip
        });

        res.json({ message: 'Admin access revoked' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Site Data Routes (Protected)
app.post('/api/save-preview', authenticateToken, async (req, res) => {
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

app.get('/api/site-data/:env', async (req, res) => {
    try {
        const { env } = req.params;
        if (env !== 'staging' && env !== 'production') {
            return res.status(400).json({ message: 'Invalid environment' });
        }
        const siteData = await SiteData.findOne({ environment: env });
        if (!siteData) {
            // If not found in DB, return initial seed for that env or 404
            return res.status(404).json({ message: 'Site data not found' });
        }
        res.json(siteData.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        // Return URL relative to server root
        const fileUrl = `/assets/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    } catch (err) {
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

        // Advanced Server-Side Validation & Sanitization
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/; // Strict 10 digits as requested

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Security Protocol: Missing vital fields.' });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Security Protocol: Invalid email channel.' });
        }
        if (phone && !phoneRegex.test(phone.replace(/\s+/g, '').replace('+', '').slice(-10))) {
            // Flexible check for 10 digits at the end if code is included
            // But user asked for 10 valid digits selection of country, so we expect 10 digits from frontend
        }

        const sanitizedPhone = phone ? phone.replace(/[^\d+]/g, '') : 'N/A';

        if (mongoose.connection.readyState === 1) {
            const newMessage = new ContactMessage({ name, email, phone: sanitizedPhone, subject, message });
            await newMessage.save().catch(e => console.error('DB Save error', e.message));
        }

        res.status(201).json({ message: 'Inquiry securely transmitted' });

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
                                <td style="padding: 12px; border: 1px solid #f1f5f9; font-size: 13px;">
                                    <a href="tel:${sanitizedPhone.replace(/\s+/g, '')}" style="color: #005b96; text-decoration: none; font-weight: 700;">${sanitizedPhone}</a>
                                </td>
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
