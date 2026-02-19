'use client';

import { useRef, useState } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    console.log('VideoPlayer - Loading URL:', videoUrl);

    function togglePlay() {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }

    function toggleMute() {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }

    function toggleFullscreen() {
        if (videoRef.current) {
            if (!isFullscreen) {
                videoRef.current.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
            setIsFullscreen(!isFullscreen);
        }
    }

    return (
        <div className={styles.playerContainer}>
            {error && (
                <div style={{ color: 'red', padding: '20px', background: '#ffe6e6', marginBottom: '10px' }}>
                    <strong>Video Error:</strong> {error}
                    <br />
                    <small>URL: {videoUrl}</small>
                </div>
            )}
            <video
                ref={videoRef}
                src={videoUrl}
                className={styles.video}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                    console.error('Video loading error:', e);
                    console.error('Video URL:', videoUrl);
                    const target = e.target as HTMLVideoElement;
                    setError(`Failed to load video. Error code: ${target.error?.code}, Message: ${target.error?.message || 'Unknown error'}`);
                }}
                crossOrigin="anonymous"
            />

            <div className={styles.controls}>
                <button onClick={togglePlay} className={styles.controlBtn}>
                    {isPlaying ? '⏸' : '▶'}
                </button>

                <button onClick={toggleMute} className={styles.controlBtn}>
                    {isMuted ? '🔇' : '🔊'}
                </button>

                <button onClick={toggleFullscreen} className={styles.controlBtn}>
                    ⛶
                </button>
            </div>
        </div>
    );
}
