import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Alt-Svc',
            value: 'clear'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
