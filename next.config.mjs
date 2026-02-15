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
};

export default nextConfig;
