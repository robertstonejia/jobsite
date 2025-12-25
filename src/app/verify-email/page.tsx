'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const email = searchParams.get('email')
  const codeFromUrl = searchParams.get('code')
  const verificationType = searchParams.get('type') || 'email'

  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)

  // URLにコードが含まれている場合、自動検証
  useEffect(() => {
    if (codeFromUrl && userId) {
      handleVerify(codeFromUrl)
    }
  }, [codeFromUrl, userId])

  const handleVerify = async (code?: string) => {
    const verifyCode = code || verificationCode

    if (!verifyCode || !userId) {
      setError('検証コードとユーザーIDが必要です')
      return
    }

    if (verifyCode.length !== 6) {
      setError('検証コードは6桁の数字です')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          verificationCode: verifyCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 2000)
      } else {
        setError(data.error || 'メール検証に失敗しました')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('検証中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!userId) {
      setError('ユーザーIDが必要です')
      return
    }

    setResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('検証メールを再送信しました。メールをご確認ください。')
      } else {
        setError(data.error || 'メールの再送信に失敗しました')
      }
    } catch (err) {
      console.error('Resend error:', err)
      setError('再送信中にエラーが発生しました')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleVerify()
  }

  if (success) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">メール認証が完了しました！</h2>
              <p className="text-gray-600 mb-6">
                ご登録ありがとうございます。<br />
                まもなくログインページに移動します。
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 ${verificationType === 'phone' ? 'bg-green-100' : 'bg-primary-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {verificationType === 'phone' ? (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {verificationType === 'phone' ? '電話番号の確認' : 'メールアドレスの確認'}
              </h1>
              {email && (
                <p className="text-gray-600">
                  <span className="font-semibold">{email}</span> に<br />
                  確認コードを送信しました
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  6桁の検証コードを入力してください
                </label>
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="000000"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className={`w-full bg-gradient-to-r ${verificationType === 'phone' ? 'from-green-500 to-teal-500' : 'from-primary-500 to-secondary-500'} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50`}
              >
                {loading ? '確認中...' : verificationType === 'phone' ? '電話番号を確認する' : 'メールアドレスを確認する'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                メールが届かない場合
              </p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary-500 hover:text-primary-600 font-semibold disabled:opacity-50"
              >
                {resending ? '送信中...' : '確認メールを再送信'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                ※ 検証コードは30分間有効です<br />
                ※ 迷惑メールフォルダもご確認ください
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-gray-600 hover:text-gray-800 text-sm">
                ← ログインページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
