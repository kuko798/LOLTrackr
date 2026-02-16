import Link from 'next/link';
import VideoFeed from '@/components/VideoFeed';
import TrendingFeed from '@/components/TrendingFeed';
import styles from './page.module.css';

export default function HomePage() {
    return (
        <div className={styles.homePage}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroContent}>
                        <h1 className={`${styles.heroTitle} fade-in`}>
                            Create <span className="gradient-text">Brain Rot</span> Content
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Upload videos and let AI generate the most unhinged,
                            chaotic audio overlays. It's bussin fr fr.
                        </p>
                        <div className={styles.heroCta}>
                            <Link href="/upload" className="btn btn-primary btn-large">
                                Upload Video
                            </Link>
                            <Link href="/auth/signup" className="btn btn-secondary">
                                Join Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Video Feed Section */}
            <section className={styles.feedSection}>
                <div className="container">
                    <h2 className="text-center">Latest Uploads</h2>
                    <VideoFeed />
                </div>
            </section>

            <section className={styles.feedSection}>
                <div className="container">
                    <h2 className="text-center">Trending Now</h2>
                    <TrendingFeed />
                </div>
            </section>
        </div>
    );
}
