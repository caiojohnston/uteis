/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // @react-pdf/renderer uses canvas for image processing; alias it out for SSR
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
