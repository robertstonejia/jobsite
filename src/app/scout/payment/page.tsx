'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ScoutPaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wechat' | 'alipay' | 'paypay'>('paypay')

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

  const handlePurchase = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/scout/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to QR code page
        router.push(`/payment/qrcode?paymentId=${data.payment.id}&method=${selectedPaymentMethod}&type=scout`)
      } else {
        const error = await response.json()
        alert(`エラー: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('支払いの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getAmount = () => {
    if (selectedPaymentMethod === 'paypay') {
      return '¥3,000'
    } else {
      return '150元'
    }
  }

  // Check if scout access is active
  const now = new Date()
  const hasScoutAccess =
    company?.hasScoutAccess &&
    company?.scoutAccessExpiry &&
    new Date(company.scoutAccessExpiry) > now

  // Check if subscription is active
  const hasActiveSubscription =
    company?.subscriptionPlan !== 'FREE' &&
    company?.subscriptionExpiry &&
    new Date(company.subscriptionExpiry) > now

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">スカウト機能の購入</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
          </div>

          {/* Subscription Required Warning - Show first */}
          {!hasActiveSubscription && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🚫</span>
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">月額会員プランへの登録が必要です</h3>
                  <p className="text-red-700 mb-3">
                    スカウト機能を利用する前に、月額会員プランへの登録が必要です。
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/company/subscription')}
                    className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
                  >
                    月額会員プランに登録する
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Status - Only show if subscription is active */}
          {hasActiveSubscription && hasScoutAccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">スカウト機能は有効です</h3>
                  <p className="text-green-700">
                    <strong>有効期限:</strong> {new Date(company.scoutAccessExpiry).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">スカウト機能について</h2>
            <div className="border-b pb-6 mb-6">
              <p className="text-gray-600 mt-2 mb-4">
                優秀なエンジニアに直接アプローチし、効率的な採用活動を実現します。
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">含まれる機能:</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  エンジニア検索機能（スキル・経験年数で検索）
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  スカウトメッセージの送信
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  エンジニアのプロフィール閲覧
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  1ヶ月間の利用権限
                </li>
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
                  <p className="text-sm text-gray-500">3,000円 / 月</p>
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
                  <p className="text-sm text-gray-500">150元 / 月</p>
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
                  <p className="text-sm text-gray-500">150元 / 月</p>
                </div>
                <div className="text-2xl">🅰️</div>
              </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>お支払いについて:</strong>
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• 初回: 今すぐ{getAmount()}をお支払いいただき、即座にスカウト機能が有効になります</li>
                <li>• 有効期間: 30日間</li>
                <li>• 自動更新はありません。継続利用の場合は再度お支払いが必要です</li>
                <li className="font-semibold text-red-700">• 注意: 一度購入されたプラン・サービスの料金については、理由の如何を問わず返金はいたしません</li>
              </ul>
            </div>

            <button
              onClick={handlePurchase}
              disabled={loading || hasScoutAccess || !hasActiveSubscription}
              className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold hover:bg-primary-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : !hasActiveSubscription ? '月額会員プランへの登録が必要です' : hasScoutAccess ? 'すでに購入済みです' : `${getAmount()} で購入する`}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
