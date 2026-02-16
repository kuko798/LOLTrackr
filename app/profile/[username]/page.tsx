import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import VideoCard from '@/components/VideoCard';
import styles from './profile.module.css';

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const session = await getServerSession(authOptions);

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
        include: {
            _count: {
                select: {
                    likes: true,
                    comments: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const isOwner = session?.user?.id === user.id;

    return (
        <div className={styles.profilePage}>
            <div className="container">
                <div className={`${styles.profileHeader} card`}>
                    <div className={styles.avatar}>
                        {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userInfo}>
                        <h1>{user.displayName}</h1>
                        <p className="text-muted">@{user.username}</p>
                        {user.bio && <p>{user.bio}</p>}
                        <p className={styles.joinDate}>
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        {isOwner && (
                            <Link href="/profile/edit" className="btn btn-secondary">
                                Edit Profile
                            </Link>
                        )}
                    </div>
                </div>

                <div className={styles.videosSection}>
                    <h2>Videos</h2>

                    {videos.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No videos uploaded yet.</p>
                        </div>
                    ) : (
                        <div className={`${styles.videoGrid} grid grid-4`}>
                            {videos.map((video: any) => (
                                <VideoCard
                                    key={video.id}
                                    video={{
                                        id: video.id,
                                        title: video.title,
                                        thumbnailUrl: video.thumbnailUrl || '',
                                        views: video.views,
                                        likesCount: video._count.likes,
                                        commentsCount: video._count.comments,
                                        createdAt: video.createdAt.toISOString(),
                                        user: {
                                            username: user.username,
                                            displayName: user.displayName,
                                        },
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
