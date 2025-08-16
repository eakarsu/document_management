/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ['localhost', 'minio', 's3.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable webpack 5 features
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Add support for importing PDFs
    config.module.rules.push({
      test: /\.pdf$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });

    // Add support for web workers
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    });

    return config;
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
            value: "default-src 'self'; connect-src 'self' http://localhost:4000 ws://localhost:* wss://localhost:*; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:*; font-src 'self' data:; frame-src 'self' http://localhost:4000 https://localhost:4000 blob:;",
          },
        ],
      },
    ];
  },
  // Redirects - removed dashboard redirect to allow middleware to handle authentication
  async redirects() {
    return [];
  },
  // Rewrites for API proxy - proxy all /api calls to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable SWC minification
  swcMinify: true,
};

module.exports = nextConfig;