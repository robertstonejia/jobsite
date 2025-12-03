'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Job {
  id: string
  title: string
  description: string
  location: string
  remoteOk: boolean
  jobType: string
  salaryMin: number | null
  salaryMax: number | null
  createdAt: string
  company: {
    id: string
    name: string
    logoUrl: string | null
  }
  skills: Array<{
    skill: {
      id: string
      name: string
    }
  }>
}

export default function JobSearchPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [remoteOk, setRemoteOk] = useState(false)
  const [company, setCompany] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const { data: session, status } = useSession()
  const router = useRouter()
  const wasAuthenticated = useRef(false)

  // Track if user was authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true
    }
  }, [status])

  // Redirect to login if not authenticated (only for direct access, not logout)
  useEffect(() => {
    if (status === 'unauthenticated' && !wasAuthenticated.current) {
      router.push('/login?redirect=/jobs')
    }
  }, [status, router])

  const fetchJobs = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (location) params.append('location', location)
      if (jobType) params.append('jobType', jobType)
      if (remoteOk) params.append('remoteOk', 'true')
      params.append('page', page.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/jobs?${params.toString()}`)
      const data = await response.json()

      // Handle new pagination response format
      if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs)
        setPagination(data.pagination)
        setCurrentPage(page)
      } else {
        console.error('API response format error:', data)
        setJobs([])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    const role = (session?.user as any)?.role
    if (role === 'COMPANY') {
      fetchCompanyProfile()
    }
  }, [remoteOk, session])

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchJobs(1)
  }

  const handlePageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchJobs(page)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-8 text-center">求人検索</h1>
            <form onSubmit={handleSearch} className="bg-white rounded-lg p-6 shadow-xl">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="キーワード検索"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                />
                <input
                  type="text"
                  placeholder="勤務地"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                />
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="">雇用形態</option>
                  <option value="FULL_TIME">正社員</option>
                  <option value="PART_TIME">パート</option>
                  <option value="CONTRACT">契約社員</option>
                  <option value="FREELANCE">フリーランス</option>
                </select>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  検索
                </button>
              </div>
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteOk}
                  onChange={(e) => setRemoteOk(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span>リモートワーク可</span>
              </label>
            </form>
          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-gray-600">
              {loading ? '検索中...' : `${pagination.total}件の求人が見つかりました (${currentPage} / ${pagination.totalPages}ページ)`}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  session={session}
                  hasActiveSubscription={hasActiveSubscription()}
                  router={router}
                />
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500 text-lg">求人が見つかりませんでした</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                前へ
              </button>

              <div className="flex gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current page
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - currentPage) <= 2
                    )
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const prevPage = array[index - 1]
                    const showEllipsis = prevPage && page - prevPage > 1

                    return (
                      <div key={page} className="flex items-center gap-2">
                        {showEllipsis && <span className="text-gray-400">...</span>}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg transition ${
                            currentPage === page
                              ? 'bg-primary-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    )
                  })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

function JobCard({ job, session, hasActiveSubscription, router }: { job: Job; session: any; hasActiveSubscription: boolean; router: any }) {
  const jobTypeLabels: Record<string, string> = {
    FULL_TIME: '正社員',
    PART_TIME: 'パート',
    CONTRACT: '契約社員',
    FREELANCE: 'フリーランス',
  }

  const handleCompanyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const role = (session?.user as any)?.role
    if (role === 'COMPANY' && !hasActiveSubscription) {
      if (confirm('企業詳細を閲覧するには有料プランへの登録が必要です。登録ページに移動しますか?')) {
        router.push('/dashboard/company/subscription')
      }
    } else {
      router.push(`/companies/${job.company.id}`)
    }
  }

  const handleJobClick = (e: React.MouseEvent) => {
    const role = (session?.user as any)?.role
    if (role === 'COMPANY' && !hasActiveSubscription) {
      e.preventDefault()
      if (confirm('求人詳細を閲覧するには有料プランへの登録が必要です。登録ページに移動しますか?')) {
        router.push('/dashboard/company/subscription')
      }
    }
  }

  return (
    <Link href={`/jobs/${job.id}`} onClick={handleJobClick}>
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            {job.company.logoUrl ? (
              <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-2xl">🏢</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
            <p
              onClick={handleCompanyClick}
              className="text-gray-600 mb-3 hover:text-primary-500 cursor-pointer"
            >
              {job.company.name}
            </p>
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
                  🏠 リモート可
                </span>
              )}
              {job.salaryMin && job.salaryMax && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  💰 {job.salaryMin.toLocaleString()}円 - {job.salaryMax.toLocaleString()}円
                </span>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2">
              {job.skills.slice(0, 5).map((jobSkill) => (
                <span
                  key={jobSkill.skill.id}
                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs whitespace-nowrap flex-shrink-0"
                >
                  {jobSkill.skill.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
