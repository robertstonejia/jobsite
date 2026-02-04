'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Dialog from '@/components/Dialog'

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
  foreignNationalityOk: boolean
  createdAt: string
  company: {
    id: string
    name: string
    logoUrl: string | null
    description: string | null
    industry: string | null
    website: string | null
    address: string | null
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [project, setProject] = useState<ProjectPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasApplied, setHasApplied] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    if (params.id) {
      fetchProject()
      if (session?.user && (session.user as any).role === 'ENGINEER') {
        checkApplicationStatus()
      }
    }
  }, [params.id, session])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 404) {
        setError('案件が見つかりませんでした')
      } else {
        setError('案件情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('案件情報の取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch('/api/project-applications')
      if (response.ok) {
        const applications = await response.json()
        const applied = applications.some((app: any) => app.projectId === params.id)
        setHasApplied(applied)
      }
    } catch (error) {
      console.error('Error checking application status:', error)
    }
  }

  const handleApply = async () => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    if ((session.user as any).role !== 'ENGINEER') {
      setDialog({
        isOpen: true,
        title: '応募不可',
        message: 'エンジニアのみ応募できます',
        type: 'warning'
      })
      return
    }

    setIsApplying(true)
    try {
      const response = await fetch('/api/project-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: params.id,
          coverLetter
        })
      })

      if (response.ok) {
        setDialog({
          isOpen: true,
          title: '応募完了',
          message: '応募が完了しました！企業からの連絡をお待ちください。',
          type: 'success'
        })
        setHasApplied(true)
        setShowApplyModal(false)
        setCoverLetter('')
      } else {
        const data = await response.json()
        setDialog({
          isOpen: true,
          title: 'エラー',
          message: data.error || '応募に失敗しました',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error applying:', error)
      setDialog({
        isOpen: true,
        title: 'エラー',
        message: '応募中にエラーが発生しました。もう一度お試しください。',
        type: 'error'
      })
    } finally {
      setIsApplying(false)
    }
  }

  const isEngineer = session?.user && (session.user as any).role === 'ENGINEER'

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

  if (error || !project) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error || '案件が見つかりませんでした'}
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-6"
          >
            ← 戻る
          </button>

          {/* Project Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-start gap-6 mb-6">
              {project.company.logoUrl && (
                <img
                  src={project.company.logoUrl}
                  alt={project.company.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                  {project.category && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {project.category}
                    </span>
                  )}
                </div>
                <Link href={`/companies/${project.company.id}`}>
                  <p className="text-lg text-gray-600 hover:text-primary-500 cursor-pointer">
                    {project.company.name}
                  </p>
                </Link>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.monthlyRate && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                  月額: ¥{project.monthlyRate.toLocaleString()}
                </span>
              )}
              {project.remoteOk && (
                <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
                  リモート可
                </span>
              )}
              {project.foreignNationalityOk && (
                <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-semibold">
                  外国籍可
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">職務内容</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.description}</p>
            </div>
          </div>

          {/* Skills */}
          {(project.requirements || project.preferredSkills) && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">スキル要件</h2>
              {project.requirements && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">必須スキル</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.requirements}</p>
                </div>
              )}
              {project.preferredSkills && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">尚可スキル</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.preferredSkills}</p>
                </div>
              )}
            </div>
          )}

          {/* Contract Details */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">契約条件</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {project.workingHours && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">稼働時間</p>
                  <p className="text-gray-900 font-medium">{project.workingHours}</p>
                </div>
              )}
              {project.contractType && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">契約形態</p>
                  <p className="text-gray-900 font-medium">{project.contractType}</p>
                </div>
              )}
              {project.interviewCount !== null && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">商談回数</p>
                  <p className="text-gray-900 font-medium">{project.interviewCount}回</p>
                </div>
              )}
              {project.paymentTerms && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">支払サイト</p>
                  <p className="text-gray-900 font-medium">{project.paymentTerms}</p>
                </div>
              )}
              {project.duration && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">期間</p>
                  <p className="text-gray-900 font-medium">{project.duration}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">勤務地</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {project.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">勤務地</p>
                  <p className="text-gray-900 font-medium">{project.location}</p>
                </div>
              )}
              {project.nearestStation && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">最寄駅</p>
                  <p className="text-gray-900 font-medium">{project.nearestStation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Company Info */}
          {project.company.description && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">企業情報</h2>
              <p className="text-gray-700 mb-4">{project.company.description}</p>
              {project.company.website && (
                <a
                  href={project.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 font-medium hover:underline"
                >
                  企業ウェブサイト →
                </a>
              )}
            </div>
          )}

          {/* Apply Button - Only show to engineers */}
          {isEngineer && (
            <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
              {hasApplied ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    応募済み
                  </div>
                  <p className="text-sm text-gray-600 mt-2">この案件には既に応募しています</p>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition shadow-lg"
                  >
                    この案件に応募する
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    応募後、企業からの連絡をお待ちください
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Apply Modal */}
          {showApplyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">案件への応募</h2>

                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600">{project.company.name}</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      志望動機・自己PR (任意)
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="応募理由や自己PRをご記入ください..."
                      rows={6}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowApplyModal(false)}
                      disabled={isApplying}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={isApplying}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {isApplying ? '応募中...' : '応募する'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </>
  )
}
