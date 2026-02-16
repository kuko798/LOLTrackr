'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../signin/auth.module.css';

export default function VerifyEmailPage() {
    const params = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const token = params.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Missing verification token');
            return;
        }

        fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Verification failed');
                }
                setStatus('success');
                setMessage('Email verified. You can now sign in.');
            })
            .catch((err: Error) => {
                setStatus('error');
                setMessage(err.message || 'Verification failed');
            });
    }, [params]);

    return (
        <div className={styles.authContainer}>
            <div className={`${styles.authCard} card fade-in`}>
                <h1 className="gradient-text text-center">Email Verification</h1>
                <p className="text-center text-muted">{message}</p>
                {status !== 'loading' && (
                    <p className="text-center" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <Link href="/auth/signin" className={styles.link}>
                            Go to Sign In
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
