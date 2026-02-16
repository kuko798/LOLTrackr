'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './VideoInteractions.module.css';

interface CommentItem {
    id: string;
    content: string;
    createdAt: string;
    user: {
        username: string;
        displayName: string;
    };
}

interface VideoInteractionsProps {
    videoId: string;
    initialLikesCount: number;
    initialLiked: boolean;
    initialCommentsCount: number;
}

export default function VideoInteractions({
    videoId,
    initialLikesCount,
    initialLiked,
    initialCommentsCount,
}: VideoInteractionsProps) {
    const { status } = useSession();
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [liked, setLiked] = useState(initialLiked);
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [commentText, setCommentText] = useState('');
    const [error, setError] = useState('');
    const [loadingComments, setLoadingComments] = useState(true);

    useEffect(() => {
        fetch(`/api/videos/${videoId}/comments`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load comments');
                setComments(data.comments || []);
                setCommentsCount((data.comments || []).length);
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoadingComments(false));
    }, [videoId]);

    async function toggleLike() {
        setError('');
        const response = await fetch(`/api/videos/${videoId}/like`, { method: 'POST' });
        const data = await response.json();
        if (!response.ok) {
            setError(data.error || 'Failed to update like');
            return;
        }
        setLiked(data.liked);
        setLikesCount(data.likesCount);
    }

    async function submitComment(e: FormEvent) {
        e.preventDefault();
        if (!commentText.trim()) return;
        setError('');

        const response = await fetch(`/api/videos/${videoId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: commentText }),
        });
        const data = await response.json();
        if (!response.ok) {
            setError(data.error || 'Failed to post comment');
            return;
        }
        setComments((prev) => [data.comment, ...prev]);
        setCommentsCount((prev) => prev + 1);
        setCommentText('');
    }

    return (
        <div className={styles.interactions}>
            <div className={styles.statsRow}>
                <button
                    type="button"
                    className={`${styles.likeButton} ${liked ? styles.liked : ''}`}
                    onClick={toggleLike}
                    disabled={status !== 'authenticated'}
                >
                    {liked ? 'Unlike' : 'Like'} ({likesCount})
                </button>
                <span>{commentsCount} comments</span>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {status === 'authenticated' && (
                <form onSubmit={submitComment} className={styles.commentForm}>
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        maxLength={500}
                        rows={3}
                        className={styles.commentInput}
                    />
                    <button type="submit" className="btn btn-primary">
                        Post Comment
                    </button>
                </form>
            )}

            <div className={styles.commentList}>
                {loadingComments ? (
                    <p className="text-muted">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-muted">No comments yet.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className={styles.commentItem}>
                            <div className={styles.commentMeta}>
                                <strong>@{comment.user.username}</strong>
                                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <p>{comment.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
