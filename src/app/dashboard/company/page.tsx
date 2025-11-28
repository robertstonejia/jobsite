'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { checkTrialStatus, canAccessPaidFeatures, getTrialMessage } from '@/lib/trial'

interface Job {
  id: string
  title: string
  description: string
  jobType: string
  location: string | null
  isActive: boolean
  viewCount: number
  createdAt: string
  _count?: {
    applications: number
  }
}

interface Application {
  id: string
  status: string
  createdAt: string
  unreadCount?: number
  applicationType?: 'job' | 'project'
  job: {
    id: string
    title: string
  }
  engineer: {
    id: string
    firstName: string
    lastName: string
    currentPosition: string | null
    yearsOfExperience: number | null
  }
}

interface ProjectPost {
  id: string
  title: string
  description: string
  category: string | null
  monthlyRate: number | null
  location: string | null
  remoteOk: boolean
  isActive: boolean
  createdAt: string
}

export default function CompanyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'projects'>('jobs')
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [projects, setProjects] = useState<ProjectPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [showPaymentError, setShowPaymentError] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    plan: string
    expiry: string | null
    isActive: boolean
    trialStatus?: {
      isActive: boolean
      daysRemaining: number
      hasExpired: boolean
      trialEndDate: Date | null
    }
    trialMessage?: {
      message: string
      type: 'success' | 'warning' | 'error'
    }
    canAccessFeatures?: boolean
  } | null>(null)
  const firstUnreadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()

      // Check for payment status parameter
      const paymentParam = searchParams.get('payment')
      if (paymentParam === 'success') {
        setShowPaymentSuccess(true)
        // Hide message after 5 seconds
        setTimeout(() => setShowPaymentSuccess(false), 5000)
      } else if (paymentParam === 'error') {
        setShowPaymentError(true)
        // Hide message after 8 seconds
        setTimeout(() => setShowPaymentError(false), 8000)
      }
    }
  }, [status, router, searchParams])

  // Watch for tab parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'applications' || tabParam === 'jobs' || tabParam === 'projects') {
      setActiveTab(tabParam as 'jobs' | 'applications' | 'projects')
    }
  }, [searchParams])

  // Scroll to first unread application when applications tab is opened
  useEffect(() => {
    if (activeTab === 'applications' && applications.length > 0) {
      // Wait for DOM to update, then scroll
      setTimeout(() => {
        if (firstUnreadRef.current) {
          firstUnreadRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [activeTab, applications])

  const fetchData = async () => {
    try {
      // まずプロフィールを取得して企業IDを確認
      const profileRes = await fetch('/api/company/profile')
      let companyId = ''

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        companyId = profileData.id
        const now = new Date()
        const expiry = profileData.subscriptionExpiry ? new Date(profileData.subscriptionExpiry) : null
        const isActive = profileData.subscriptionPlan !== 'FREE' && expiry && expiry > now

        // トライアル情報を計算
        const trialStatus = checkTrialStatus(profileData)
        const trialMessage = getTrialMessage(profileData)
        const canAccessFeatures = canAccessPaidFeatures(profileData)

        setSubscriptionInfo({
          plan: profileData.subscriptionPlan,
          expiry: profileData.subscriptionExpiry,
          isActive: isActive || false,
          trialStatus,
          trialMessage,
          canAccessFeatures,
        })
      }

      // 企業IDを使って自社のデータのみを取得
      const [jobsRes, appsRes, projectsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/applications/with-unread'),
        fetch(companyId ? `/api/projects?companyId=${companyId}` : '/api/projects'),
      ])

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData)
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json()
        setApplications(appsData)
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
        <Footer />
      </>
    )
  }

  const jobTypeLabels: Record<string, string> = {
    FULL_TIME: '正社員',
    PART_TIME: 'パート',
    CONTRACT: '契約社員',
    FREELANCE: 'フリーランス',
  }

  const statusLabels: Record<string, string> = {
    PENDING: '未対応',
    REVIEWED: '確認済み',
    INTERVIEW: '面接中',
    ACCEPTED: '採用',
    REJECTED: '不採用',
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    INTERVIEW: 'bg-purple-100 text-purple-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  const handleJobAction = (path: string) => {
    if (!subscriptionInfo?.canAccessFeatures) {
      const message = subscriptionInfo?.trialStatus?.hasExpired
        ? 'トライアル期間が終了しました。求人の作成・編集を利用するには有料プランへの登録が必要です。登録ページに移動しますか?'
        : '求人の作成・編集には有料プランへの登録が必要です。登録ページに移動しますか?'
      if (confirm(message)) {
        router.push('/dashboard/company/subscription')
      }
    } else {
      router.push(path)
    }
  }

  const handleProjectAction = (path: string) => {
    if (!subscriptionInfo?.canAccessFeatures) {
      const message = subscriptionInfo?.trialStatus?.hasExpired
        ? 'トライアル期間が終了しました。IT案件の投稿・編集を利用するには有料プランへの登録が必要です。登録ページに移動しますか?'
        : 'IT案件の投稿・編集には有料プランへの登録が必要です。登録ページに移動しますか?'
      if (confirm(message)) {
        router.push('/dashboard/company/subscription')
      }
    } else {
      router.push(path)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Payment Success Message */}
          {showPaymentSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <p className="font-semibold text-green-800">支払いが完了しました！</p>
                  <p className="text-sm text-green-700">月額会員プランが有効になりました。求人投稿とIT案件投稿が利用可能です。</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentSuccess(false)}
                className="text-green-700 hover:text-green-900 font-bold text-xl"
              >
                ×
              </button>
            </div>
          )}

          {/* Payment Error Message */}
          {showPaymentError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <div>
                  <p className="font-semibold text-red-800">支払いの確認に失敗しました</p>
                  <p className="text-sm text-red-700">もう一度お試しください。問題が続く場合はサポートにお問い合わせください。</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentError(false)}
                className="text-red-700 hover:text-red-900 font-bold text-xl"
              >
                ×
              </button>
            </div>
          )}

          {/* Trial Status */}
          {subscriptionInfo?.trialStatus && subscriptionInfo.trialStatus.isActive && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🎉</span>
                <div className="flex-1">
                  <p className="font-semibold text-green-800 mb-1">無料トライアル期間中</p>
                  <p className="text-sm text-green-700 mb-2">
                    {subscriptionInfo.trialMessage?.message}
                  </p>
                  <p className="text-xs text-green-600">
                    すべての機能を無料でご利用いただけます。引き続きご利用いただくには、トライアル終了前に月額プランへの登録をお願いします。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Expired or No Access */}
          {subscriptionInfo && !subscriptionInfo.canAccessFeatures && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 mb-1">
                    {subscriptionInfo.trialStatus?.hasExpired ? 'トライアル期間が終了しました' : '有料プランの登録が必要です'}
                  </p>
                  <p className="text-sm text-yellow-700 mb-3">
                    {subscriptionInfo.trialMessage?.message || '求人投稿とIT案件投稿を利用するには、月額会員プランへの登録が必要です。'}
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/company/subscription')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-semibold"
                  >
                    今すぐ登録する
                  </button>
                </div>
              </div>
            </div>
          )}

          {subscriptionInfo && subscriptionInfo.isActive && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💳</span>
                  <div>
                    <p className="font-semibold text-blue-800">
                      プラン: {subscriptionInfo.plan === 'BASIC' ? '基本プラン' : subscriptionInfo.plan}
                    </p>
                    <p className="text-sm text-blue-700">
                      有効期限: {subscriptionInfo.expiry ? new Date(subscriptionInfo.expiry).toLocaleDateString('ja-JP') : 'なし'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/company/subscription')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  プラン管理 →
                </button>
              </div>
            </div>
          )}

          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">企業ダッシュボード</h1>
                <p className="text-gray-600">求人管理と応募者の確認</p>
              </div>
              <button
                onClick={() => router.push('/dashboard/company/profile')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition font-semibold"
              >
                企業情報を編集
              </button>
            </div>

            {/* クイックアクション */}
            <div className="grid md:grid-cols-4 gap-4">
              <button
                onClick={() => handleJobAction('/dashboard/company/jobs/new')}
                className="bg-white border-2 border-primary-500 text-primary-500 px-4 py-3 rounded-lg hover:bg-primary-50 transition font-medium text-sm"
              >
                + 新規求人作成
              </button>
              <button
                onClick={() => router.push('/dashboard/company/subscription')}
                className="bg-white border-2 border-blue-500 text-blue-500 px-4 py-3 rounded-lg hover:bg-blue-50 transition font-medium text-sm"
              >
                💳 月額会員登録
              </button>
              <button
                onClick={() => handleProjectAction('/dashboard/company/projects/new')}
                className="bg-white border-2 border-green-500 text-green-500 px-4 py-3 rounded-lg hover:bg-green-50 transition font-medium text-sm"
              >
                📋 IT案件投稿
              </button>
              <button
                onClick={() => router.push('/scout')}
                className="bg-white border-2 border-purple-500 text-purple-500 px-4 py-3 rounded-lg hover:bg-purple-50 transition font-medium text-sm"
              >
                📧 スカウト機能
              </button>
            </div>
          </div>

          {/* 統計カード */}
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">掲載中の求人</p>
              <p className="text-3xl font-bold text-primary-500">
                {jobs.filter((j) => j.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">総求人数</p>
              <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">IT案件数</p>
              <p className="text-3xl font-bold text-green-500">{projects.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">応募総数</p>
              <p className="text-3xl font-bold text-blue-500">{applications.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">未対応の応募</p>
              <p className="text-3xl font-bold text-yellow-500">
                {applications.filter((a) => a.status === 'PENDING').length}
              </p>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`px-6 py-4 font-semibold border-b-2 transition ${
                    activeTab === 'jobs'
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  求人管理
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`px-6 py-4 font-semibold border-b-2 transition ${
                    activeTab === 'projects'
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  IT案件管理
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-6 py-4 font-semibold border-b-2 transition ${
                    activeTab === 'applications'
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  応募者管理
                  {applications.reduce((total, app) => total + (app.unreadCount || 0), 0) > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {applications.reduce((total, app) => total + (app.unreadCount || 0), 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'jobs' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">求人一覧</h2>
                    <button
                      onClick={() => handleJobAction('/dashboard/company/jobs/new')}
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      + 新しい求人を作成
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-4">まだ求人が登録されていません</p>
                      <button
                        onClick={() => handleJobAction('/dashboard/company/jobs/new')}
                        className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
                      >
                        求人を作成する
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {jobs.map((job) => (
                        <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{job.title}</h3>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                                  {jobTypeLabels[job.jobType]}
                                </span>
                                {job.location && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                    📍 {job.location}
                                  </span>
                                )}
                                <span
                                  className={`px-3 py-1 rounded-full text-sm ${
                                    job.isActive
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {job.isActive ? '掲載中' : '非公開'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex gap-6 text-sm text-gray-600">
                              <span>閲覧数: {job.viewCount}</span>
                              <span>応募数: {job._count?.applications || 0}</span>
                              <span>掲載日: {new Date(job.createdAt).toLocaleDateString('ja-JP')}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleJobAction(`/dashboard/company/jobs/${job.id}/detail`)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                              >
                                詳細
                              </button>
                              <button
                                onClick={() => handleJobAction(`/dashboard/company/jobs/${job.id}/edit`)}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                              >
                                編集
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'projects' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">IT案件一覧</h2>
                    <button
                      onClick={() => handleProjectAction('/dashboard/company/projects/new')}
                      className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      + 新しいIT案件を投稿
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-4">まだIT案件が投稿されていません</p>
                      <button
                        onClick={() => handleProjectAction('/dashboard/company/projects/new')}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                      >
                        IT案件を投稿する
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg p-6 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{project.title}</h3>
                                {project.category && (
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                    {project.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {project.monthlyRate && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                    ¥{project.monthlyRate.toLocaleString()}/月
                                  </span>
                                )}
                                {project.location && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                    📍 {project.location}
                                  </span>
                                )}
                                {project.remoteOk && (
                                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                    リモート可
                                  </span>
                                )}
                                <span
                                  className={`px-3 py-1 rounded-full text-sm ${
                                    project.isActive
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {project.isActive ? '掲載中' : '非公開'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm text-gray-600">
                              投稿日: {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleProjectAction(`/projects/${project.id}`)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                              >
                                詳細
                              </button>
                              <button
                                onClick={() => handleProjectAction(`/dashboard/company/projects/${project.id}/edit`)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                              >
                                編集
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'applications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">応募者一覧</h2>

                  {applications.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">応募がありません</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {applications.map((application, index) => {
                        // Find the first application with unread messages
                        const isFirstUnread = application.unreadCount && application.unreadCount > 0 &&
                          applications.findIndex(app => app.unreadCount && app.unreadCount > 0) === index

                        return (
                          <div
                            key={application.id}
                            ref={isFirstUnread ? firstUnreadRef : null}
                            className="border rounded-lg p-6 hover:shadow-md transition"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {application.engineer.lastName} {application.engineer.firstName}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[application.status]}`}>
                                    {statusLabels[application.status]}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  応募求人: {application.job.title}
                                </p>
                                {application.engineer.currentPosition && (
                                  <p className="text-sm text-gray-600">
                                    現職: {application.engineer.currentPosition}
                                  </p>
                                )}
                                {application.engineer.yearsOfExperience !== null && (
                                  <p className="text-sm text-gray-600">
                                    経験年数: {application.engineer.yearsOfExperience}年
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                              <p className="text-sm text-gray-600">
                                応募日: {new Date(application.createdAt).toLocaleDateString('ja-JP')}
                              </p>
                              <button
                                onClick={() => {
                                  if (application.applicationType === 'project') {
                                    router.push(`/dashboard/company/project-applications/${application.id}`)
                                  } else {
                                    router.push(`/dashboard/company/applications/${application.id}`)
                                  }
                                }}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition relative"
                              >
                                詳細を見る
                                {application.unreadCount && application.unreadCount > 0 ? (
                                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {application.unreadCount}
                                  </span>
                                ) : null}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
