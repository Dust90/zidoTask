/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ibulrcdlymnjafwxohdq.supabase.co', 'avatars.githubusercontent.com'],
  },
};

module.exports = nextConfig;
