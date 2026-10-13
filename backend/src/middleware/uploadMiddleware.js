import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved path to uploads directory in backend/uploads
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed image MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
]);

// Allowed extensions
const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.png';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const mimeType = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_MIME_TYPES.has(mimeType) || ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    const err = new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WebP, SVG, BMP) are allowed.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 1,
  },
});

/**
 * Express middleware wrapper to handle multer errors gracefully for image uploads.
 */
export function handleImageUpload(req, res, next) {
  const singleUpload = upload.single('image');

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image file size exceeds the 10MB limit' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
}

// Storage for generic file uploads (supports ANY file extension like WhatsApp files)
const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = /^\.[a-z0-9_-]{1,16}$/i.test(rawExt) ? rawExt : '';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `file-${uniqueSuffix}${safeExt}`);
  },
});

const genericFileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit for LAN file transfers
    files: 1,
  },
});

/**
 * Express middleware to handle generic document and file uploads of any extension.
 * Supports field name 'file', 'attachment', or 'image'.
 */
export function handleFileUpload(req, res, next) {
  const uploadHandler = genericFileUpload.any();

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds the 100MB limit' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }

    // Populate req.file from req.files for controller compatibility
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }

    next();
  });
}

/**
 * Safely delete an uploaded file from backend/uploads disk storage.
 * @param {string} relativeUrl E.g. "/uploads/file-1234.pdf"
 */
export function deleteUploadedFile(relativeUrl) {
  if (!relativeUrl || typeof relativeUrl !== 'string') return;
  try {
    const fileName = path.basename(relativeUrl);
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`[File Cleanup] Could not delete file ${relativeUrl}:`, err.message);
  }
}
