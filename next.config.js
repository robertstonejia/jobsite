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
  // Force new build - cache bust v3 - timestamp based
  generateBuildId: async () => {
    return `v3-${Date.now()}`
  },
  // Completely disable caching
  webpack: (config, { isServer }) => {
    config.cache = false
    // Disable module concatenation which can cache
    config.optimization = config.optimization || {}
    config.optimization.concatenateModules = false
    return config
  },
  // Disable SWC minification cache
  swcMinify: false,
}

module.exports = nextConfig
