// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.opendota.com',
        pathname: '/apps/dota2/images/heroes/**', // ✅ Hero images
      },
      {
        protocol: 'https',
        hostname: 'cdn.opendota.com',
        pathname: '/ranks/**', // ✅ Rank icons
      },
    ],
  },
};

export default nextConfig;
