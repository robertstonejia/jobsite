'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Dialog from '@/components/Dialog'
import { useDialog } from '@/hooks/useDialog'

interface Experience {
  id: string
  companyName: string
  position: string
  description: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

interface Education {
  id: string
  schoolName: string
  degree: string | null
  fieldOfStudy: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

interface Skill {
  id: string
  name: string
  category: string
}

interface EngineerSkill {
  id: string
  level: number
  yearsUsed: number | null
  skill: Skill
}

interface EngineerDetail {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
  birthDate: string | null
  phoneNumber: string | null
  address: string | null
  nearestStation: string | null
  bio: string | null
  yearsOfExperience: number | null
  currentPosition: string | null
  desiredPosition: string | null
  desiredSalaryMin: number | null
  desiredSalaryMax: number | null
  availableFrom: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  hasContactPermission: boolean
  user: {
    email: string | null
  }
  skills: EngineerSkill[]
  experiences: Experience[]
  educations: Education[]
}

export default function EngineerDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const engineerId = params.id as string

  const [engineer, setEngineer] = useState<EngineerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showScoutForm, setShowScoutForm] = useState(false)
  const [scoutMessage, setScoutMessage] = useState('')
  const [sending, setSending] = useState(false)

  const { dialog, showConfirm, showSuccess, showError, showWarning, closeDialog } = useDialog()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      const role = (session.user as any).role
      if (role !== 'COMPANY') {
        router.push('/')
        return
      }
      fetchEngineerDetail()
    }
  }, [status, session, router, engineerId])

  const fetchEngineerDetail = async () => {
    try {
      const response = await fetch(`/api/engineers/${engineerId}`)
      if (response.ok) {
        const data = await response.json()
        setEngineer(data)
      } else {
        setError('応募者情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching engineer detail:', error)
      setError('応募者情報の取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSendScout = async () => {
    if (!scoutMessage.trim()) {
      showWarning('スカウトメッセージを入力してください')
      return
    }

    showConfirm(
      'この応募者にスカウトメッセージを送信しますか？',
      async () => {
        setSending(true)
        try {
          const response = await fetch('/api/scout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              engineerIds: [engineerId],
              message: scoutMessage,
            }),
          })

          if (response.ok) {
            showSuccess('スカウトメッセージを送信しました')
            setScoutMessage('')
            setShowScoutForm(false)
          } else {
            const error = await response.json()
            showError(`エラー: ${error.error || 'スカウトメッセージの送信に失敗しました'}`)
          }
        } catch (error) {
          console.error('Error sending scout:', error)
          showError('スカウトメッセージの送信に失敗しました')
        } finally {
          setSending(false)
        }
      },
      '確認'
    )
  }

  if (loading || status === 'loading') {
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

  if (error || !engineer) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error || '応募者が見つかりませんでした'}
            </div>
            <button
              onClick={() => router.back()}
              className="mt-4 text-primary-500 hover:text-primary-600"
            >
              ← 戻る
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // Group skills by category
  const skillsByCategory = engineer.skills.reduce((acc, engineerSkill) => {
    const category = engineerSkill.skill.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(engineerSkill)
    return acc
  }, {} as Record<string, EngineerSkill[]>)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4"
            >
              ← 戻る
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">応募者詳細</h1>
              {!showScoutForm && (
                <button
                  onClick={() => setShowScoutForm(true)}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
                >
                  スカウトメッセージを送る
                </button>
              )}
            </div>
          </div>

          {/* Scout Form */}
          {showScoutForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">スカウトメッセージ</h2>
              <textarea
                value={scoutMessage}
                onChange={(e) => setScoutMessage(e.target.value)}
                placeholder="スカウトメッセージを入力してください"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-4"
                rows={6}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowScoutForm(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSendScout}
                  disabled={sending}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
                >
                  {sending ? '送信中...' : 'メッセージを送信'}
                </button>
              </div>
            </div>
          )}

          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">氏名: </span>
                <span className="text-gray-900 font-medium">
                  {engineer.lastName} {engineer.firstName}
                  {engineer.displayName && ` (${engineer.displayName})`}
                </span>
              </div>
              {engineer.birthDate && (
                <div>
                  <span className="text-sm text-gray-600">生年月日: </span>
                  <span className="text-gray-900">
                    {new Date(engineer.birthDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              )}
              {engineer.hasContactPermission ? (
                <>
                  {engineer.phoneNumber && (
                    <div>
                      <span className="text-sm text-gray-600">電話番号: </span>
                      <span className="text-gray-900">{engineer.phoneNumber}</span>
                    </div>
                  )}
                  {engineer.user.email && (
                    <div>
                      <span className="text-sm text-gray-600">メールアドレス: </span>
                      <span className="text-gray-900">{engineer.user.email}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">📧 連絡先情報</span>
                    <br />
                    応募者返信すると、連絡先情報（メールアドレス・電話番号）を確認できるようになります。
                  </p>
                </div>
              )}
              {engineer.address && (
                <div>
                  <span className="text-sm text-gray-600">住所: </span>
                  <span className="text-gray-900">{engineer.address}</span>
                </div>
              )}
              {engineer.nearestStation && (
                <div>
                  <span className="text-sm text-gray-600">最寄り駅: </span>
                  <span className="text-gray-900">{engineer.nearestStation}</span>
                </div>
              )}
              {engineer.bio && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">自己紹介:</span>
                  <p className="text-gray-900 whitespace-pre-wrap">{engineer.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* 職務情報 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">職務情報</h2>
            <div className="space-y-3">
              {engineer.currentPosition && (
                <div>
                  <span className="text-sm text-gray-600">現在の職種: </span>
                  <span className="text-gray-900">{engineer.currentPosition}</span>
                </div>
              )}
              {engineer.yearsOfExperience !== null && (
                <div>
                  <span className="text-sm text-gray-600">実務経験年数: </span>
                  <span className="text-gray-900">{engineer.yearsOfExperience}年</span>
                </div>
              )}
              {engineer.desiredPosition && (
                <div>
                  <span className="text-sm text-gray-600">希望職種: </span>
                  <span className="text-gray-900">{engineer.desiredPosition}</span>
                </div>
              )}
              {(engineer.desiredSalaryMin || engineer.desiredSalaryMax) && (
                <div>
                  <span className="text-sm text-gray-600">希望年収: </span>
                  <span className="text-gray-900">
                    {engineer.desiredSalaryMin && `¥${engineer.desiredSalaryMin.toLocaleString()}`}
                    {engineer.desiredSalaryMin && engineer.desiredSalaryMax && ' - '}
                    {engineer.desiredSalaryMax && `¥${engineer.desiredSalaryMax.toLocaleString()}`}
                  </span>
                </div>
              )}
              {engineer.availableFrom && (
                <div>
                  <span className="text-sm text-gray-600">転職希望時期: </span>
                  <span className="text-gray-900">{engineer.availableFrom}</span>
                </div>
              )}
            </div>
          </div>

          {/* スキル */}
          {engineer.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">スキル</h2>
              <div className="space-y-4">
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-gray-800 mb-2">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((engineerSkill) => (
                        <div
                          key={engineerSkill.id}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm"
                        >
                          <span className="font-medium">{engineerSkill.skill.name}</span>
                          <span className="text-xs ml-2">
                            Lv.{engineerSkill.level}
                            {engineerSkill.yearsUsed && ` · ${engineerSkill.yearsUsed}年`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 職歴 */}
          {engineer.experiences.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">職歴</h2>
              <div className="space-y-4">
                {engineer.experiences.map((exp) => (
                  <div key={exp.id} className="border-l-4 border-primary-500 pl-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                      {exp.isCurrent && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          在職中
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 font-medium mb-1">{exp.companyName}</p>
                    <p className="text-gray-600 text-sm mb-2">
                      {new Date(exp.startDate).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                      })}{' '}
                      〜{' '}
                      {exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                          })
                        : '現在'}
                    </p>
                    {exp.description && (
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 学歴 */}
          {engineer.educations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">学歴</h2>
              <div className="space-y-4">
                {engineer.educations.map((edu) => (
                  <div key={edu.id} className="border-l-4 border-secondary-500 pl-4">
                    <h3 className="font-semibold text-gray-900">{edu.schoolName}</h3>
                    {(edu.degree || edu.fieldOfStudy) && (
                      <p className="text-gray-700 mb-1">
                        {edu.degree}
                        {edu.degree && edu.fieldOfStudy && ' · '}
                        {edu.fieldOfStudy}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {new Date(edu.startDate).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                      })}{' '}
                      〜{' '}
                      {edu.endDate
                        ? new Date(edu.endDate).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                          })
                        : '在学中'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SNS・ポートフォリオ */}
          {(engineer.githubUrl || engineer.linkedinUrl || engineer.portfolioUrl) && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">SNS・ポートフォリオ</h2>
              <div className="space-y-2">
                {engineer.githubUrl && (
                  <div>
                    <span className="text-sm text-gray-600">GitHub: </span>
                    <a
                      href={engineer.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600"
                    >
                      {engineer.githubUrl}
                    </a>
                  </div>
                )}
                {engineer.linkedinUrl && (
                  <div>
                    <span className="text-sm text-gray-600">LinkedIn: </span>
                    <a
                      href={engineer.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600"
                    >
                      {engineer.linkedinUrl}
                    </a>
                  </div>
                )}
                {engineer.portfolioUrl && (
                  <div>
                    <span className="text-sm text-gray-600">ポートフォリオ: </span>
                    <a
                      href={engineer.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600"
                    >
                      {engineer.portfolioUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={dialog.onConfirm}
      />
    </>
  )
}
