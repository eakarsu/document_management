const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: resolve(__dirname, '..'),
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
    NEXT_PUBLIC_COMPANY_LOCATION: process.env.NEXT_PUBLIC_COMPANY_LOCATION,
  },
  images: {
    remotePatterns: process.env.NODE_ENV === 'development'
      ? [{ protocol: 'http', hostname: 'localhost' }]
      : [],
    formats: ['image/webp', 'image/avif'],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; base-uri 'self'; object-src 'none'; connect-src 'self' ws: wss:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; frame-src 'self' blob:; form-action 'self'; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
  // Redirects - removed dashboard redirect to allow middleware to handle authentication
  async redirects() {
    return [];
  },
  // The backend is the sole authorization and data boundary. beforeFiles
  // prevents legacy Next handlers from bypassing ABAC, audit or retention.
  async rewrites() {
    const backend = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000';
    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${backend}/api/:path*` },
        { source: '/graphql', destination: `${backend}/graphql` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
