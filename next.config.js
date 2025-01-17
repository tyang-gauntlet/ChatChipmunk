/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://44.204.108.174/:path*'
            }
        ]
    }
}

module.exports = nextConfig
