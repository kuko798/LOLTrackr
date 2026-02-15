'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { data: session, status } = useSession();

    return (
        <nav className={styles.navbar}>
            <div className="container">
                <div className={styles.navContent}>
                    <Link href="/" className={styles.logo}>
                        <span className="gradient-text">LOLTracker</span>
                    </Link>

                    <div className={styles.navLinks}>
                        <Link href="/" className={styles.navLink}>
                            Explore
                        </Link>

                        {status === 'authenticated' ? (
                            <>
                                <Link href="/upload" className={styles.navLink}>
                                    Upload
                                </Link>
                                <Link href="/dashboard" className={styles.navLink}>
                                    Dashboard
                                </Link>
                                <Link
                                    href={`/profile/${session.user.username}`}
                                    className={styles.navLink}
                                >
                                    @{session.user.username}
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className={`btn btn-secondary ${styles.authBtn}`}
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/signin" className="btn btn-secondary">
                                    Sign In
                                </Link>
                                <Link href="/auth/signup" className="btn btn-primary">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
