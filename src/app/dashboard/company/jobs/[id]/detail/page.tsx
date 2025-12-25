'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  benefits: string | null
  location: string | null
  remoteOk: boolean
  jobType: string
  salaryMin: number | null
  salaryMax: number | null
  isActive: boolean
  viewCount: number
  createdAt: string
  company: {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    website: string | null
    employeeCount: number | null
  }
  skills: Array<{
    skill: {
      id: string
      name: string
      category: string
    }
    required: boolean
    level: number
  }>
  _count?: {
    applications: number
  }
}

export default function CompanyJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && params.id) {
      fetchJob()
    }
  }, [status, params.id, router])

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`)
      const data = await response.json()
      setJob(data)
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === 'loading') {
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

  if (!job) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center">
          <p className="text-gray-500 text-lg">求人が見つかりませんでした</p>
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/company')}
              className="text-gray-600 hover:text-gray-900 mb-4"
            >
              ← ダッシュボードに戻る
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {job.company.logoUrl ? (
                      <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">🏢</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        job.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {job.isActive ? '掲載中' : '非公開'}
                      </span>
                    </div>
                    <p className="text-xl text-gray-600 mb-3">{job.company.name}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        {jobTypeLabels[job.jobType]}
                      </span>
                      {job.location && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          📍 {job.location}
                        </span>
                      )}
                      {job.remoteOk && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          🏠 リモート可
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {job.salaryMin && job.salaryMax && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">想定年収</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {job.salaryMin.toLocaleString()}円 - {job.salaryMax.toLocaleString()}円
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">仕事内容</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>

                  {job.requirements && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3">応募要件</h2>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                    </div>
                  )}

                  {job.benefits && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3">待遇・福利厚生</h2>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                    </div>
                  )}

                  {job.skills.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3">必要なスキル</h2>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((jobSkill) => (
                          <span
                            key={jobSkill.skill.id}
                            className={`px-3 py-2 rounded-lg text-sm ${
                              jobSkill.required
                                ? 'bg-red-100 text-red-700 font-semibold'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {jobSkill.skill.name}
                            {jobSkill.required && ' (必須)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">求人管理</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/dashboard/company/jobs/${job.id}/edit`)}
                    className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
                  >
                    求人を編集
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/company')}
                    className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    ダッシュボードに戻る
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">統計情報</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">閲覧数</p>
                    <p className="text-2xl font-bold text-primary-500">{job.viewCount}回</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">応募数</p>
                    <p className="text-2xl font-bold text-blue-500">{job._count?.applications || 0}件</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">掲載日</p>
                    <p className="font-semibold">{new Date(job.createdAt).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">企業情報</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">企業名</p>
                    <p className="font-semibold">{job.company.name}</p>
                  </div>
                  {job.company.employeeCount && (
                    <div>
                      <p className="text-sm text-gray-600">従業員数</p>
                      <p className="font-semibold">{job.company.employeeCount}名</p>
                    </div>
                  )}
                  {job.company.website && (
                    <div>
                      <p className="text-sm text-gray-600">ウェブサイト</p>
                      <a
                        href={job.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:underline break-all"
                      >
                        {job.company.website}
                      </a>
                    </div>
                  )}
                  {job.company.description && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">企業概要</p>
                      <p className="text-sm text-gray-700">{job.company.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
