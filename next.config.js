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
  // 本番環境でconsole.logを削除
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],  // エラーと警告は残す
    } : false,
  },
  // Force new build - cache bust v3 - timestamp based
  generateBuildId: async () => {
    return `v3-${Date.now()}`
  },
}

module.exports = nextConfig
