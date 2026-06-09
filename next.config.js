/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/assets/favicon.ico",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
