'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Dialog from '@/components/Dialog'
import { useDialog } from '@/hooks/useDialog'

interface Application {
  id: string
  status: string
  coverLetter: string | null
  createdAt: string
  hasContactPermission: boolean
  job: {
    id: string
    title: string
    description: string
  }
  engineer: {
    id: string
    firstName: string
    lastName: string
    displayName: string | null
    phoneNumber: string | null
    bio: string | null
    yearsOfExperience: number | null
    currentPosition: string | null
    desiredPosition: string | null
    desiredSalaryMin: number | null
    desiredSalaryMax: number | null
    githubUrl: string | null
    linkedinUrl: string | null
    portfolioUrl: string | null
    skills: Array<{
      skill: {
        id: string
        name: string
        category: string
      }
      level: number
      yearsUsed: number | null
    }>
    experiences: Array<{
      id: string
      companyName: string
      position: string
      description: string | null
      startDate: string
      endDate: string | null
      isCurrent: boolean
    }>
    educations: Array<{
      id: string
      schoolName: string
      degree: string | null
      fieldOfStudy: string | null
      startDate: string
      endDate: string | null
      isCurrent: boolean
    }>
  }
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { dialog, showConfirm, showSuccess, showError, closeDialog } = useDialog()

  // メッセージテンプレート
  const messageTemplates = [
    {
      title: '書類選考通過通知',
      content: 'この度は弊社の求人にご応募いただき、誠にありがとうございます。\n\n書類選考の結果、次の選考（面接）にお進みいただくことになりました。\n\n面接日程につきまして、ご都合の良い日時をいくつかお知らせいただけますでしょうか。\n\nよろしくお願いいたします。'
    },
    {
      title: '面接日程調整',
      content: 'お世話になっております。\n\n面接日程についてご連絡させていただきます。\n以下の候補日時からご都合の良い日時をお選びください。\n\n候補日時：\n・○月○日（○）○○:○○～\n・○月○日（○）○○:○○～\n・○月○日（○）○○:○○～\n\nご確認のほど、よろしくお願いいたします。'
    },
    {
      title: '面接結果（採用）',
      content: 'この度の面接にご参加いただき、誠にありがとうございました。\n\n選考の結果、ぜひ一緒に働いていただきたく、採用とさせていただきたく存じます。\n\n今後の手続きや入社日程につきまして、詳細をご説明させていただきたく存じます。\n\nよろしくお願いいたします。'
    },
    {
      title: '質問への回答',
      content: 'お世話になっております。\n\nご質問いただいた件につきまして、以下の通り回答させていただきます。\n\n【ご質問内容】\n\n\n【回答】\n\n\nその他ご不明な点がございましたら、お気軽にお問い合わせください。\n\nよろしくお願いいたします。'
    },
    {
      title: '追加情報のお願い',
      content: 'お世話になっております。\n\n選考を進めさせていただくにあたり、以下の情報を追加でお伺いできますでしょうか。\n\n・\n・\n・\n\nお手数をおかけいたしますが、ご確認のほど、よろしくお願いいたします。'
    },
    {
      title: 'お礼',
      content: 'この度は弊社の求人にご興味をお持ちいただき、誠にありがとうございます。\n\nいただいた応募内容を拝見させていただき、大変魅力的なご経歴と感じております。\n\n選考結果につきましては、○営業日以内にご連絡させていただきます。\n\n引き続き、よろしくお願いいたします。'
    }
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && params.id) {
      fetchApplication()
      fetchMessages()
    }
  }, [status, params.id, router])

  useEffect(() => {
    // メッセージが更新されたら最後のメッセージまでスクロール
    scrollToBottom()
  }, [messages])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setApplication(data)
      } else {
        console.error('Application not found:', response.status)
        setApplication(null) // 明示的にnullを設定
      }
    } catch (error) {
      console.error('Error fetching application:', error)
      setApplication(null) // エラー時もnullを設定
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?applicationId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else {
        console.error('Messages not found:', response.status)
        setMessages([]) // 404の場合は空配列を設定
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([]) // エラー時も空配列を設定
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: params.id,
          content: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
        // Refresh application data to update contact permission
        fetchApplication()
      } else {
        const data = await response.json()
        showError(data.error || 'メッセージの送信に失敗しました')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      showError('メッセージの送信中にエラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    showConfirm(
      `ステータスを「${statusLabels[newStatus]}」に変更しますか？`,
      async () => {
        setUpdating(true)
        try {
          const response = await fetch(`/api/applications/${params.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
          })

          if (response.ok) {
            showSuccess('ステータスを更新しました')
            fetchApplication()
          } else {
            const data = await response.json()
            showError(data.error || 'ステータスの更新に失敗しました')
          }
        } catch (error) {
          console.error('Error updating status:', error)
          showError('ステータスの更新中にエラーが発生しました')
        } finally {
          setUpdating(false)
        }
      },
      '確認'
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

  if (!application) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">応募情報が見つかりません</h1>
            <button
              onClick={() => router.push('/dashboard/company')}
              className="text-primary-500 hover:underline"
            >
              ダッシュボードに戻る
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* ヘッダー */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4"
            >
              ← 戻る
            </button>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {application.engineer.lastName} {application.engineer.firstName}
                  </h1>
                  <p className="text-lg text-gray-600">応募求人: {application.job.title}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${statusColors[application.status]}`}>
                  {statusLabels[application.status]}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                応募日: {new Date(application.createdAt).toLocaleDateString('ja-JP')}
              </p>

              {/* ステータス変更ボタン */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">ステータス変更:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(status)}
                      disabled={updating || application.status === status}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        application.status === status
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-6">
              {/* 志望動機 */}
              {application.coverLetter && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">志望動機</h2>
                  <p className="text-gray-700 whitespace-pre-line">{application.coverLetter}</p>
                </div>
              )}

              {/* 自己紹介 */}
              {application.engineer.bio && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">自己紹介</h2>
                  <p className="text-gray-700 whitespace-pre-line">{application.engineer.bio}</p>
                </div>
              )}

              {/* 職務経歴 */}
              {application.engineer.experiences.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">職務経歴</h2>
                  <div className="space-y-4">
                    {application.engineer.experiences.map((exp) => (
                      <div key={exp.id} className="border-l-4 border-primary-500 pl-4">
                        <h3 className="font-bold text-gray-900">{exp.position}</h3>
                        <p className="text-gray-600 mb-2">{exp.companyName}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          {new Date(exp.startDate).toLocaleDateString('ja-JP')} -{' '}
                          {exp.isCurrent ? '現在' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('ja-JP') : ''}
                        </p>
                        {exp.description && (
                          <p className="text-gray-700 whitespace-pre-line">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 学歴 */}
              {application.engineer.educations.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">学歴</h2>
                  <div className="space-y-4">
                    {application.engineer.educations.map((edu) => (
                      <div key={edu.id} className="border-l-4 border-blue-500 pl-4">
                        <h3 className="font-bold text-gray-900">{edu.schoolName}</h3>
                        {edu.degree && <p className="text-gray-600">{edu.degree}</p>}
                        {edu.fieldOfStudy && <p className="text-gray-600">{edu.fieldOfStudy}</p>}
                        <p className="text-sm text-gray-500">
                          {new Date(edu.startDate).toLocaleDateString('ja-JP')} -{' '}
                          {edu.isCurrent ? '在学中' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('ja-JP') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* メッセージセクション */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">メッセージ</h2>

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">まだメッセージがありません</p>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === 'COMPANY' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-4 ${
                              message.senderType === 'COMPANY'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm mb-1 whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs ${message.senderType === 'COMPANY' ? 'text-primary-100' : 'text-gray-500'}`}>
                              {new Date(message.createdAt).toLocaleString('ja-JP')}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="border-t pt-4">
                  {/* テンプレートボタン */}
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                    >
                      📝 テンプレートを使用 {showTemplates ? '▲' : '▼'}
                    </button>
                  </div>

                  {/* テンプレート一覧 */}
                  {showTemplates && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border max-h-60 overflow-y-auto">
                      <p className="text-sm font-semibold text-gray-700 mb-3">テンプレートを選択:</p>
                      <div className="space-y-2">
                        {messageTemplates.map((template, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setNewMessage(template.content)
                              setShowTemplates(false)
                            }}
                            className="w-full text-left px-4 py-2 bg-white hover:bg-primary-50 border rounded-lg transition"
                          >
                            <p className="font-medium text-gray-900">{template.title}</p>
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{template.content}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    rows={5}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sending ? '送信中...' : 'メッセージを送信'}
                  </button>
                </form>
              </div>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">基本情報</h2>
                <div className="space-y-3">
                  {!application.hasContactPermission && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">📧 連絡先情報</span>
                        <br />
                        応募者がメッセージを送信すると、連絡先情報が表示されます。
                      </p>
                    </div>
                  )}
                  {application.engineer.displayName && (
                    <div>
                      <p className="text-sm text-gray-600">表示名</p>
                      <p className="font-semibold">{application.engineer.displayName}</p>
                    </div>
                  )}
                  {application.hasContactPermission && application.engineer.phoneNumber && (
                    <div>
                      <p className="text-sm text-gray-600">電話番号</p>
                      <p className="font-semibold">{application.engineer.phoneNumber}</p>
                    </div>
                  )}
                  {application.engineer.currentPosition && (
                    <div>
                      <p className="text-sm text-gray-600">現職</p>
                      <p className="font-semibold">{application.engineer.currentPosition}</p>
                    </div>
                  )}
                  {application.engineer.yearsOfExperience !== null && (
                    <div>
                      <p className="text-sm text-gray-600">経験年数</p>
                      <p className="font-semibold">{application.engineer.yearsOfExperience}年</p>
                    </div>
                  )}
                  {application.engineer.desiredPosition && (
                    <div>
                      <p className="text-sm text-gray-600">希望職種</p>
                      <p className="font-semibold">{application.engineer.desiredPosition}</p>
                    </div>
                  )}
                  {application.engineer.desiredSalaryMin && application.engineer.desiredSalaryMax && (
                    <div>
                      <p className="text-sm text-gray-600">希望年収</p>
                      <p className="font-semibold">
                        {application.engineer.desiredSalaryMin.toLocaleString()}円 -{' '}
                        {application.engineer.desiredSalaryMax.toLocaleString()}円
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* リンク */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">リンク</h2>
                <div className="space-y-2">
                  {application.engineer.githubUrl && (
                    <a
                      href={application.engineer.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-500 hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                  {application.engineer.linkedinUrl && (
                    <a
                      href={application.engineer.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-500 hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {application.engineer.portfolioUrl && (
                    <a
                      href={application.engineer.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-500 hover:underline"
                    >
                      ポートフォリオ
                    </a>
                  )}
                </div>
              </div>

              {/* スキル */}
              {application.engineer.skills.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">スキル</h2>
                  <div className="space-y-2">
                    {application.engineer.skills.map((engineerSkill) => (
                      <div key={engineerSkill.skill.id} className="flex items-center justify-between">
                        <span className="text-gray-700">{engineerSkill.skill.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Lv.{engineerSkill.level}
                          </span>
                          {engineerSkill.yearsUsed && (
                            <span className="text-sm text-gray-500">
                              ({engineerSkill.yearsUsed}年)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
