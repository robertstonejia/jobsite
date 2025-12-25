'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setShowVerifiedMessage(true)
      setTimeout(() => setShowVerifiedMessage(false), 5000)
    }
  }, [searchParams])

  const handleResendVerification = async () => {
    setResendingEmail(true)
    setResendSuccess(false)
    setError('')

    try {
      // First, find the user ID by email
      const response = await fetch('/api/auth/get-user-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        setError('ユーザーが見つかりませんでした')
        setResendingEmail(false)
        return
      }

      const userData = await response.json()

      // Send verification email
      const verifyResponse = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.userId }),
      })

      if (verifyResponse.ok) {
        setResendSuccess(true)
        setError('')
        setTimeout(() => setResendSuccess(false), 5000)
      } else {
        setError('検証メールの送信に失敗しました')
      }
    } catch (err) {
      console.error('Error resending verification:', err)
      setError('検証メールの送信に失敗しました')
    } finally {
      setResendingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotVerified(false)
    setResendSuccess(false)
    setLoading(true)

    try {
      console.log('Starting login with email:', email)

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        console.error('SignIn error:', result.error)
        if (result.error === 'EMAIL_NOT_VERIFIED' || result.error.includes('EMAIL_NOT_VERIFIED')) {
          setEmailNotVerified(true)
          setError('メールアドレスが確認されていません。登録時に送信された確認メールをご確認ください。')
        } else if (result.error === 'CredentialsSignin') {
          setEmailNotVerified(false)
          setError('メールアドレスまたはパスワードが正しくありません')
        } else {
          setEmailNotVerified(false)
          setError('ログインに失敗しました。もう一度お試しください。')
        }
        setLoading(false)
        return
      }

      if (result?.ok) {
        console.log('Login successful, waiting for session...')

        // Wait a bit longer for session cookie to be set
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Use getSession from next-auth/react
        const session = await getSession()

        console.log('Session data:', session)

        // Check if email is verified
        if (session?.user && session.user.emailVerified === false) {
          console.log('Email not verified')
          setEmailNotVerified(true)
          setError('メールアドレスが確認されていません。登録時に送信された確認メールをご確認ください。')
          setLoading(false)
          return
        }

        const userRole = session?.user?.role

        console.log('User role:', userRole)

        // Redirect based on user role
        if (userRole === 'COMPANY') {
          console.log('Redirecting to company dashboard')
          window.location.href = '/dashboard/company'
        } else if (userRole === 'ENGINEER') {
          console.log('Redirecting to engineer dashboard')
          window.location.href = '/dashboard/engineer'
        } else {
          console.log('No role found, redirecting to home. Session:', session)
          window.location.href = '/'
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('ログインに失敗しました')
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
            <p className="text-gray-600">アカウントにログインしてください</p>
          </div>

          {showVerifiedMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              メールアドレスの確認が完了しました。ログインしてください。
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              検証メールを再送信しました。メールをご確認ください。
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
              {emailNotVerified && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="mt-3 w-full bg-white text-primary-600 border border-primary-600 py-2 px-4 rounded-lg hover:bg-primary-50 transition disabled:opacity-50"
                >
                  {resendingEmail ? '送信中...' : '検証メールを再送信'}
                </button>
              )}
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
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="パスワードを入力"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-gray-600">
              アカウントをお持ちでないですか?
            </p>
            <div className="space-y-2">
              <Link
                href="/engineer/register"
                className="block w-full py-2 px-4 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition"
              >
                技術者として登録
              </Link>
              <Link
                href="/company/register"
                className="block w-full py-2 px-4 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition"
              >
                企業として登録
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
