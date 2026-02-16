import Link from 'next/link';
import styles from './VideoCard.module.css';

interface VideoCardProps {
    video: {
        id: string;
        title: string;
        thumbnailUrl: string;
        views: number;
        likesCount?: number;
        commentsCount?: number;
        createdAt: string;
        user: {
            username: string;
            displayName: string;
        };
    };
}

export default function VideoCard({ video }: VideoCardProps) {
    const timeAgo = getTimeAgo(new Date(video.createdAt));

    return (
        <Link href={`/video/${video.id}`} className={styles.videoCard}>
            <div className={styles.thumbnail}>
                <img src={video.thumbnailUrl} alt={video.title} />
                <div className={styles.overlay}>
                    <div className={styles.playIcon}>Play</div>
                </div>
            </div>

            <div className={styles.info}>
                <h3 className={styles.title}>{video.title}</h3>
                <Link
                    href={`/profile/${video.user.username}`}
                    className={styles.username}
                    onClick={(e) => e.stopPropagation()}
                >
                    @{video.user.username}
                </Link>
                <div className={styles.meta}>
                    <span>{video.views} views</span>
                    <span>-</span>
                    <span>{video.likesCount || 0} likes</span>
                    <span>-</span>
                    <span>{timeAgo}</span>
                </div>
            </div>
        </Link>
    );
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }

    return 'just now';
}
