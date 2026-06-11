// File: next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Strip console.* calls in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  images: {
    // Serve modern formats — Next.js negotiates avif/webp automatically
    formats: ["image/avif", "image/webp"],
    domains: [],
  },

  // Compress responses with gzip
  compress: true,

  // Faster production JS output
  swcMinify: true,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    // Inline critical CSS — eliminates a render-blocking stylesheet request
    optimizeCss: true,
    // Preload fonts and other assets referenced in JS
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
