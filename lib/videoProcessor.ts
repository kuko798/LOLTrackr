import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

function configureFfmpegPath() {
    if (process.env.FFMPEG_PATH) {
        ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
        return;
    }

    try {
        // Optional dependency can be missing in some build environments.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const installer = require('@ffmpeg-installer/ffmpeg');
        if (installer?.path) {
            ffmpeg.setFfmpegPath(installer.path);
        }
    } catch {
        // Fall back to system ffmpeg in PATH if present.
    }
}

configureFfmpegPath();

function getLocalAiBaseUrl() {
    return process.env.LOCAL_AI_BASE_URL || '';
}

/**
 * Generate brain rot commentary using local AI service
 */
export async function generateBrainRotScript(videoTitle: string): Promise<string> {
    const localAiBaseUrl = getLocalAiBaseUrl();
    if (!localAiBaseUrl) {
        throw new Error('LOCAL_AI_BASE_URL is required. OpenAI fallback is disabled.');
    }

    const response = await fetch(`${localAiBaseUrl}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoTitle }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Local script generation failed: ${body || response.statusText}`);
    }

    const data = await response.json();
    if (!data?.script || typeof data.script !== 'string') {
        throw new Error('Local script generation returned invalid response');
    }

    return data.script;
}

/**
 * Generate audio from text using local AI TTS
 */
export async function generateAudio(text: string, outputPath: string): Promise<string> {
    const localAiBaseUrl = getLocalAiBaseUrl();
    if (!localAiBaseUrl) {
        throw new Error('LOCAL_AI_BASE_URL is required. OpenAI fallback is disabled.');
    }

    const response = await fetch(`${localAiBaseUrl}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Local TTS failed: ${body || response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, audioBuffer);
    return outputPath;
}

/**
 * Get video duration using FFmpeg
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata.format.duration || 0);
            }
        });
    });
}

/**
 * Extract thumbnail from video
 */
export async function extractThumbnail(
    videoPath: string,
    outputPath: string,
    timeInSeconds: number = 1
): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshots({
                timestamps: [timeInSeconds],
                filename: path.basename(outputPath),
                folder: path.dirname(outputPath),
                size: '1280x720',
            })
            .on('end', () => resolve(outputPath))
            .on('error', reject);
    });
}

/**
 * Merge audio with video using FFmpeg
 */
export async function mergeAudioWithVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .outputOptions([
                '-c:v copy',           // Copy video codec (no re-encoding)
                '-c:a aac',            // Encode audio as AAC
                '-map 0:v:0',          // Map video from first input
                '-map 1:a:0',          // Map audio from second input
                '-shortest',           // End output when shortest input ends
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
}

/**
 * Process video: generate audio and merge
 */
export interface ProcessVideoOptions {
    videoPath: string;
    videoTitle: string;
    userId: string;
    videoId: string;
}

export interface ProcessVideoResult {
    processedVideoPath: string;
    thumbnailPath: string;
    audioScript: string;
    duration: number;
}

export async function processVideo(
    options: ProcessVideoOptions
): Promise<ProcessVideoResult> {
    const { videoPath, videoTitle, userId, videoId } = options;

    const tmpDir = path.join(os.tmpdir(), 'loltrackr');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const audioPath = path.join(tmpDir, `${videoId}-audio.wav`);
    const thumbnailPath = path.join(tmpDir, `${videoId}-thumb.jpg`);
    const outputPath = path.join(tmpDir, `${videoId}-processed.mp4`);

    try {
        // Generate brain rot script
        const audioScript = await generateBrainRotScript(videoTitle);

        // Generate audio from script
        await generateAudio(audioScript, audioPath);

        // Get video duration
        const duration = await getVideoDuration(videoPath);

        // Extract thumbnail
        await extractThumbnail(videoPath, thumbnailPath);

        // Merge audio with video
        await mergeAudioWithVideo(videoPath, audioPath, outputPath);

        // Clean up temporary audio file
        await unlink(audioPath);

        return {
            processedVideoPath: outputPath,
            thumbnailPath,
            audioScript,
            duration,
        };
    } catch (error) {
        // Clean up on error
        if (fs.existsSync(audioPath)) await unlink(audioPath);
        if (fs.existsSync(thumbnailPath)) await unlink(thumbnailPath);
        if (fs.existsSync(outputPath)) await unlink(outputPath);
        throw error;
    }
}
