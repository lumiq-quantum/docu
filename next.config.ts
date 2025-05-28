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
  webpack: (config, { isServer }) => {
    // Fix for 'canvas' module not found error with pdfjs-dist
    // See https://github.com/mozilla/pdf.js/issues/17086
    // And https://github.com/wojtekmaj/react-pdf/issues/1864
    if (!isServer) { // Apply this rule only for client-side bundles
      config.externals.push('canvas');
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
