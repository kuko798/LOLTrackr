import { Storage } from '@google-cloud/storage';
import path from 'path';

// Initialize GCP Storage client
const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucketName = process.env.GCP_BUCKET_NAME || 'loltrackr-videos';
const bucket = storage.bucket(bucketName);

export interface UploadResult {
    publicUrl: string;
    filename: string;
}

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadToGCS(
    file: Buffer,
    destination: string,
    contentType?: string
): Promise<UploadResult> {
    const blob = bucket.file(destination);

    const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
            contentType: contentType || 'video/mp4',
        },
    });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', async () => {
            // Make the file public (optional - you can use signed URLs instead)
            await blob.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

            resolve({
                publicUrl,
                filename: destination,
            });
        });

        blobStream.end(file);
    });
}

/**
 * Upload a local file to GCS
 */
export async function uploadFileToGCS(
    filePath: string,
    destination: string
): Promise<UploadResult> {
    await bucket.upload(filePath, {
        destination,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });

    const file = bucket.file(destination);
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

    return {
        publicUrl,
        filename: destination,
    };
}

/**
 * Delete a file from GCS
 */
export async function deleteFromGCS(filename: string): Promise<void> {
    await bucket.file(filename).delete();
}

/**
 * Generate a signed URL for temporary access
 */
export async function getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    const [url] = await bucket.file(filename).getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
    });

    return url;
}
