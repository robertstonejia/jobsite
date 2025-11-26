/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Disable static optimization for pages using useSearchParams
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Force new build - cache bust v2
  generateBuildId: async () => {
    // Using environment variable for even stronger cache busting
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
  },
  // Disable webpack cache completely for this build
  webpack: (config, { isServer }) => {
    config.cache = false
    return config
  },
}

module.exports = nextConfig
