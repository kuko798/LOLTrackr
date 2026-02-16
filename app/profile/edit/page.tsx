'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './profile-edit.module.css';

export default function EditProfilePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }
        if (status === 'authenticated') {
            fetch('/api/profile')
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to load profile');
                    setDisplayName(data.user.displayName || '');
                    setBio(data.user.bio || '');
                    setAvatarUrl(data.user.avatarUrl || '');
                })
                .catch((err: Error) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [status, router]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName, bio, avatarUrl }),
        });

        const data = await response.json();
        if (!response.ok) {
            setError(data.error || 'Failed to update profile');
            return;
        }

        setSuccess('Profile updated');
        router.push(`/profile/${session?.user.username}`);
        router.refresh();
    }

    if (loading || status === 'loading') {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={`${styles.card} card`}>
                    <h1>Edit Profile</h1>
                    {error && <div className={styles.error}>{error}</div>}
                    {success && <div className={styles.success}>{success}</div>}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="displayName">Display Name</label>
                            <input
                                id="displayName"
                                className="form-input"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                maxLength={50}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="bio">Bio</label>
                            <textarea
                                id="bio"
                                className="form-input"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={280}
                                rows={4}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="avatarUrl">Avatar URL</label>
                            <input
                                id="avatarUrl"
                                className="form-input"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                maxLength={500}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
