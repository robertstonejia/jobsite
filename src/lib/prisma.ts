import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// 開発環境ではグローバルに保持（ホットリロード対策）
// 本番環境でもグローバルに保持（接続プーリング最適化）
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
