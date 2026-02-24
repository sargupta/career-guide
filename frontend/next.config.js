/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: { ignoreDuringBuilds: true },
    output: 'standalone',
    images: {
        domains: ["lh3.googleusercontent.com"],
    },
};

module.exports = nextConfig;
