'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface ProjectPost {
  id: string
  title: string
  description: string
  requirements: string | null
  preferredSkills: string | null
  monthlyRate: number | null
  workingHours: string | null
  contractType: string | null
  interviewCount: number | null
  nearestStation: string | null
  paymentTerms: string | null
  category: string | null
  duration: string | null
  location: string | null
  remoteOk: boolean
  createdAt: string
  company: {
    id: string
    name: string
    logoUrl: string | null
  }
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectPost[]>([])
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [remoteOk, setRemoteOk] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const wasAuthenticated = useRef(false)

  const categories = ['すべて', 'Java', 'C#', 'PHP', 'Ruby', 'Python', 'JavaScript', 'AWS', 'Linux', 'Go', 'Kotlin', 'その他']

  // Check if user is a company
  const isCompany = session?.user && (session.user as any).role === 'COMPANY'

  // Track if user was authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true
    }
  }, [status])

  // Redirect to login if not authenticated (only for direct access, not logout)
  useEffect(() => {
    if (status === 'unauthenticated' && !wasAuthenticated.current) {
      router.push('/login?redirect=/projects')
    }
  }, [status, router])

  // Fetch company profile if user is a company
  useEffect(() => {
    if (isCompany) {
      fetchCompanyProfile()
    }
  }, [isCompany])

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

  // Check if company has active subscription or trial
  const hasActiveSubscription = () => {
    if (!company) return false
    const now = new Date()

    // Check paid subscription
    const hasActivePaidPlan =
      company.subscriptionPlan !== 'FREE' &&
      company.subscriptionExpiry &&
      new Date(company.subscriptionExpiry) > now

    // Check trial period
    const hasActiveTrial =
      company.isTrialActive &&
      company.trialEndDate &&
      new Date(company.trialEndDate) > now

    return hasActivePaidPlan || hasActiveTrial
  }

  const handleProjectClick = (e: React.MouseEvent, projectId: string) => {
    if (isCompany && !hasActiveSubscription()) {
      e.preventDefault()
      if (confirm('IT案件詳細を閲覧するには有料プランへの登録が必要です。登録ページに移動しますか?')) {
        router.push('/dashboard/company/subscription')
      }
    } else {
      router.push(`/projects/${projectId}`)
    }
  }

  const handleProjectPostClick = () => {
    if (!hasActiveSubscription()) {
      if (confirm('IT案件の投稿には有料プランへの登録が必要です。登録ページに移動しますか?')) {
        router.push('/dashboard/company/subscription')
      }
    } else {
      router.push('/dashboard/company/projects/new')
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [selectedCategory, remoteOk])

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (location) params.append('location', location)
      if (remoteOk) params.append('remoteOk', 'true')
      if (selectedCategory && selectedCategory !== 'すべて') {
        params.append('category', selectedCategory)
      }
      params.append('page', page.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/projects?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Handle new pagination response format
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects)
          setPagination(data.pagination)
          setCurrentPage(page)
        } else {
          console.error('API response format error:', data)
          setProjects([])
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProjects(1)
  }

  const handlePageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchProjects(page)
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        {/* Header - Modern Design */}
        <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12 sm:py-16 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-purple-500/10 rounded-full blur-2xl" />

          <div className="relative max-w-7xl mx-auto px-4">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">IT案件情報</span>
            </h1>
            <p className="text-gray-600 text-lg">IT企業が発表する最新のプロジェクト案件情報</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Category Tabs and Post Button */}
          <div className="mb-6 flex flex-col gap-4">
            {/* Category Tabs with horizontal scroll on mobile */}
            <div
              className="flex gap-2 pb-3 overflow-x-auto scrollbar-thin"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                msOverflowStyle: 'auto'
              }}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === 'すべて' ? '' : category)}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm flex-shrink-0 ${
                    (category === 'すべて' && !selectedCategory) || selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Post Button for Company Users */}
            {isCompany && (
              <button
                onClick={handleProjectPostClick}
                className="w-full md:w-auto self-start bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition whitespace-nowrap shadow-md"
              >
                + IT案件を投稿
              </button>
            )}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  キーワード
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="案件名で検索..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  場所
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="勤務地..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={remoteOk}
                    onChange={(e) => setRemoteOk(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">リモート可のみ</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
                >
                  検索
                </button>
              </div>
            </div>
          </form>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">案件が見つかりませんでした</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-600">{pagination.total}件の案件が見つかりました ({currentPage} / {pagination.totalPages}ページ)</p>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {project.company.logoUrl && (
                          <img
                            src={project.company.logoUrl}
                            alt={project.company.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <h2
                            onClick={(e) => handleProjectClick(e, project.id)}
                            className="text-2xl font-bold text-gray-800 hover:text-primary-500 cursor-pointer"
                          >
                            {project.title}
                          </h2>
                          <p className="text-sm text-gray-500">{project.company.name}</p>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                      <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
                        {project.monthlyRate && (
                          <p className="text-gray-700">
                            <span className="font-semibold">月額単価:</span> ¥{project.monthlyRate.toLocaleString()}
                          </p>
                        )}
                        {project.contractType && (
                          <p className="text-gray-700">
                            <span className="font-semibold">契約形態:</span> {project.contractType}
                          </p>
                        )}
                        {project.workingHours && (
                          <p className="text-gray-700">
                            <span className="font-semibold">稼働時間:</span> {project.workingHours}
                          </p>
                        )}
                        {project.interviewCount !== null && (
                          <p className="text-gray-700">
                            <span className="font-semibold">商談回数:</span> {project.interviewCount}回
                          </p>
                        )}
                        {project.duration && (
                          <p className="text-gray-700">
                            <span className="font-semibold">期間:</span> {project.duration}
                          </p>
                        )}
                        {project.nearestStation && (
                          <p className="text-gray-700">
                            <span className="font-semibold">最寄駅:</span> {project.nearestStation}
                          </p>
                        )}
                        {project.location && (
                          <p className="text-gray-700">
                            <span className="font-semibold">勤務地:</span> {project.location}
                          </p>
                        )}
                        {project.paymentTerms && (
                          <p className="text-gray-700">
                            <span className="font-semibold">支払サイト:</span> {project.paymentTerms}
                          </p>
                        )}
                      </div>

                      {project.remoteOk && (
                        <div className="mb-4">
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            リモート可
                          </span>
                        </div>
                      )}

                      {(project.requirements || project.preferredSkills) && (
                        <div className="mb-4 text-sm">
                          {project.requirements && (
                            <p className="text-gray-700 mb-2">
                              <span className="font-semibold">必須スキル:</span> {project.requirements}
                            </p>
                          )}
                          {project.preferredSkills && (
                            <p className="text-gray-700">
                              <span className="font-semibold">尚可スキル:</span> {project.preferredSkills}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          投稿日: {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                        <button
                          onClick={(e) => handleProjectClick(e, project.id)}
                          className="text-primary-500 hover:text-primary-600 font-medium"
                        >
                          詳細を見る →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
      </main>

      <Footer />
    </>
  )
}
