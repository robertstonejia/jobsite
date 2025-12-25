'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <>
      <Header />

      {/* Hero Section - Tech-Forward Design */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-white overflow-hidden">
        {/* Background decoration - tech style */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-violet-400/15 to-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 text-blue-700 px-4 py-2 rounded-full text-sm mb-6 border border-blue-200 shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              総合求人マッチングプラットフォーム
            </div>

            {/* Main Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
              <span className="block">キャリアの次のステップを</span>
              <span className="block mt-2 text-blue-600" style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                seekjobで見つけよう
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              豊富な求人とIT案件から、あなたにぴったりの機会を見つけましょう。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Link
                href="/engineer/register"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <span>求職者として登録</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/company/register"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
              >
                企業として登録
              </Link>
            </div>

            {/* Login Link */}
            {!session && (
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  すでにアカウントをお持ちですか？{' '}
                  <Link
                    href="/login"
                    className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition"
                  >
                    ログイン
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-16 sm:py-20 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              なぜseekjobが選ばれるのか
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              求職者と企業の双方にとって最適なマッチングを実現するための機能を提供しています
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={<BuildingIcon />}
              title="企業向け機能"
              description="簡単登録で企業ページを作成。求人情報の管理から応募者とのマッチングまで、すべてをワンストップで。"
            />
            <FeatureCard
              icon={<UserIcon />}
              title="応募者向け機能"
              description="スキルセットを登録して、最適な求人情報を受け取ろう。プロフィールで自分をアピール。"
            />
            <FeatureCard
              icon={<TargetIcon />}
              title="精密なマッチング"
              description="AIを活用した高精度なマッチングで、企業と応募者の最適な組み合わせを実現。"
            />
            <FeatureCard
              icon={<ChartIcon />}
              title="充実の管理機能"
              description="応募状況の確認、メッセージのやり取り、面接日程の調整など、採用活動を効率化。"
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title="安心のセキュリティ"
              description="個人情報は厳重に管理。安心して利用できる環境を提供します。"
            />
            <FeatureCard
              icon={<SupportIcon />}
              title="充実のサポート"
              description="登録から採用まで、専任スタッフがしっかりサポート。"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && stats.shouldShowStats && (
        <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">数字で見るseekjob</h2>
              <p className="text-gray-600">多くの求職者と企業様にご利用いただいています</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              <StatItem number={`${stats.companyCount.toLocaleString()}+`} label="登録企業数" />
              <StatItem number={`${stats.engineerCount.toLocaleString()}+`} label="登録応募者数" />
              <StatItem number={`${stats.matchingCount.toLocaleString()}+`} label="マッチング成功数" />
              <StatItem number={`${stats.satisfactionRate}%`} label="満足度" />
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <ContactSection />

      <Footer />
    </>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-blue-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="w-12 h-12 mb-5 p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-blue-600 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

// Icon Components
function BuildingIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function SupportIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
      <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1 sm:mb-2">{number}</h3>
      <p className="text-xs sm:text-sm md:text-base text-gray-600">{label}</p>
    </div>
  )
}

function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        })
      } else {
        setError(data.error || 'お問い合わせの送信に失敗しました')
      }
    } catch (err) {
      setError('お問い合わせの送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-16 sm:py-20 md:py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">お問い合わせ</h2>
          <p className="text-gray-600">
            ご質問・ご要望などございましたら、お気軽にお問い合わせください
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8">

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            お問い合わせを受け付けました。ご連絡ありがとうございます。
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              件名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              placeholder="お問い合わせの件名を入力してください"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              お問い合わせ内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-shadow resize-none"
              placeholder="お問い合わせ内容を詳しくご記入ください（10文字以上）"
            />
          </div>

          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : '送信する'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </section>
  )
}
