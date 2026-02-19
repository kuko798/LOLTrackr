import { Storage } from '@google-cloud/storage';

let bucketInstance: ReturnType<Storage['bucket']> | null = null;

function getStorageClient(): Storage {
    const projectId = process.env.GCP_PROJECT_ID;
    const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
    const serviceAccountBase64 = process.env.GCP_SERVICE_ACCOUNT_BASE64;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountJson) {
        return new Storage({
            projectId,
            credentials: JSON.parse(serviceAccountJson),
        });
    }

    if (serviceAccountBase64) {
        return new Storage({
            projectId,
            credentials: JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')),
        });
    }

    if (clientEmail && privateKey) {
        return new Storage({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });
    }

    if (keyFilename) {
        return new Storage({
            projectId,
            keyFilename,
        });
    }

    return new Storage({ projectId });
}

function getBucket() {
    if (bucketInstance) {
        return bucketInstance;
    }

    const bucketName = process.env.GCP_BUCKET_NAME || 'loltrackr-videos';
    const storage = getStorageClient();
    bucketInstance = storage.bucket(bucketName);
    return bucketInstance;
}

function getBucketName() {
    return process.env.GCP_BUCKET_NAME || 'loltrackr-videos';
}

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
    const bucket = getBucket();
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
            // Object ACL updates fail when Uniform Bucket-Level Access is enabled.
            if (process.env.GCP_ENABLE_OBJECT_ACL === 'true') {
                await blob.makePublic();
            }

            const publicUrl = `https://storage.googleapis.com/${getBucketName()}/${destination}`;

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
    const bucket = getBucket();
    const uploadOptions: any = {
        destination,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    };

    // Try to make file publicly readable during upload
    try {
        uploadOptions.predefinedAcl = 'publicRead';
    } catch (e) {
        console.warn('Could not set predefinedAcl, bucket might have uniform access:', e);
    }

    await bucket.upload(filePath, uploadOptions);

    // Also try makePublic as a fallback
    if (process.env.GCP_ENABLE_OBJECT_ACL === 'true') {
        try {
            const file = bucket.file(destination);
            await file.makePublic();
        } catch (e) {
            console.warn('Could not make file public via ACL:', e);
        }
    }

    const publicUrl = `https://storage.googleapis.com/${getBucketName()}/${destination}`;

    return {
        publicUrl,
        filename: destination,
    };
}

/**
 * Delete a file from GCS
 */
export async function deleteFromGCS(filename: string): Promise<void> {
    const bucket = getBucket();
    await bucket.file(filename).delete();
}

/**
 * Generate a signed URL for temporary access
 */
export async function getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    const bucket = getBucket();
    const [url] = await bucket.file(filename).getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
    });

    return url;
}
