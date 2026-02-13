/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Mode strict React
  reactStrictMode: true,

  // Externaliser tesseract.js pour éviter le bundling Turbopack
  serverExternalPackages: ['tesseract.js'],
};

module.exports = nextConfig;
