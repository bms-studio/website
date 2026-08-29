/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.8upload.com' },
      { protocol: 'https', hostname: 'filegoat.s3.de.io.cloud.ovh.net' },
      { protocol: 'https', hostname: 'media.giphy.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

module.exports = nextConfig
