'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface ProjectApplication {
  id: string
  status: string
  coverLetter: string | null
  createdAt: string
  project: {
    id: string
    title: string
    description: string
    category: string | null
    monthlyRate: number | null
    location: string | null
    remoteOk: boolean
    company: {
      id: string
      name: string
    }
  }
  engineer: {
    id: string
    firstName: string
    lastName: string
    displayName: string | null
    email: string
    phoneNumber: string | null
    currentPosition: string | null
    yearsOfExperience: number | null
    bio: string | null
    portfolioUrl: string | null
    githubUrl: string | null
    linkedinUrl: string | null
    skills: Array<{
      skill: {
        id: string
        name: string
      }
      yearsOfExperience: number | null
    }>
    experiences: Array<{
      id: string
      companyName: string
      position: string
      startDate: string
      endDate: string | null
      description: string | null
      isCurrent: boolean
    }>
    educations: Array<{
      id: string
      schoolName: string
      degree: string
      fieldOfStudy: string | null
      startDate: string
      endDate: string | null
      isCurrent: boolean
    }>
  }
}

export default function ProjectApplicationDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<ProjectApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchApplication()
    }
  }, [status])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/project-applications/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setApplication(data)
      } else {
        console.error('Project application not found:', response.status)
        setApplication(null)
      }
    } catch (error) {
      console.error('Error fetching project application:', error)
      setApplication(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return

    setStatusUpdating(true)
    try {
      const response = await fetch(`/api/project-applications/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedApplication = await response.json()
        setApplication(updatedApplication)
      } else {
        alert('ステータスの更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('ステータスの更新中にエラーが発生しました')
    } finally {
      setStatusUpdating(false)
    }
  }

  if (status === 'loading' || loading) {
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

  if (!application) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-xl text-gray-600 mb-4">IT案件応募情報が見つかりません</p>
              <button
                onClick={() => router.push('/dashboard/company')}
                className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/company?tab=applications')}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              ← 応募者一覧に戻る
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="border-b pb-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">IT案件応募詳細</h1>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {application.engineer.lastName} {application.engineer.firstName}
                  {application.engineer.displayName && (
                    <span className="text-gray-600 text-base ml-2">
                      ({application.engineer.displayName})
                    </span>
                  )}
                </h2>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[application.status]}`}>
                  {statusLabels[application.status]}
                </span>
              </div>
              <p className="text-gray-600">
                応募日時: {new Date(application.createdAt).toLocaleString('ja-JP')}
              </p>
            </div>

            {/* Project Information */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📋 応募IT案件
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-gray-800 mb-3">{application.project.title}</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {application.project.category && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {application.project.category}
                    </span>
                  )}
                  {application.project.monthlyRate && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      ¥{application.project.monthlyRate.toLocaleString()}/月
                    </span>
                  )}
                  {application.project.location && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      📍 {application.project.location}
                    </span>
                  )}
                  {application.project.remoteOk && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      リモート可
                    </span>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{application.project.description}</p>
              </div>
            </div>

            {/* Cover Letter */}
            {application.coverLetter && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  ✉️ カバーレター
                </h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="mb-8 border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">応募ステータスを更新</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={statusUpdating || application.status === status}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      application.status === status
                        ? `${statusColors[status]} cursor-default`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${statusUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Engineer Profile */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">技術者プロフィール</h2>

            {/* Basic Info */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                👤 基本情報
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">メールアドレス</p>
                  <p className="text-gray-900">{application.engineer.email}</p>
                </div>
                {application.engineer.phoneNumber && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">電話番号</p>
                    <p className="text-gray-900">{application.engineer.phoneNumber}</p>
                  </div>
                )}
                {application.engineer.currentPosition && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">現職</p>
                    <p className="text-gray-900">{application.engineer.currentPosition}</p>
                  </div>
                )}
                {application.engineer.yearsOfExperience !== null && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">経験年数</p>
                    <p className="text-gray-900">{application.engineer.yearsOfExperience}年</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {application.engineer.bio && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📝 自己紹介
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{application.engineer.bio}</p>
              </div>
            )}

            {/* Links */}
            {(application.engineer.portfolioUrl || application.engineer.githubUrl || application.engineer.linkedinUrl) && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔗 リンク
                </h3>
                <div className="flex flex-wrap gap-3">
                  {application.engineer.portfolioUrl && (
                    <a
                      href={application.engineer.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition"
                    >
                      ポートフォリオ
                    </a>
                  )}
                  {application.engineer.githubUrl && (
                    <a
                      href={application.engineer.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                      GitHub
                    </a>
                  )}
                  {application.engineer.linkedinUrl && (
                    <a
                      href={application.engineer.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {application.engineer.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🛠️ スキル
                </h3>
                <div className="flex flex-wrap gap-2">
                  {application.engineer.skills.map((skillRel) => (
                    <div
                      key={skillRel.skill.id}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {skillRel.skill.name}
                      {skillRel.yearsOfExperience !== null && (
                        <span className="ml-2 text-sm">({skillRel.yearsOfExperience}年)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {application.engineer.experiences.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  💼 職務経歴
                </h3>
                <div className="space-y-4">
                  {application.engineer.experiences.map((exp) => (
                    <div key={exp.id} className="border-l-4 border-primary-500 pl-4">
                      <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                      <p className="text-gray-700">{exp.companyName}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(exp.startDate).toLocaleDateString('ja-JP')} -{' '}
                        {exp.isCurrent ? '現在' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('ja-JP') : ''}
                      </p>
                      {exp.description && <p className="text-gray-700 mt-2 whitespace-pre-wrap">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {application.engineer.educations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🎓 学歴
                </h3>
                <div className="space-y-4">
                  {application.engineer.educations.map((edu) => (
                    <div key={edu.id} className="border-l-4 border-secondary-500 pl-4">
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-gray-700">{edu.schoolName}</p>
                      {edu.fieldOfStudy && <p className="text-gray-600">{edu.fieldOfStudy}</p>}
                      <p className="text-sm text-gray-600">
                        {new Date(edu.startDate).toLocaleDateString('ja-JP')} -{' '}
                        {edu.isCurrent ? '在学中' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('ja-JP') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
