'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Dialog from '@/components/Dialog'
import { useDialog } from '@/hooks/useDialog'

export default function QRCodePaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const method = searchParams.get('method')
  const type = searchParams.get('type') // 'scout' or null (subscription)

  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [checking, setChecking] = useState(false)

  const { dialog, showConfirm, showSuccess, showError, closeDialog } = useDialog()

  useEffect(() => {
    if (paymentId) {
      fetchPaymentInfo()
      // Start polling for payment status
      const interval = setInterval(checkPaymentStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [paymentId])

  const fetchPaymentInfo = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`)
      if (response.ok) {
        const data = await response.json()
        setPayment(data)

        // WeChat PayとAlipayは事前にアップロードしたQRコード画像を使用
        if (data.paymentMethod === 'wechat') {
          setQrCodeUrl('/qrcodes/wechat.png')
        } else if (data.paymentMethod === 'alipay') {
          setQrCodeUrl('/qrcodes/alipay.png')
        } else if (data.qrCodeData) {
          // PayPayやその他の決済方法: プロバイダーから返されたQRコードデータを使用
          if (data.qrCodeData.startsWith('http')) {
            setQrCodeUrl(data.qrCodeData)
          } else {
            // QRコードデータをQRコード画像に変換
            const qrData = encodeURIComponent(data.qrCodeData)
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`)
          }
        } else {
          // フォールバック: 決済情報からQRコードを生成
          const qrData = encodeURIComponent(JSON.stringify({
            paymentId: data.id,
            amount: data.amount,
            currency: data.currency,
            method: data.paymentMethod
          }))
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`)
        }
      }
    } catch (error) {
      console.error('Error fetching payment:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (checking) return

    setChecking(true)
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`)
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'completed') {
          // Payment successful, redirect to dashboard
          router.push('/dashboard/company?payment=success')
        } else if (data.status === 'failed') {
          router.push('/dashboard/company?payment=error')
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setChecking(false)
    }
  }
  // 支払い完了リクエストを送信
  const handleRequestApproval = async () => {
    showConfirm(
      '支払いを完了しましたか？\n\n管理者に確認メールを送信します。',
      async () => {
        try {
          const response = await fetch(`/api/payments/${paymentId}/mark-complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          })

          const data = await response.json()

          if (response.ok) {
            showSuccess(data.message || '管理者に確認メールを送信しました。承認をお待ちください。')
            // 承認待ち状態を表示
            setPayment({ ...payment, status: 'pending_approval' })
          } else {
            showError('エラー: ' + (data.error || 'Unknown error'))
          }
        } catch (error) {
          console.error('Error requesting approval:', error)
          showError('エラーが発生しました')
        }
      },
      '確認'
    )
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'wechat':
        return 'WeChat Pay (微信支付)'
      case 'alipay':
        return 'Alipay (支付宝)'
      case 'paypay':
        return 'PayPay'
      case 'credit':
        return 'クレジットカード'
      default:
        return method
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'wechat':
        return '💬'
      case 'alipay':
        return '🅰️'
      case 'paypay':
        return '💰'
      case 'credit':
        return '💳'
      default:
        return '💳'
    }
  }

  const getPaymentAmount = (method: string) => {
    // Check if this is a scout payment
    const isScout = type === 'scout'

    switch (method) {
      case 'wechat':
      case 'alipay':
        const cnyAmount = isScout ? 150 : 180
        return { amount: cnyAmount, currency: '元 (CNY)', displayText: `${cnyAmount}元` }
      case 'paypay':
        const jpyAmount = isScout ? 3000 : 3680
        return { amount: jpyAmount, currency: '円 (JPY)', displayText: `${jpyAmount.toLocaleString()}円` }
      default:
        return { amount: payment.amount, currency: '円 (JPY)', displayText: `¥${payment.amount.toLocaleString()}` }
    }
  }

  const getPayPayId = () => {
    return 'robertstonejia'
  }

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'BASIC':
        return '基本プラン'
      case 'PREMIUM':
        return 'プレミアムプラン'
      default:
        return plan
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
        <Footer />
      </>
    )
  }

  if (!payment) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">支払い情報が見つかりません</h1>
            <button
              onClick={() => router.push('/dashboard/company/subscription')}
              className="text-primary-500 hover:underline"
            >
              戻る
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{getPaymentIcon(payment.paymentMethod)}</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getPaymentMethodName(payment.paymentMethod)}で支払い
              </h1>
              <p className="text-gray-600">
                {payment.paymentMethod === 'paypay'
                  ? 'PayPay IDに送金して支払いを完了してください'
                  : 'QRコードをスキャンして支払いを完了してください'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">ℹ️</span>
                <h3 className="text-lg font-bold text-blue-800">お支払い金額</h3>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-900">
                  {getPaymentAmount(payment.paymentMethod).displayText}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {getPaymentAmount(payment.paymentMethod).currency}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  プラン: {getPlanName(payment.plan)}
                </p>
                {payment.paymentMethod === 'paypay' && (
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <p className="text-sm text-blue-700 mb-1">PayPay ID:</p>
                    <p className="text-2xl font-bold text-blue-900">{getPayPayId()}</p>
                  </div>
                )}
              </div>
            </div>

            {payment.paymentMethod !== 'paypay' && (
              <div className="text-center mb-8">
                <div className="inline-block p-6 bg-white border-4 border-gray-300 rounded-lg shadow-lg">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">QRコードを生成中...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-yellow-800 mb-2">支払い手順:</h4>
              {payment.paymentMethod === 'credit' ? (
                <ol className="text-sm text-yellow-800 space-y-1 ml-4">
                  <li>1. 上のQRコードをスキャンまたは保存</li>
                  <li>2. クレジットカード支払いサイトにアクセス</li>
                  <li>3. カード情報を入力</li>
                  <li>4. 支払いを完了</li>
                  <li>5. 支払い完了後、自動的に確認されます</li>
                </ol>
              ) : payment.paymentMethod === 'wechat' || payment.paymentMethod === 'alipay' ? (
                <ol className="text-sm text-yellow-800 space-y-1 ml-4">
                  <li>1. {getPaymentMethodName(payment.paymentMethod)}アプリを開く</li>
                  <li>2. スキャン機能を選択</li>
                  <li>3. 上のQRコードをスキャン</li>
                  <li>4. 支払い金額（<span className="font-bold text-red-700">{getPaymentAmount(payment.paymentMethod).displayText}</span>）を確認</li>
                  <li>5. 中国元(CNY)での支払いを完了</li>
                  <li>6. 「支払いを完了しました」ボタンを押してください</li>
                  <li className="text-red-700 font-semibold">※ 金額は<span className="underline">{getPaymentAmount(payment.paymentMethod).displayText}（人民元）</span>です。</li>
                </ol>
              ) : payment.paymentMethod === 'paypay' ? (
                <ol className="text-sm text-yellow-800 space-y-1 ml-4">
                  <li>1. PayPayアプリを開く</li>
                  <li>2. 「送る」を選択</li>
                  <li>3. PayPay ID「<span className="font-bold">{getPayPayId()}</span>」を入力</li>
                  <li>4. 支払い金額（<span className="font-bold text-red-700">{getPaymentAmount(payment.paymentMethod).displayText}</span>）を入力</li>
                  <li>5. 送金を完了</li>
                  <li>6. 「支払いを完了しました」ボタンを押してください</li>
                  <li className="text-red-700 font-semibold">※ PayPay ID: {getPayPayId()}</li>
                  <li className="text-red-700 font-semibold">※ 金額: {getPaymentAmount(payment.paymentMethod).displayText}</li>
                </ol>
              ) : (
                <ol className="text-sm text-yellow-800 space-y-1 ml-4">
                  <li>1. {getPaymentMethodName(payment.paymentMethod)}アプリを開く</li>
                  <li>2. スキャン機能を選択</li>
                  <li>3. 上のQRコードをスキャン</li>
                  <li>4. 支払い金額を確認</li>
                  <li>5. 支払いを完了</li>
                  <li>6. 「支払いを完了しました」ボタンを押してください</li>
                </ol>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-pulse flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                  <p className="text-lg font-semibold text-blue-800">支払い状況を自動確認中...</p>
                </div>
              </div>
              <p className="text-sm text-blue-700 text-center">
                決済が完了すると自動的に検出され、ダッシュボードに移動します。<br />
                このページを閉じずにお待ちください。
              </p>
            </div>

            <div className="space-y-3">
              {payment.status === 'pending_approval' ? (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">⏳</div>
                  <h3 className="text-lg font-bold text-yellow-800 mb-2">承認待ち</h3>
                  <p className="text-sm text-yellow-700">
                    管理者が支払いを確認しています。<br />
                    承認が完了すると自動的にダッシュボードに移動します。
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleRequestApproval}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
                >
                  支払いを完了しました
                </button>
              )}

              <button
                onClick={() => router.push('/dashboard/company/subscription')}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              ※ 「支払いを完了しました」ボタンをクリックすると、管理者に確認メールが送信されます。<br />
              管理者が実際の支払いを確認後、サブスクリプションが有効化されます。
            </p>
          </div>
        </div>
      </div>
      <Footer />

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
    </>
  )
}
