'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSent(true)
      } else {
        const data = await response.json()
        setError(data.error || 'エラーが発生しました')
      }
    } catch {
      setError('リクエスト中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {sent ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">メールを送信しました</h2>
                <p className="text-gray-600 mb-6">
                  入力されたメールアドレスにパスワードリセットのリンクを送信しました。<br />
                  メールをご確認ください。
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  ※ メールが届かない場合は、迷惑メールフォルダもご確認ください。<br />
                  ※ リンクは30分間有効です。
                </p>
                <Link
                  href="/login"
                  className="text-primary-500 hover:text-primary-600 font-semibold"
                >
                  ← ログインページに戻る
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">パスワードをリセット</h1>
                  <p className="text-gray-600">
                    ご登録のメールアドレスを入力してください。<br />
                    パスワードリセットのリンクを送信します。
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                      placeholder="example@email.com"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {loading ? '送信中...' : 'リセットメールを送信'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-gray-600 hover:text-gray-800 text-sm">
                    ← ログインページに戻る
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
