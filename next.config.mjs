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
    webpack: (config, { isServer }) => {
        // Exclude ffmpeg/ffprobe packages from client-side bundle
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
        } else {
            // For server-side, mark these as external (don't bundle)
            const externals = config.externals || [];
            config.externals = [
                ...Array.isArray(externals) ? externals : [externals],
                '@ffmpeg-installer/ffmpeg',
                '@ffprobe-installer/ffprobe',
                'fluent-ffmpeg',
            ];
        }

        return config;
    },
};

export default nextConfig;
