'use client';

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './upload.module.css';

export default function UploadPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        router.push('/auth/signin');
        return null;
    }

    if (status === 'loading') {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
            </div>
        );
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!videoFile) {
            setError('Please select a video file');
            return;
        }

        setError('');
        setUploading(true);
        setProgress(10);

        try {
            const formData = new FormData(e.currentTarget);
            formData.append('video', videoFile);

            setProgress(30);
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setProgress(60);
            setUploading(false);
            setProcessing(true);

            // Start watching for processing completion
            const videoId = data.videoId;
            checkProcessingStatus(videoId);
        } catch (err: any) {
            setError(err.message || 'Failed to upload video');
            setUploading(false);
            setProgress(0);
        }
    }

    async function checkProcessingStatus(videoId: string) {
        const maxAttempts = 60; // 5 minutes max
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch(`/api/videos/${videoId}`);
                const data = await response.json();
                if (!response.ok || !data?.video) {
                    throw new Error(data?.error || 'Failed to check video status');
                }

                if (data.video.processingStatus === 'completed') {
                    clearInterval(interval);
                    setProcessing(false);
                    setProgress(100);
                    router.push(`/video/${videoId}`);
                } else if (data.video.processingStatus === 'failed') {
                    clearInterval(interval);
                    const failureReason =
                        typeof data.video.generatedAudioText === 'string' &&
                            data.video.generatedAudioText.startsWith('Processing error:')
                            ? data.video.generatedAudioText
                            : 'Video processing failed. Please try again.';
                    setError(failureReason);
                    setProcessing(false);
                    setProgress(0);
                } else {
                    // Update progress estimate
                    const progressEstimate = 60 + (attempts / maxAttempts) * 35;
                    setProgress(Math.min(95, progressEstimate));
                }
            } catch (err: any) {
                console.error('Status check error:', err);
                setError(err?.message || 'Failed to check processing status');
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                setError('Processing is taking longer than expected. Check your dashboard later.');
                setProcessing(false);
            }
        }, 5000); // Check every 5 seconds
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload a valid video file (MP4, WebM, or MOV)');
                return;
            }

            // Validate file size (100MB max)
            const maxSize = 100 * 1024 * 1024;
            if (file.size > maxSize) {
                setError('File size must be less than 100MB');
                return;
            }

            setVideoFile(file);
            setError('');
        }
    }

    const isProcessingVideo = uploading || processing;

    return (
        <div className={styles.uploadPage}>
            <div className="container">
                <div className={`${styles.uploadCard} card fade-in`}>
                    <h1 className="gradient-text text-center">Upload Video</h1>
                    <p className="text-muted text-center">
                        Let's create some brain rot content fr fr
                    </p>

                    {error && (
                        <div className={styles.errorBox}>
                            {error}
                        </div>
                    )}

                    {isProcessingVideo && (
                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-center text-muted">
                                {uploading ? 'Uploading video...' : 'Processing video with AI...'}
                                <br />
                                <small>{Math.round(progress)}%</small>
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">
                                Title
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                maxLength={100}
                                className="form-input"
                                placeholder="My epic video"
                                disabled={isProcessingVideo}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                Description (optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                maxLength={500}
                                className={`form-input ${styles.textarea}`}
                                placeholder="Tell us about your video..."
                                disabled={isProcessingVideo}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="video" className="form-label">
                                Video File
                            </label>
                            <div className={styles.fileInputWrapper}>
                                <input
                                    id="video"
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    onChange={handleFileChange}
                                    className={styles.fileInput}
                                    disabled={isProcessingVideo}
                                    required
                                />
                                <label htmlFor="video" className={styles.fileInputLabel}>
                                    {videoFile ? videoFile.name : 'Choose video file'}
                                </label>
                            </div>
                            <small className="text-muted">
                                MP4, WebM, or MOV • Max 100MB
                            </small>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessingVideo || !videoFile}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {isProcessingVideo ? 'Processing...' : 'Upload & Generate AI Audio'}
                        </button>
                    </form>

                    <p className="text-center text-muted" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <Link href="/dashboard" className={styles.link}>
                            View your uploads
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
