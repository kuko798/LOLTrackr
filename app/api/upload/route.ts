import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { uploadToGCS, uploadFileToGCS } from '@/lib/storage';
import { processVideo } from '@/lib/videoProcessor';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('video') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        if (!file || !title) {
            return NextResponse.json(
                { error: 'Video and title are required' },
                { status: 400 }
            );
        }

        // Create upload directory
        const uploadsDir = path.join(process.cwd(), 'tmp', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Save file temporarily
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name}`;
        const filepath = path.join(uploadsDir, filename);
        await writeFile(filepath, buffer);

        // Upload original to GCS
        const userId = session.user.id;
        const gcsPath = `${userId}/originals/${filename}`;
        const uploadResult = await uploadFileToGCS(filepath, gcsPath);

        // Create database record
        const video = await prisma.video.create({
            data: {
                userId: session.user.id,
                title,
                description: description || '',
                originalVideoUrl: uploadResult.publicUrl, // Corrected from fileUrl
                processingStatus: 'pending'
            }
        });

        // Trigger background processing (async)
        // Note: In production, use a job queue like Bull or Inngest
        processVideoInBackground(video.id, filepath, title, userId).catch(console.error);

        // Clean up original file after a delay
        setTimeout(async () => {
            try {
                if (fs.existsSync(filepath)) {
                    await unlink(filepath);
                }
            } catch (err) {
                console.error('Cleanup error:', err);
            }
        }, 5000);

        return NextResponse.json({
            message: 'Upload successful, processing started',
            videoId: video.id,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}

async function processVideoInBackground(
    videoId: string,
    videoPath: string,
    title: string,
    userId: string
) {
    try {
        // Update status to processing
        await prisma.video.update({
            where: { id: videoId },
            data: { processingStatus: 'processing' }
        });

        // Process video with AI
        const result = await processVideo({
            videoPath,
            videoTitle: title,
            userId,
            videoId,
        });

        // Upload processed files to GCS
        const processedGcsPath = `${userId}/processed/${videoId}.mp4`;
        const thumbnailGcsPath = `${userId}/thumbnails/${videoId}.jpg`;

        const [processedUpload, thumbnailUpload] = await Promise.all([
            uploadFileToGCS(result.processedVideoPath, processedGcsPath),
            uploadFileToGCS(result.thumbnailPath, thumbnailGcsPath),
        ]);

        // Update video record
        await prisma.video.update({
            where: { id: videoId },
            data: {
                processedVideoUrl: processedUpload.publicUrl,
                thumbnailUrl: thumbnailUpload.publicUrl,
                generatedAudioText: result.audioScript,
                duration: result.duration,
                processingStatus: 'completed',
            }
        });

        // Clean up temporary files
        if (fs.existsSync(result.processedVideoPath)) {
            await unlink(result.processedVideoPath);
        }
        if (fs.existsSync(result.thumbnailPath)) {
            await unlink(result.thumbnailPath);
        }

        console.log(`Video ${videoId} processed successfully`);
    } catch (error) {
        console.error(`Video processing error for ${videoId}:`, error);

        // Mark as failed
        await prisma.video.update({
            where: { id: videoId },
            data: { processingStatus: 'failed' }
        });
    }
}
