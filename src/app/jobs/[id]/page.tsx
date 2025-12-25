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
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [hasApplied, setHasApplied] = useState(false)
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    fetchJob()
    if (session?.user && (session.user as any).role === 'ENGINEER') {
      checkApplicationStatus()
    }
    const role = (session?.user as any)?.role
    if (role === 'COMPANY') {
      fetchCompanyProfile()
    }
  }, [params.id, session])

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

  const hasActiveSubscription = () => {
    if (!company) return false
    const now = new Date()
    return (
      company.subscriptionPlan !== 'FREE' &&
      company.subscriptionExpiry &&
      new Date(company.subscriptionExpiry) > now
    )
  }

  const handleCompanyClick = (e: React.MouseEvent, companyId: string) => {
    const role = (session?.user as any)?.role
    if (role === 'COMPANY' && !hasActiveSubscription()) {
      e.preventDefault()
      if (confirm('企業詳細を閲覧するには有料プランへの登録が必要です。登録ページに移動しますか?')) {
        router.push('/dashboard/company/subscription')
      }
    } else {
      router.push(`/companies/${companyId}`)
    }
  }

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

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const applications = await response.json()
        const applied = applications.some((app: any) => app.jobId === params.id)
        setHasApplied(applied)
      }
    } catch (error) {
      console.error('Error checking application status:', error)
    }
  }

  const handleApply = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    if (hasApplied) {
      alert('この求人には既に応募済みです')
      return
    }

    setApplying(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: params.id,
          coverLetter,
        }),
      })

      if (response.ok) {
        alert('応募が完了しました!')
        setHasApplied(true)
        setCoverLetter('')
      } else {
        const error = await response.json()
        alert(error.error || '応募に失敗しました')
      }
    } catch (error) {
      console.error('Error applying:', error)
      alert('応募に失敗しました')
    } finally {
      setApplying(false)
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

  // Check if user is a company
  const isCompany = session?.user && (session.user as any).role === 'COMPANY'

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <p
                      onClick={(e) => handleCompanyClick(e, job.company.id)}
                      className="text-xl text-gray-600 mb-3 hover:text-primary-500 cursor-pointer"
                    >
                      {job.company.name}
                    </p>
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
              {/* Apply Section - Only show for non-company users */}
              {!isCompany && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  {hasApplied ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold mb-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        応募済み
                      </div>
                      <p className="text-sm text-gray-600 mb-4">この求人には既に応募しています</p>
                      {session && (session.user as any).role === 'ENGINEER' && (
                        <button
                          onClick={() => router.push('/dashboard/engineer')}
                          className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                        >
                          ダッシュボードに戻る
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">この求人に応募する</h3>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="志望動機を入力してください（任意）"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-4"
                        rows={6}
                      />
                      <div className="space-y-3">
                        <button
                          onClick={handleApply}
                          disabled={applying}
                          className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                          {applying ? '応募中...' : '応募する'}
                        </button>
                        {session && (session.user as any).role === 'ENGINEER' && (
                          <button
                            onClick={() => router.push('/dashboard/engineer')}
                            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                          >
                            ダッシュボードに戻る
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Company User Info */}
              {isCompany && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-blue-800 font-medium mb-2">企業アカウントでログイン中</p>
                  <p className="text-sm text-blue-700">この求人には応募できません。応募者として登録する場合は、別のアカウントを作成してください。</p>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">企業情報</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">企業名</p>
                    <p
                      onClick={(e) => handleCompanyClick(e, job.company.id)}
                      className="font-semibold hover:text-primary-500 cursor-pointer"
                    >
                      {job.company.name}
                    </p>
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
                        className="text-primary-500 hover:underline"
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

              <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
                <p>閲覧数: {job.viewCount}回</p>
                <p>掲載日: {new Date(job.createdAt).toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
