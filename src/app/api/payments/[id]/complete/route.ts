import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * このエンドポイントは無効化されています
 * 支払いは決済プロバイダーのWebhookによってのみ完了できます
 *
 * 手動での支払い完了を防ぐため、このエンドポイントは常にエラーを返します
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error: 'Manual payment completion is not allowed. Payments are automatically verified via payment provider webhooks.',
      message: '手動での支払い完了はできません。決済プロバイダーによる自動検証が必要です。'
    },
    { status: 403 }
  )
}
