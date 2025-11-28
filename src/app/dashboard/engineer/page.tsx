'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Application {
  id: string
  status: string
  coverLetter: string | null
  createdAt: string
  unreadCount?: number
  applicationType?: 'job' | 'project'
  job: {
    id: string
    title: string
    jobType: string
    location: string | null
    salaryMin: number | null
    salaryMax: number | null
    company: {
      id: string
      name: string
      logoUrl: string | null
    }
  }
}

interface ScoutEmail {
  id: string
  subject: string
  content: string
  isRead: boolean
  createdAt: string
  company: {
    id: string
    name: string
    logoUrl: string | null
  }
}

export default function EngineerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [scoutEmails, setScoutEmails] = useState<ScoutEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchApplications()
      fetchScoutEmails()
    }
  }, [status, router])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications/with-unread')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScoutEmails = async () => {
    try {
      const response = await fetch('/api/engineer/scout-emails')
      if (response.ok) {
        const data = await response.json()
        setScoutEmails(data)
      }
    } catch (error) {
      console.error('Error fetching scout emails:', error)
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
    PENDING: '選考中',
    REVIEWED: '書類選考通過',
    INTERVIEW: '面接中',
    ACCEPTED: '内定',
    REJECTED: '不採用',
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    INTERVIEW: 'bg-purple-100 text-purple-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  const statusCounts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    interview: applications.filter((a) => a.status === 'INTERVIEW').length,
    accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">マイページ</h1>
            <p className="text-gray-600">応募状況の確認と求人検索</p>
          </div>

          {/* 統計カード */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">総応募数</p>
              <p className="text-3xl font-bold text-primary-500">{statusCounts.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">選考中</p>
              <p className="text-3xl font-bold text-yellow-500">{statusCounts.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">面接中</p>
              <p className="text-3xl font-bold text-purple-500">{statusCounts.interview}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">内定</p>
              <p className="text-3xl font-bold text-green-500">{statusCounts.accepted}</p>
            </div>
          </div>

          {/* クイックアクション */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/jobs"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
              >
                <span className="text-3xl">🔍</span>
                <div>
                  <p className="font-semibold text-gray-900">求人を探す</p>
                  <p className="text-sm text-gray-600">新しい求人を検索</p>
                </div>
              </Link>
              <Link
                href="/dashboard/engineer/profile"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
              >
                <span className="text-3xl">👤</span>
                <div>
                  <p className="font-semibold text-gray-900">プロフィール編集</p>
                  <p className="text-sm text-gray-600">情報を更新する</p>
                </div>
              </Link>
            </div>
          </div>

          {/* スカウトメール通知 */}
          {scoutEmails.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">スカウトメール</h2>
              <div className="space-y-4">
                {scoutEmails.map((email) => (
                  <div
                    key={email.id}
                    className={`border rounded-lg p-4 ${
                      !email.isRead ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                    } hover:shadow-md transition`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {email.company.logoUrl ? (
                          <img
                            src={email.company.logoUrl}
                            alt={email.company.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-xl">🏢</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {!email.isRead && (
                                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                  NEW
                                </span>
                              )}
                              <h3 className="text-lg font-bold text-gray-900">{email.subject}</h3>
                            </div>
                            <p className="text-sm text-gray-600">{email.company.name}</p>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-2">{email.content}</p>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            受信日: {new Date(email.createdAt).toLocaleDateString('ja-JP')}
                          </p>
                          <Link
                            href={`/dashboard/engineer/scout-emails/${email.id}`}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm"
                          >
                            詳細を見る
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 応募一覧 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">応募履歴</h2>

            {applications.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">まだ応募していません</p>
                <Link
                  href="/jobs"
                  className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition font-semibold"
                >
                  求人を探す
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className="border rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {application.job.company.logoUrl ? (
                          <img
                            src={application.job.company.logoUrl}
                            alt={application.job.company.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-2xl">🏢</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {application.job.title}
                            </h3>
                            <p className="text-gray-600">{application.job.company.name}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              statusColors[application.status]
                            }`}
                          >
                            {statusLabels[application.status]}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                            {jobTypeLabels[application.job.jobType]}
                          </span>
                          {application.job.location && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              📍 {application.job.location}
                            </span>
                          )}
                          {application.job.salaryMin && application.job.salaryMax && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                              💰 {application.job.salaryMin.toLocaleString()}円 -{' '}
                              {application.job.salaryMax.toLocaleString()}円
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <p className="text-sm text-gray-600">
                            応募日: {new Date(application.createdAt).toLocaleDateString('ja-JP')}
                          </p>
                          <div className="flex gap-2">
                            {application.applicationType === 'project' ? (
                              <Link
                                href={`/projects/${application.job.id}`}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                              >
                                IT案件詳細
                              </Link>
                            ) : (
                              <>
                                <Link
                                  href={`/dashboard/engineer/applications/${application.id}`}
                                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition relative"
                                >
                                  応募詳細・メッセージ
                                  {application.unreadCount && application.unreadCount > 0 ? (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                      {application.unreadCount}
                                    </span>
                                  ) : null}
                                </Link>
                                <Link
                                  href={`/jobs/${application.job.id}`}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                  求人詳細
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* おすすめ求人セクション */}
          <div className="mt-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg shadow-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">あなたにぴったりの求人を見つけよう</h2>
            <p className="mb-6 opacity-90">
              プロフィールとスキルを登録して、最適な求人をレコメンドします
            </p>
            <Link
              href="/jobs"
              className="inline-block bg-white text-primary-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              求人を検索する
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
