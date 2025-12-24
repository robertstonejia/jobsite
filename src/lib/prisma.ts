import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// グローバルに保持（接続プーリング最適化）
// 開発環境: ホットリロード時の接続リーク防止
// 本番環境: サーバーレス関数間での接続再利用
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
