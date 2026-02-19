import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

function configureFfmpegPath() {
    // Configure FFmpeg path
    if (process.env.FFMPEG_PATH) {
        ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    } else {
        try {
            // Optional dependency can be missing in some build environments.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
            if (ffmpegInstaller?.path) {
                ffmpeg.setFfmpegPath(ffmpegInstaller.path);
            }
        } catch {
            // Fall back to system ffmpeg in PATH if present.
        }
    }

    // Configure FFprobe path
    if (process.env.FFPROBE_PATH) {
        ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
    } else {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
            if (ffprobeInstaller?.path) {
                ffmpeg.setFfprobePath(ffprobeInstaller.path);
            }
        } catch {
            // Fall back to system ffprobe in PATH if present.
        }
    }
}

configureFfmpegPath();

export type CommentaryStyle = 'hype' | 'roast' | 'wholesome' | 'conspiracy' | 'shocked';

/**
 * Get a random commentary style for variety
 */
export function getRandomCommentaryStyle(): CommentaryStyle {
    const styles: CommentaryStyle[] = ['hype', 'roast', 'wholesome', 'conspiracy', 'shocked'];
    return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * Enhanced fallback templates for script generation
 */
function generateTemplateScript(videoTitle: string, style: CommentaryStyle): string {
    const fallbackTemplates: Record<CommentaryStyle, string[]> = {
        hype: [
            `No cap, this is absolute cinema. We're watching '${videoTitle}' and it's hitting different. This is bussin, I'm literally crying.`,
            `Fr fr this title is unhinged in the best way. '${videoTitle}' just dropped and it's giving main character energy. Certified chaos, 10/10 would watch again.`,
            `Deadass this one is about to be peak brain rot. '${videoTitle}' is the content we didn't know we needed. I cannot believe this is real, but I'm here for it.`,
            `This is it. This is the one. '${videoTitle}' is serving pure unfiltered vibes. Absolutely unhinged, love that for us.`,
            `Yo, we need to talk about this. '${videoTitle}' just went viral in my brain. This slaps harder than it has any right to. No notes.`,
        ],
        roast: [
            `Wait, '${videoTitle}'? I'm sorry but who approved this? The audacity is sending me, but you know what, it's kinda iconic.`,
            `Not '${videoTitle}' being a real video title. This is unhinged and I have questions. But fr fr I'm clicking play.`,
            `Tell me why '${videoTitle}' exists without telling me the internet was a mistake. Actually no, this is peak comedy. I'm obsessed.`,
        ],
        wholesome: [
            `This is so wholesome I could cry. '${videoTitle}' is exactly the vibe we need right now. Love that for us, truly.`,
            `'${videoTitle}' just restored my faith in content. This is pure good energy and I'm here for every second of it.`,
            `Not me getting emotional over '${videoTitle}'. This is the comfort content we all deserve. Absolutely heartwarming.`,
        ],
        conspiracy: [
            `Wait... hold up. '${videoTitle}' is not what you think it is. I've connected the dots and this goes deeper than you realize. Wake up people.`,
            `Okay but hear me out about '${videoTitle}'. This is clearly a simulation test and we're all living in it. I have evidence.`,
            `They don't want you to know about '${videoTitle}'. But I'm exposing the truth. This changes everything.`,
        ],
        shocked: [
            `I'm sorry WHAT? '${videoTitle}' is a thing that exists? My brain is melting. I can't process this.`,
            `Literally '${videoTitle}' just appeared on my screen and I have never been more confused. What timeline is this?`,
            `HELP. '${videoTitle}' broke me. I don't know whether to laugh or cry but it's definitely something.`,
        ],
    };

    const templates = fallbackTemplates[style];
    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate style-specific prompts for LLM
 */
function getStylePrompt(videoTitle: string, style: CommentaryStyle): string {
    const stylePrompts: Record<CommentaryStyle, string> = {
        hype: `You are a chaotic Gen-Z content creator making hype commentary for viral videos.

Video Title: "${videoTitle}"

Create a short, energetic commentary (2-3 sentences max) that:
- Opens with immediate hype and engagement
- References the video title naturally
- Uses authentic Gen-Z slang (no cap, fr fr, bussin, deadass, slaps, unhinged, etc.)
- Builds excitement and humor
- Feels spontaneous and genuine, not forced

Make it sound like you're hyped to share this with friends. Keep it snappy and entertaining.

Commentary:`,
        roast: `You are a sarcastic Gen-Z content creator doing playful roast commentary.

Video Title: "${videoTitle}"

Create a short, witty roast commentary (2-3 sentences max) that:
- Opens with playful skepticism or confusion
- Roasts or makes fun of the title in a lighthearted way
- Uses Gen-Z humor and slang
- Is funny but not mean-spirited
- Ends with a twist or unexpected compliment

Make it feel like friendly banter with your audience.

Commentary:`,
        wholesome: `You are an enthusiastic Gen-Z content creator making wholesome, positive commentary.

Video Title: "${videoTitle}"

Create a short, uplifting commentary (2-3 sentences max) that:
- Opens with genuine excitement and positivity
- Celebrates what's wholesome or heartwarming about the content
- Uses Gen-Z slang but keeps it positive (slaps, vibes, love that for us, etc.)
- Spreads good energy
- Feels authentic and warm

Make your audience feel good about watching this.

Commentary:`,
        conspiracy: `You are a dramatic Gen-Z content creator making conspiracy-style commentary.

Video Title: "${videoTitle}"

Create a short, dramatic conspiracy commentary (2-3 sentences max) that:
- Opens with "Wait..." or "Hold up..." to create intrigue
- Presents a humorous conspiracy theory about the video
- Uses Gen-Z slang mixed with dramatic language
- Builds suspense playfully
- Feels unhinged in the best way

Make it feel like you're uncovering the truth.

Commentary:`,
        shocked: `You are a bewildered Gen-Z content creator making shocked reaction commentary.

Video Title: "${videoTitle}"

Create a short, shocked commentary (2-3 sentences max) that:
- Opens with disbelief or confusion
- Expresses genuine surprise at the video title
- Uses Gen-Z slang and reaction language (literally, I can't, what, help, etc.)
- Builds on the absurdity
- Feels like a genuine shocked reaction

Make it sound like you can't believe what you're seeing.

Commentary:`,
    };

    return stylePrompts[style];
}

/**
 * Generate brain rot commentary using direct LLM connection or templates
 */
export async function generateBrainRotScript(
    videoTitle: string,
    style: CommentaryStyle = 'hype'
): Promise<string> {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    const useTemplates = process.env.USE_TEMPLATES === 'true';

    // If templates are enabled, use them directly
    if (useTemplates) {
        return generateTemplateScript(videoTitle, style);
    }

    // Try to generate using Ollama/LLM directly
    try {
        const prompt = getStylePrompt(videoTitle, style);

        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: ollamaModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.9,
                    top_p: 0.95,
                    top_k: 50,
                    repeat_penalty: 1.2,
                },
            }),
        });

        if (!response.ok) {
            console.warn(`LLM generation failed, falling back to templates: ${response.statusText}`);
            return generateTemplateScript(videoTitle, style);
        }

        const data = await response.json();
        let script = data?.response?.trim() || '';

        // Clean up the response
        const cleanupPrefixes = ['commentary:', 'script:', "here's", 'sure,'];
        const scriptLower = script.toLowerCase();
        for (const prefix of cleanupPrefixes) {
            if (scriptLower.startsWith(prefix)) {
                script = script.substring(prefix.length).trim();
                break;
            }
        }

        // Remove wrapping quotes
        if (
            (script.startsWith('"') && script.endsWith('"')) ||
            (script.startsWith("'") && script.endsWith("'"))
        ) {
            script = script.substring(1, script.length - 1).trim();
        }

        // Validate and truncate if needed
        if (!script || script.length < 20) {
            console.warn('LLM response too short, falling back to templates');
            return generateTemplateScript(videoTitle, style);
        }

        if (script.length > 500) {
            const sentences = script.split('. ');
            script = sentences.slice(0, 3).join('. ');
            if (!script.endsWith('.')) {
                script += '.';
            }
        }

        return script;
    } catch (error) {
        console.warn(`LLM generation error, falling back to templates:`, error);
        return generateTemplateScript(videoTitle, style);
    }
}

/**
 * Generate audio from text using TTS service (if available)
 */
export async function generateAudio(text: string, outputPath: string): Promise<string | null> {
    const ttsServiceUrl = process.env.TTS_SERVICE_URL;

    // If no TTS service is configured, skip audio generation
    if (!ttsServiceUrl) {
        console.log('TTS_SERVICE_URL not configured, skipping audio generation');
        return null;
    }

    try {
        const response = await fetch(`${ttsServiceUrl}/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            console.warn(`TTS generation failed: ${response.statusText}`);
            return null;
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        await writeFile(outputPath, audioBuffer);
        return outputPath;
    } catch (error) {
        console.warn('TTS generation error, continuing without audio:', error);
        return null;
    }
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
        // Generate brain rot script with random style for variety
        const style = getRandomCommentaryStyle();
        const audioScript = await generateBrainRotScript(videoTitle, style);

        // Generate audio from script (optional)
        const audioGenerated = await generateAudio(audioScript, audioPath);

        // Get video duration
        const duration = await getVideoDuration(videoPath);

        // Extract thumbnail
        await extractThumbnail(videoPath, thumbnailPath);

        // If audio was generated, merge it with video; otherwise use original video
        if (audioGenerated && fs.existsSync(audioPath)) {
            await mergeAudioWithVideo(videoPath, audioPath, outputPath);
            // Clean up temporary audio file
            await unlink(audioPath);
        } else {
            // No audio generation, just copy the original video
            console.log('No audio generated, using original video');
            fs.copyFileSync(videoPath, outputPath);
        }

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
