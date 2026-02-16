import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

/**
 * Generate brain rot commentary using OpenAI
 */
export async function generateBrainRotScript(videoTitle: string): Promise<string> {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are a brain rot content generator. Create short, chaotic, and absurdly funny commentary for videos that would appeal to Gen Z/Alpha humor. Use memes, internet slang, and random references. Keep it under 30 seconds of speech. Be wild, unhinged, and entertaining. Include phrases like "no cap", "deadass", "fr fr", "bussin", etc.`,
            },
            {
                role: 'user',
                content: `Generate brain rot commentary for a video titled: "${videoTitle}"`,
            },
        ],
        max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || 'Yo this video is straight bussin fr fr no cap!';
}

/**
 * Generate audio from text using OpenAI TTS
 */
export async function generateAudio(text: string, outputPath: string): Promise<string> {
    const openai = getOpenAIClient();
    const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'onyx', // Changed to onyx for more energetic voice
        input: text,
        speed: 1.1, // Slightly faster for brain rot effect
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await writeFile(outputPath, buffer);

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

    const audioPath = path.join(tmpDir, `${videoId}-audio.mp3`);
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
