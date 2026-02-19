import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import VideoPlayer from '@/components/VideoPlayer';
import VideoInteractions from '@/components/VideoInteractions';
import styles from './video.module.css';

interface VideoPageProps {
    params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const video = await prisma.video.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                }
            },
            _count: {
                select: {
                    likes: true,
                    comments: true,
                }
            },
            ...(session?.user?.id ? {
                likes: {
                    where: { userId: session.user.id },
                    select: { id: true }
                }
            } : {})
        }
    });

    if (!video) {
        notFound();
    }

    prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } }
    }).catch(console.error);

    return (
        <div className={styles.videoPage}>
            <div className="container">
                <div className={styles.videoContainer}>
                    <div className={styles.playerSection}>
                        {video.processedVideoUrl || video.originalVideoUrl ? (
                            <VideoPlayer videoUrl={video.processedVideoUrl || video.originalVideoUrl} />
                        ) : (
                            <div className={styles.processingMessage}>
                                <p>
                                    {video.processingStatus === 'processing'
                                        ? 'Video is being processed...'
                                        : video.processingStatus === 'pending'
                                            ? 'Video is queued for processing...'
                                            : 'Video upload failed'}
                                </p>
                            </div>
                        )}

                        <div className={styles.videoInfo}>
                            <h1 className={styles.title}>{video.title}</h1>

                            <div className={styles.meta}>
                                <span>{video.views + 1} views</span>
                                <span>-</span>
                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                            </div>

                            {video.description && (
                                <p className={styles.description}>{video.description}</p>
                            )}

                            {video.generatedAudioText && (
                                <div className={styles.aiScript}>
                                    <h3>AI Generated Script</h3>
                                    <p>{video.generatedAudioText}</p>
                                </div>
                            )}

                            <VideoInteractions
                                videoId={video.id}
                                initialLikesCount={video._count.likes}
                                initialCommentsCount={video._count.comments}
                                initialLiked={Array.isArray(video.likes) ? video.likes.length > 0 : false}
                            />
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        <div className={`${styles.creatorCard} card`}>
                            <h3>Creator</h3>
                            <a
                                href={`/profile/${video.user.username}`}
                                className={styles.creatorLink}
                            >
                                <div className={styles.creatorInfo}>
                                    <div className={styles.avatar}>
                                        {video.user.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className={styles.displayName}>
                                            {video.user.displayName}
                                        </div>
                                        <div className={styles.username}>
                                            @{video.user.username}
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
