import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // QRコードデータを含めて返す
    // transactionIdがQRコードデータの場合もあれば、実際のトランザクションIDの場合もある
    const qrCodeData = payment.status === 'pending' && payment.transactionId?.startsWith('weixin://') ||
                       payment.transactionId?.startsWith('https://qr.alipay.com/') ||
                       payment.transactionId?.startsWith('paypay://')
      ? payment.transactionId
      : null

    return NextResponse.json({
      ...payment,
      qrCodeData,
    })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
}
