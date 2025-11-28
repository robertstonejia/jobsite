'use client'

import { useState, useEffect } from 'react'
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

  const categories = ['すべて', 'Java', 'C#', 'PHP', 'Ruby', 'Python', 'JavaScript', 'AWS', 'Linux', 'Go', 'Kotlin', 'その他']

  // Check if user is a company
  const isCompany = session?.user && (session.user as any).role === 'COMPANY'

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
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

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (location) params.append('location', location)
      if (remoteOk) params.append('remoteOk', 'true')
      if (selectedCategory && selectedCategory !== 'すべて') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/projects?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProjects()
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">IT案件情報</h1>
            <p className="text-xl">IT企業が発表する最新のプロジェクト案件情報</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Category Tabs and Post Button */}
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="overflow-x-auto flex-1">
              <div className="flex gap-2 min-w-max">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === 'すべて' ? '' : category)}
                    className={`px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      (category === 'すべて' && !selectedCategory) || selectedCategory === category
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Button for Company Users */}
            {isCompany && (
              <button
                onClick={handleProjectPostClick}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition whitespace-nowrap shadow-md"
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
              <p className="text-gray-600">{projects.length}件の案件が見つかりました</p>
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
        </div>
      </main>

      <Footer />
    </>
  )
}
