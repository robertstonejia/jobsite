'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Company {
  id: string
  name: string
  description: string | null
  industry: string | null
  website: string | null
  logoUrl: string | null
  address: string | null
  phoneNumber: string | null
  employeeCount: number | null
  foundedYear: number | null
  isITCompany: boolean
  supportsAdvancedTalentPoints: boolean
  jobs: Array<{
    id: string
    title: string
    description: string
    jobType: string
    location: string | null
    remoteOk: boolean
    salaryMin: number | null
    salaryMax: number | null
    createdAt: string
    isActive: boolean
  }>
  projectPosts: Array<{
    id: string
    title: string
    description: string
    category: string | null
    monthlyRate: number | null
    location: string | null
    remoteOk: boolean
    foreignNationalityOk: boolean
    createdAt: string
  }>
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchCompany()
    }
  }, [params.id])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/companies/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setCompany(data)
      } else if (response.status === 404) {
        setError('企業が見つかりませんでした')
      } else {
        setError('企業情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching company:', error)
      setError('企業情報の取得中にエラーが発生しました')
    } finally {
      setLoading(false)
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

  if (error || !company) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error || '企業が見つかりませんでした'}
            </div>
            <button
              onClick={() => router.back()}
              className="text-primary-500 hover:text-primary-600"
            >
              ← 戻る
            </button>
          </div>
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
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-6"
          >
            ← 戻る
          </button>

          {/* Company Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-start gap-6">
              {company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{company.name}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.supportsAdvancedTalentPoints && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      高度人材加点対応
                    </span>
                  )}
                  {company.isITCompany && (
                    <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                      IT企業
                    </span>
                  )}
                </div>
                {company.description && (
                  <p className="text-gray-700 text-lg leading-relaxed">{company.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">企業情報</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {company.industry && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">業界</p>
                  <p className="text-gray-900 font-medium">{company.industry}</p>
                </div>
              )}
              {company.employeeCount && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">従業員数</p>
                  <p className="text-gray-900 font-medium">{company.employeeCount}名</p>
                </div>
              )}
              {company.foundedYear && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">設立年</p>
                  <p className="text-gray-900 font-medium">{company.foundedYear}年</p>
                </div>
              )}
              {company.address && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">所在地</p>
                  <p className="text-gray-900 font-medium">{company.address}</p>
                </div>
              )}
              {company.phoneNumber && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">電話番号</p>
                  <p className="text-gray-900 font-medium">{company.phoneNumber}</p>
                </div>
              )}
              {company.website && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">ウェブサイト</p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-600 font-medium hover:underline"
                  >
                    {company.website} →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Job Posts */}
          {company.jobs.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">求人情報 ({company.jobs.length}件)</h2>
              <div className="space-y-4">
                {company.jobs.filter(job => job.isActive).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="border rounded-lg p-6 hover:shadow-md transition cursor-pointer">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-500">{job.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
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
                            リモート可
                          </span>
                        )}
                      </div>
                      {(job.salaryMin || job.salaryMax) && (
                        <p className="text-sm text-gray-600">
                          年収: {job.salaryMin && `¥${job.salaryMin.toLocaleString()}`}
                          {job.salaryMin && job.salaryMax && ' 〜 '}
                          {job.salaryMax && `¥${job.salaryMax.toLocaleString()}`}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Project Posts */}
          {company.projectPosts.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">IT案件情報 ({company.projectPosts.length}件)</h2>
              <div className="space-y-4">
                {company.projectPosts.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="border rounded-lg p-6 hover:shadow-md transition cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 hover:text-primary-500">{project.title}</h3>
                        {project.category && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {project.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
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
                        {project.foreignNationalityOk && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                            外国籍可
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
