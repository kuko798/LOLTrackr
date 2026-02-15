/** @type {import('next').NextConfig} */
const nextConfig = {
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
