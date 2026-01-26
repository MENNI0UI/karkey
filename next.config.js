const path = require("path");

/** @type {import('next').NextConfig} */
// Build-time remotePatterns will be derived from environment variables so
// you only need to update `.env.local` (or your host env) before deploy.
const remotePatterns = [];

// Always allow localhost during development
remotePatterns.push(
  { protocol: "http", hostname: "localhost", port: "3000", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", port: "3000", pathname: "/**" }
);

// If a STORAGE_BASE_URL is set (CDN or custom domain), add its hostname
try {
  const sb = process.env.STORAGE_BASE_URL || process.env.R2_PUBLIC_DOMAIN || "";
  if (sb && sb.trim() !== "") {
    const u = new URL(sb);
    // URL.protocol yields 'http:' or 'https:' -> strip trailing ':' to satisfy Next.js
    remotePatterns.push({ protocol: u.protocol.replace(/:$/, ""), hostname: u.hostname, pathname: "/**" });
  }
} catch (e) {
  // ignore bad URL
}

// If S3 bucket + region provided, allow bucket.s3.region.amazonaws.com host
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "";
if (S3_BUCKET && S3_REGION) {
  const hostname = `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
  remotePatterns.push({ protocol: "https", hostname, pathname: "/**" });
} else if (S3_BUCKET) {
  // allow generic s3 host for unknown region
  remotePatterns.push({ protocol: "https", hostname: `${S3_BUCKET}.s3.amazonaws.com`, pathname: "/**" });
}

// If NEXT_PUBLIC_SITE_URL is set, allow images from the same host
try {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (site && site.trim() !== "") {
    const u = new URL(site);
    remotePatterns.push({ protocol: u.protocol.replace(/:$/, ""), hostname: u.hostname, pathname: "/**" });
  }
} catch (e) { }

const nextConfig = {
  // output: 'standalone', // Uncomment this line when deploying to VPS!
  reactStrictMode: true,
  // Optimize images for better performance
  images: {
    remotePatterns,
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Reduce device sizes for faster loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tsparticles/react',
      '@tsparticles/slim',
      '@tsparticles/engine',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-accordion',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-slider',
      '@radix-ui/react-scroll-area',
      'recharts',
      'framer-motion',
      'react-day-picker',
      'embla-carousel-react',
      'cmdk',
      'sonner',
    ],
    serverActions: {
      bodySizeLimit: '100mb',
    },
    middlewareClientMaxBodySize: '100mb',
    // instrumentationHook is enabled by default in Next.js 15+
  },
  webpack: (config, { dev }) => {
    // Ensure webpack understands the '@' path alias (maps to project root)
    try {
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      }
    } catch (e) { }
    if (dev) {
      // Use glob strings (not RegExp) to satisfy webpack schema
      config.watchOptions = {
        ignored: [
          // ignore local caches and uploaded assets to avoid triggering hot-reload loops
          "**/.cache/**",
          "**/public/uploads/**",
          "**/node_modules/**",
          "**/.next/**",
        ],
        // Optional: enable polling if filesystem notifications are unreliable
        // poll: 1000,
      };
    }
    return config;
  },
  async headers() {
    const config = [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' }
        ],
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      const hsts = {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      }
      // find the /:path* rule and push hsts
      const rule = config[0];
      if (rule) rule.headers.push(hsts);
    }

    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withPWA(withBundleAnalyzer(nextConfig));
