import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import { getHealth } from './controllers/networkController.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { getGridFSBucket } from './utils/gridfs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const app = express();

// Security HTTP headers — allow cross-origin resource requests for shared media/images across LAN
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Dynamic CORS configuration supporting localhost, 127.0.0.1, and LAN IP addresses
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((u) => u.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Check configured origins, local development, or cloud deployment domains
      const isAllowed =
        clientUrls.includes('*') ||
        clientUrls.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.netlify.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files - with disk + MongoDB GridFS fallback and ?download=1 support
app.get('/uploads/:filename', async (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, filename);
  const isDownload = req.query.download === '1' || req.query.download === 'true';
  const downloadName = req.query.name ? path.basename(req.query.name) : filename;

  const safeAsciiName = downloadName.replace(/["\\]/g, '_').replace(/[^\x20-\x7E]/g, '_');
  const encodedName = encodeURIComponent(downloadName);

  // 1. If present on disk, serve or download directly
  if (fs.existsSync(filePath)) {
    if (isDownload) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
      );
      return res.sendFile(filePath);
    }
    return next(); // Let express.static handle inline serving
  }

  // 2. If not on local disk (e.g. Render restart/redeploy wiped ephemeral disk), stream from MongoDB GridFS
  try {
    const gfs = getGridFSBucket();
    if (gfs) {
      const files = await gfs.find({ filename }).toArray();
      if (files.length > 0) {
        const fileDoc = files[0];
        if (isDownload) {
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
          );
        } else {
          res.setHeader('Content-Disposition', 'inline');
          if (fileDoc.contentType) {
            res.setHeader('Content-Type', fileDoc.contentType);
          }
        }
        res.setHeader('Content-Length', fileDoc.length);

        // Re-cache to local disk in background
        const downloadStream = gfs.openDownloadStreamByName(filename);
        const diskCacheStream = fs.createWriteStream(filePath);
        downloadStream.pipe(diskCacheStream).on('error', () => {});

        // Stream file content directly to client response
        const clientStream = gfs.openDownloadStreamByName(filename);
        return clientStream.pipe(res);
      }
    }
  } catch (err) {
    console.warn(`[Upload Stream] Error reading ${filename} from GridFS:`, err.message);
  }

  next();
});

// Serve uploaded media files statically (for inline viewing in browser)
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', getHealth);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/network', networkRoutes);

// 404 & Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);
