import mongoose from 'mongoose';
import fs from 'fs';

let bucket = null;

export function getGridFSBucket() {
  if (!bucket && mongoose.connection?.db) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });
  }
  return bucket;
}

/**
 * Persist an uploaded file from disk into MongoDB GridFS.
 * Ensures uploaded files survive server restarts and ephemeral cloud container rebuilds (like Render).
 */
export async function saveFileToGridFS(filename, localFilePath, mimeType) {
  try {
    const gfs = getGridFSBucket();
    if (!gfs || !fs.existsSync(localFilePath)) return;

    return new Promise((resolve, reject) => {
      const uploadStream = gfs.openUploadStream(filename, {
        contentType: mimeType || 'application/octet-stream',
      });

      fs.createReadStream(localFilePath)
        .pipe(uploadStream)
        .on('error', (err) => {
          console.warn(`[GridFS] Error streaming file to GridFS (${filename}):`, err.message);
          reject(err);
        })
        .on('finish', resolve);
    });
  } catch (err) {
    console.warn(`[GridFS] Failed to persist ${filename} to GridFS:`, err.message);
  }
}

/**
 * Delete a file from MongoDB GridFS by its filename.
 */
export async function deleteFileFromGridFS(filename) {
  try {
    const gfs = getGridFSBucket();
    if (!gfs) return;

    const files = await gfs.find({ filename }).toArray();
    for (const file of files) {
      await gfs.delete(file._id).catch(() => {});
    }
  } catch (err) {
    console.warn(`[GridFS] Failed to delete ${filename} from GridFS:`, err.message);
  }
}
