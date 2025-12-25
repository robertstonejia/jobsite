'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Dialog from '@/components/Dialog'
import { useDialog } from '@/hooks/useDialog'

export default function CompanySubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wechat' | 'alipay' | 'paypay'>('paypay')
  const { dialog, showConfirm, showSuccess, showError, closeDialog } = useDialog()

  useEffect(() => {
    fetchCompanyProfile()
  }, [])

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch('/api/company/profile')
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
      }
    } catch (error) {
      console.error('Error fetching company profile:', error)
    }
  }

  const handleSubscribe = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'BASIC',
          paymentMethod: selectedPaymentMethod,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Redirect to QR code page for all payment methods
        if (selectedPaymentMethod === 'wechat' || selectedPaymentMethod === 'alipay' || selectedPaymentMethod === 'paypay') {
          router.push(`/payment/qrcode?paymentId=${data.payment.id}&method=${selectedPaymentMethod}`)
        } else {
          // Fallback
          router.push('/dashboard/company?payment=success')
        }
      } else {
        const error = await response.json()
        showError(`エラー: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      showError('支払いの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    showConfirm(
      'サブスクリプションをキャンセルしますか？キャンセル後は求人投稿とIT案件投稿ができなくなります。',
      async () => {
        try {
          setLoading(true)

          const response = await fetch('/api/subscription/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })

          if (response.ok) {
            showSuccess('サブスクリプションをキャンセルしました。再度利用する場合は、支払いが必要です。')
            setTimeout(() => {
              router.push('/dashboard/company')
            }, 2000)
          } else {
            const error = await response.json()
            showError(`エラー: ${error.error}`)
          }
        } catch (error) {
          console.error('Error canceling subscription:', error)
          showError('キャンセルに失敗しました')
        } finally {
          setLoading(false)
        }
      },
      '確認'
    )
  }

  const MONTHLY_FEE = 3680
  const MONTHLY_FEE_CNY = 180

  const getAmount = () => {
    if (selectedPaymentMethod === 'paypay') {
      return `¥${MONTHLY_FEE.toLocaleString()}`
    } else {
      return `${MONTHLY_FEE_CNY}元`
    }
  }

  const getAmountNumber = () => {
    if (selectedPaymentMethod === 'paypay') {
      return MONTHLY_FEE.toLocaleString()
    } else {
      return `${MONTHLY_FEE_CNY}元`
    }
  }

  const getPlanName = (plan: string) => {
    if (plan === 'BASIC') {
      return '基本プラン'
    }
    return plan
  }

  // Check if subscription is active
  const now = new Date()
  const hasActiveSubscription =
    company?.subscriptionPlan !== 'FREE' &&
    company?.subscriptionExpiry &&
    new Date(company.subscriptionExpiry) > now

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">月額会員費のお支払い</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 戻る
          </button>
        </div>

        {/* Current Subscription Status */}
        {hasActiveSubscription && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">現在のプラン</h3>
                  <p className="text-green-700 mb-1">
                    <strong>プラン:</strong> {getPlanName(company.subscriptionPlan)}
                  </p>
                  <p className="text-green-700">
                    <strong>有効期限:</strong> {new Date(company.subscriptionExpiry).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                解約する
              </button>
            </div>
          </div>
        )}

        {!hasActiveSubscription && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-yellow-800 mb-2">有料プランが必要です</h3>
                <p className="text-yellow-700">
                  求人投稿とIT案件投稿を利用するには、月額会員プランへの登録が必要です。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">料金プラン</h2>
          <div className="border-b pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-medium">ベーシックプラン</h3>
                <p className="text-gray-600 mt-2">
                  求人掲載、応募者管理、メッセージング機能が利用可能
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-500">{getAmount()}</p>
                <p className="text-sm text-gray-500">/ 月</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">含まれる機能:</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                無制限の求人掲載
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                応募者とのメッセージング
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                応募通知メール
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                企業プロフィールページ
              </li>
              {company?.isITCompany && (
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  IT案件情報の投稿 (1日5件まで)
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-6">支払い方法を選択</h2>

          <div className="space-y-4 mb-8">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="paypay"
                checked={selectedPaymentMethod === 'paypay'}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="mr-4"
              />
              <div className="flex-1">
                <p className="font-medium">PayPay</p>
                <p className="text-sm text-gray-500">¥{MONTHLY_FEE.toLocaleString()} / 月</p>
              </div>
              <div className="text-2xl">💰</div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="wechat"
                checked={selectedPaymentMethod === 'wechat'}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="mr-4"
              />
              <div className="flex-1">
                <p className="font-medium">WeChat Pay (微信支付)</p>
                <p className="text-sm text-gray-500">{MONTHLY_FEE_CNY}元 / 月</p>
              </div>
              <div className="text-2xl">💬</div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="alipay"
                checked={selectedPaymentMethod === 'alipay'}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="mr-4"
              />
              <div className="flex-1">
                <p className="font-medium">Alipay (支付宝)</p>
                <p className="text-sm text-gray-500">{MONTHLY_FEE_CNY}元 / 月</p>
              </div>
              <div className="text-2xl">🅰️</div>
            </label>

          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 mb-2">
              <strong>お支払いについて:</strong>
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>• 初回: 今すぐ{getAmountNumber()}をお支払いいただき、即座にプランが有効になります</li>
              <li>• 翌月以降: 毎月{getAmountNumber()}が自動的に請求されます</li>
              <li>• 解約: いつでも解約可能です</li>
              <li className="font-semibold text-red-700">• 注意: 一度購入されたプラン・サービスの料金については、理由の如何を問わず返金はいたしません</li>
            </ul>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading || hasActiveSubscription}
            className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold hover:bg-primary-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '処理中...' : hasActiveSubscription ? 'すでに登録済みです' : `${getAmount()}/月 で登録する`}
          </button>
        </div>
      </div>

      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={dialog.onConfirm}
      />
    </div>
  )
}
