'use client';

import { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import styles from './VideoFeed.module.css';

interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    views: number;
    likesCount: number;
    createdAt: string;
    user: {
        username: string;
        displayName: string;
    };
}

export default function TrendingFeed() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrending() {
            try {
                const response = await fetch('/api/videos?status=completed&trending=true&limit=8');
                if (!response.ok) throw new Error('Failed to fetch trending videos');
                const data = await response.json();
                setVideos(data.videos || []);
            } catch (error) {
                console.error('Failed to load trending videos:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchTrending();
    }, []);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading trending videos...</p>
            </div>
        );
    }

    if (videos.length === 0) {
        return null;
    }

    return (
        <div className={`${styles.feedGrid} grid grid-4`}>
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
}
