'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PayPayPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const paymentId = searchParams.get('paymentId')

    // Simulate payment processing
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Confirm payment and activate subscription
          confirmPayment(paymentId)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, searchParams])

  const confirmPayment = async (paymentId: string | null) => {
    if (!paymentId) {
      router.push('/dashboard/company?payment=error')
      return
    }

    setConfirming(true)
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })

      if (response.ok) {
        router.push('/dashboard/company?payment=success')
      } else {
        router.push('/dashboard/company?payment=error')
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      router.push('/dashboard/company?payment=error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">PayPay支払い処理中</h1>
          <p className="text-gray-600">支払いを処理しています...</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-sm text-blue-800 mb-4">
            <strong>支払い金額: ¥10,000</strong>
          </p>
          <p className="text-sm text-blue-800 mb-4">
            本番環境では、PayPayアプリが自動的に開きます。
          </p>
          <div className="space-y-2 text-left text-sm text-gray-700">
            <p>1. PayPayアプリで支払いを確認</p>
            <p>2. 指紋認証またはパスコードで承認</p>
            <p>3. 支払い完了後、自動的に戻ります</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>

        <p className="text-gray-600">
          {confirming ? '支払いを確認中...' : `${countdown}秒後に支払いを確認します...`}
        </p>

        <button
          onClick={() => confirmPayment(searchParams.get('paymentId'))}
          disabled={confirming}
          className="mt-6 w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
        >
          今すぐ支払いを確認
        </button>
      </div>
    </div>
  )
}
