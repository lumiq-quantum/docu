import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Added for potential bot avatar placeholders if not local
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net', 
        port: '',
        pathname: '/**',
      },
      { // Added for potential bot avatar placeholders if not local
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
