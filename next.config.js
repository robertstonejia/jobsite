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
      exclude: ['error', 'warn'],
    } : false,
  },
  // キャッシュヘッダー設定
  async headers() {
    return [
      // ダッシュボードページはキャッシュしない（動的コンテンツ）
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      // 静的アセットは長期キャッシュ
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
