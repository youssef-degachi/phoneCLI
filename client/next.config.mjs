/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['*.trycloudflare.com'],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:4242/api/:path*',
            },
            {
                // WebSocket endpoints (terminal, ai, logs) are forwarded to backend.
                // Next.js dev server proxies the HTTP upgrade for these paths.
                source: '/ws/:path*',
                destination: 'http://localhost:4242/ws/:path*',
            },
            {
                // Per-project dev server proxy (e.g., /proxy/<id>/...)
                source: '/proxy/:path*',
                destination: 'http://localhost:4242/proxy/:path*',
            },
            {
                source: '/health',
                destination: 'http://localhost:4242/health',
            },
        ];
    },
};

export default nextConfig;
