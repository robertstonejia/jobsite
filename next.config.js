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
  // Force new build - cache bust
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

module.exports = nextConfig
