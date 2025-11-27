'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const role = (session?.user as any)?.role
    if (role === 'COMPANY') {
      fetchSubscriptionStatus()
    }
    fetchStats()
  }, [session])

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

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/company/profile')
      if (response.ok) {
        const data = await response.json()
        const now = new Date()
        const expiry = data.subscriptionExpiry ? new Date(data.subscriptionExpiry) : null
        const isActive = data.subscriptionPlan !== 'FREE' && expiry && expiry > now
        setHasActiveSubscription(isActive || false)
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    }
  }

  const handleAdvancedTalentClick = (e: React.MouseEvent) => {
    const role = (session?.user as any)?.role
    if (role === 'COMPANY' && !hasActiveSubscription) {
      e.preventDefault()
      if (confirm('高度人材企業の閲覧には有料プランへの登録が必要です。登録ページに移動しますか?')) {
        router.push('/dashboard/company/subscription')
      }
    }
  }
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-12 sm:py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">応募者と企業をつなぐ</h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8">最適なマッチングで、理想のキャリアと人材を</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/engineer/register"
              className="bg-white text-primary-500 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:-translate-y-1 hover:shadow-xl transition transform text-sm sm:text-base"
            >
              応募者として登録
            </Link>
            <Link
              href="/company/register"
              className="bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:-translate-y-1 hover:shadow-xl transition transform text-sm sm:text-base"
            >
              企業として登録
            </Link>
          </div>
        </div>
      </section>

      {/* 高度人材加点制度対応企業 Section */}
      <section className="bg-blue-50 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-500 mb-3 sm:mb-4">高度人材加点制度対応企業</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
              高度人材ポイント制度に対応している企業の求人情報を検索できます
            </p>
            <Link
              href="/companies/advanced-talent"
              onClick={handleAdvancedTalentClick}
              className="inline-block bg-primary-500 text-white font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:-translate-y-1 hover:shadow-xl transition transform text-sm sm:text-base"
            >
              高度人材加点対応企業を探す
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto py-8 sm:py-12 md:py-16 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12 text-primary-500">選ばれる理由</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <FeatureCard
            icon="🏢"
            title="企業向け機能"
            description="簡単登録で企業ページを作成。求人情報の管理から応募者とのマッチングまで、すべてをワンストップで。"
          />
          <FeatureCard
            icon="👨‍💻"
            title="応募者向け機能"
            description="スキルセットを登録して、最適な求人情報を受け取ろう。プロフィールで自分をアピール。"
          />
          <FeatureCard
            icon="🎯"
            title="精密なマッチング"
            description="AIを活用した高精度なマッチングで、企業と応募者の最適な組み合わせを実現。"
          />
          <FeatureCard
            icon="📊"
            title="充実の管理機能"
            description="応募状況の確認、メッセージのやり取り、面接日程の調整など、採用活動を効率化。"
          />
          <FeatureCard
            icon="🔒"
            title="安心のセキュリティ"
            description="個人情報は厳重に管理。安心して利用できる環境を提供します。"
          />
          <FeatureCard
            icon="💬"
            title="充実のサポート"
            description="登録から採用まで、専任スタッフがしっかりサポート。"
          />
        </div>
      </section>

      {/* Stats Section */}
      {stats && stats.shouldShowStats && (
        <section className="bg-gray-50 py-8 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12">TechJobの実績</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
              <StatItem number={`${stats.companyCount.toLocaleString()}+`} label="登録企業数" />
              <StatItem number={`${stats.engineerCount.toLocaleString()}+`} label="登録応募者数" />
              <StatItem number={`${stats.matchingCount.toLocaleString()}+`} label="マッチング成功数" />
              <StatItem number={`${stats.satisfactionRate}%`} label="満足度" />
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg hover:-translate-y-2 transition transform">
      <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-bold text-primary-500 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </div>
  )
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-500 mb-1 sm:mb-2">{number}</h3>
      <p className="text-xs sm:text-sm md:text-base text-gray-600">{label}</p>
    </div>
  )
}
