import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import VideoPlayer from '@/components/VideoPlayer';
import styles from './video.module.css';

interface VideoPageProps {
    params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
    const { id } = await params;
    const video = await prisma.video.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                }
            }
        }
    });

    if (!video) {
        notFound();
    }

    // Increment views (async, non-blocking for response)
    prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } }
    }).catch(console.error);

    // Prepare video data for the component, including the incremented view count
    const videoData = {
        id: video.id,
        title: video.title,
        description: video.description,
        processedVideoUrl: video.processedVideoUrl,
        thumbnailUrl: video.thumbnailUrl,
        generatedAudioText: video.generatedAudioText,
        views: video.views + 1, // Display the incremented view count
        createdAt: video.createdAt.toISOString(),
        user: {
            username: video.user.username,
            displayName: video.user.displayName,
        },
    };

    return (
        <div className={styles.videoPage}>
            <div className="container">
                <div className={styles.videoContainer}>
                    <div className={styles.playerSection}>
                        {video.processingStatus === 'completed' && video.processedVideoUrl ? (
                            <VideoPlayer videoUrl={video.processedVideoUrl} />
                        ) : (
                            <div className={styles.processingMessage}>
                                <p>
                                    {video.processingStatus === 'processing'
                                        ? 'Video is being processed...'
                                        : video.processingStatus === 'pending'
                                            ? 'Video is queued for processing...'
                                            : 'Video processing failed'}
                                </p>
                            </div>
                        )}

                        <div className={styles.videoInfo}>
                            <h1 className={styles.title}>{videoData.title}</h1>

                            <div className={styles.meta}>
                                <span>{videoData.views} views</span>
                                <span>•</span>
                                <span>{new Date(videoData.createdAt).toLocaleDateString()}</span>
                            </div>

                            {videoData.description && (
                                <p className={styles.description}>{videoData.description}</p>
                            )}

                            {videoData.generatedAudioText && (
                                <div className={styles.aiScript}>
                                    <h3>🤖 AI Generated Script</h3>
                                    <p>{videoData.generatedAudioText}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        <div className={`${styles.creatorCard} card`}>
                            <h3>Creator</h3>
                            <a
                                href={`/profile/${videoData.user.username}`}
                                className={styles.creatorLink}
                            >
                                <div className={styles.creatorInfo}>
                                    <div className={styles.avatar}>
                                        {videoData.user.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className={styles.displayName}>
                                            {videoData.user.displayName}
                                        </div>
                                        <div className={styles.username}>
                                            @{videoData.user.username}
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
