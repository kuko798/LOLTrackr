'use client';

import { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import styles from './VideoFeed.module.css';

interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    views: number;
    createdAt: string;
    user: {
        username: string;
        displayName: string;
    };
}

export default function VideoFeed() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchVideos() {
            try {
                const response = await fetch('/api/videos?status=completed&limit=12');
                if (!response.ok) throw new Error('Failed to fetch videos');

                const data = await response.json();
                setVideos(data.videos);
            } catch (err) {
                setError('Failed to load videos');
            } finally {
                setLoading(false);
            }
        }

        fetchVideos();
    }, []);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading videos...</p>
            </div>
        );
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (videos.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No videos yet. Be the first to upload!</p>
            </div>
        );
    }

    return (
        <div className={`${styles.feedGrid} grid grid-4`}>
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
}
