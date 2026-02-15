'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import VideoCard from '@/components/VideoCard';
import styles from './dashboard.module.css';

interface Video {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl: string;
    processingStatus: string;
    views: number;
    createdAt: string;
    user: {
        username: string;
        displayName: string;
    };
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated') {
            fetchUserVideos();
        }
    }, [status, router]);

    async function fetchUserVideos() {
        try {
            const response = await fetch(`/api/videos?userId=${session?.user.id}`);
            const data = await response.json();
            setVideos(data.videos);
        } catch (error) {
            console.error('Failed to fetch videos:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(videoId: string) {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            const response = await fetch(`/api/videos/${videoId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setVideos(videos.filter((v) => v.id !== videoId));
            }
        } catch (error) {
            console.error('Failed to delete video:', error);
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardPage}>
            <div className="container">
                <div className={styles.header}>
                    <h1>Your Videos</h1>
                    <Link href="/upload" className="btn btn-primary">
                        Upload New Video
                    </Link>
                </div>

                {videos.length === 0 ? (
                    <div className={styles.empty}>
                        <p>You haven't uploaded any videos yet.</p>
                        <Link href="/upload" className="btn btn-primary">
                            Upload Your First Video
                        </Link>
                    </div>
                ) : (
                    <div className={`${styles.videoGrid} grid grid-4`}>
                        {videos.map((video) => (
                            <div key={video.id} className={styles.videoItem}>
                                <VideoCard video={video} />

                                <div className={styles.statusBadge}>
                                    {video.processingStatus === 'completed' && (
                                        <span className={styles.completed}>✓ Completed</span>
                                    )}
                                    {video.processingStatus === 'processing' && (
                                        <span className={styles.processing}>⏳ Processing</span>
                                    )}
                                    {video.processingStatus === 'pending' && (
                                        <span className={styles.pending}>⏸ Pending</span>
                                    )}
                                    {video.processingStatus === 'failed' && (
                                        <span className={styles.failed}>✗ Failed</span>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDelete(video.id)}
                                    className={styles.deleteBtn}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
