import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import VideoCard from '@/components/VideoCard';
import styles from './profile.module.css';

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        notFound();
    }

    const videos = await prisma.video.findMany({
        where: {
            userId: user.id,
            processingStatus: 'completed',
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const userData = {
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
    };

    const videosData = videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        views: video.views,
        createdAt: video.createdAt.toISOString(),
        user: {
            username: user.username,
            displayName: user.displayName,
        },
    }));

    return (
        <div className={styles.profilePage}>
            <div className="container">
                <div className={`${styles.profileHeader} card`}>
                    <div className={styles.avatar}>
                        {userData.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userInfo}>
                        <h1>{userData.displayName}</h1>
                        <p className="text-muted">@{userData.username}</p>
                        <p className={styles.joinDate}>
                            Joined {new Date(userData.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className={styles.videosSection}>
                    <h2>Videos</h2>

                    {videosData.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No videos uploaded yet.</p>
                        </div>
                    ) : (
                        <div className={`${styles.videoGrid} grid grid-4`}>
                            {videosData.map((video: any) => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
