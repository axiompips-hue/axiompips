// File: next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Configure allowed image domains if needed later
  images: {
    domains: [],
  },

  // Experimental features (none needed for now)
  experimental: {},
};

export default nextConfig;