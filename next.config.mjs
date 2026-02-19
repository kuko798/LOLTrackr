import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    images: {
        domains: ['storage.googleapis.com'],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '100mb',
        },
    },
    // Exclude these packages from webpack bundling (server-side only)
    serverComponentsExternalPackages: [
        '@ffmpeg-installer/ffmpeg',
        '@ffprobe-installer/ffprobe',
        'fluent-ffmpeg',
    ],
    webpack: (config, { isServer }) => {
        // Exclude from client-side bundle
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                '@ffmpeg-installer/ffmpeg': false,
                '@ffprobe-installer/ffprobe': false,
                'fluent-ffmpeg': false,
                fs: false,
                path: false,
                os: false,
            };
        }

        return config;
    },
};

export default nextConfig;
