/**
 * 服务器端缓存工具
 * 用于 Vercel 云端部署，减少数据库查询
 */

interface CacheEntry<T> {
  data: T
  expiry: number
}

// 内存缓存（在 serverless 函数的生命周期内有效）
const memoryCache = new Map<string, CacheEntry<unknown>>()

/**
 * 从缓存获取数据，如果不存在则执行 fetcher 并缓存结果
 * @param key 缓存键
 * @param fetcher 数据获取函数
 * @param ttlSeconds 缓存时间（秒），默认60秒
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const now = Date.now()
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined

  // 如果缓存有效，直接返回
  if (cached && cached.expiry > now) {
    return cached.data
  }

  // 执行 fetcher 获取新数据
  const data = await fetcher()

  // 存入缓存
  memoryCache.set(key, {
    data,
    expiry: now + ttlSeconds * 1000,
  })

  return data
}

/**
 * 清除指定键的缓存
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key)
}

/**
 * 清除所有以指定前缀开头的缓存
 */
export function invalidateCacheByPrefix(prefix: string): void {
  const keys = Array.from(memoryCache.keys())
  for (const key of keys) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key)
    }
  }
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  memoryCache.clear()
}

/**
 * 生成缓存响应头
 * @param maxAge 客户端缓存时间（秒）
 * @param staleWhileRevalidate 过期后仍可使用的时间（秒）
 */
export function getCacheHeaders(
  maxAge: number = 60,
  staleWhileRevalidate: number = 120
): Record<string, string> {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  }
}

/**
 * 生成私有缓存响应头（用于用户相关数据）
 */
export function getPrivateCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  }
}

// 常用缓存键前缀
export const CacheKeys = {
  JOBS_LIST: 'jobs:list',
  PROJECTS_LIST: 'projects:list',
  SKILLS_LIST: 'skills:list',
  STATS: 'stats:global',
  COMPANY_DASHBOARD: 'company:dashboard',
  ENGINEER_DASHBOARD: 'engineer:dashboard',
} as const
