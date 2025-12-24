'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Company {
  id: string
  name: string
  description: string | null
  industry: string | null
  logoUrl: string | null
  address: string | null
  employeeCount: number | null
  foundedYear: number | null
  website: string | null
  isITCompany: boolean
  jobs: Array<{
    id: string
    title: string
    jobType: string
    location: string | null
    remoteOk: boolean
    createdAt: string
  }>
  _count: {
    jobs: number
  }
}

export default function AdvancedTalentCompaniesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?redirect=/companies/advanced-talent')
    return null
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (industry) params.append('industry', industry)

      const response = await fetch(`/api/companies/advanced-talent?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCompanies()
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Header - Modern Design */}
        <div className="relative bg-gradient-to-b from-slate-50 to-white py-12 sm:py-16 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-purple-500/10 rounded-full blur-2xl" />

          <div className="relative max-w-7xl mx-auto px-4">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">高度人材加点制度対応企業</span>
            </h1>
            <p className="text-gray-600 text-lg">
              高度人材ポイント制度に対応している企業の求人情報を検索できます
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名・キーワード
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="企業名で検索..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業界
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="業界で絞り込み..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
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
          ) : companies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">該当する企業が見つかりませんでした</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-600">{companies.length}件の企業が見つかりました</p>
              {companies.map((company) => (
                <div key={company.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {company.logoUrl && (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div>
                          <Link href={`/companies/${company.id}`}>
                            <h2 className="text-2xl font-bold text-gray-800 hover:text-primary-500 cursor-pointer transition">
                              {company.name}
                            </h2>
                          </Link>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              高度人材加点対応
                            </span>
                            {company.isITCompany && (
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                IT企業
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {company.description && (
                        <p className="text-gray-600 mb-3">{company.description}</p>
                      )}

                      <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-500 mb-4">
                        {company.industry && <p>業界: {company.industry}</p>}
                        {company.employeeCount && <p>従業員数: {company.employeeCount}名</p>}
                        {company.foundedYear && <p>設立年: {company.foundedYear}年</p>}
                        {company.address && <p>所在地: {company.address}</p>}
                      </div>

                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:underline text-sm"
                        >
                          企業ウェブサイト →
                        </a>
                      )}

                      {/* Recent Jobs */}
                      {company.jobs.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h3 className="font-semibold mb-2">最近の求人 ({company._count.jobs}件)</h3>
                          <div className="space-y-2">
                            {company.jobs.map((job) => (
                              <Link
                                key={job.id}
                                href={`/jobs/${job.id}`}
                                className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
                              >
                                <p className="font-medium text-gray-800">{job.title}</p>
                                <p className="text-sm text-gray-500">
                                  {job.jobType} {job.location && `• ${job.location}`}
                                  {job.remoteOk && ' • リモート可'}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
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
