import type { NextConfig } from 'next';

function getApiHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url.includes('localhost')) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const apiHostname = getApiHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3002' },
      ...(apiHostname
        ? [{ protocol: 'https' as const, hostname: apiHostname }]
        : []),
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
