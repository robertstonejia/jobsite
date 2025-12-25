'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Application {
  id: string
  status: string
  coverLetter: string | null
  createdAt: string
  job: {
    id: string
    title: string
    description: string
    jobType: string
    location: string | null
    salaryMin: number | null
    salaryMax: number | null
    requirements: string | null
    benefits: string | null
    company: {
      id: string
      name: string
      logoUrl: string | null
      industry: string | null
      employeeCount: string | null
      website: string | null
    }
  }
}

export default function EngineerApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
        console.error('Application not found')
      }
    } catch (error) {
      console.error('Error fetching application:', error)
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
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
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
      } else {
        const data = await response.json()
        alert(data.error || 'メッセージの送信に失敗しました')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('メッセージの送信中にエラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  const messageTemplates = [
    {
      title: '面接日程の調整',
      icon: '📅',
      content: `お世話になっております。

面接の日程について、以下の候補日でご調整いただけますでしょうか。

【候補日時】
・第1希望：〇月〇日（〇）〇〇時～
・第2希望：〇月〇日（〇）〇〇時～
・第3希望：〇月〇日（〇）〇〇時～

ご検討のほど、よろしくお願いいたします。`
    },
    {
      title: '選考を辞退したい',
      icon: '🙇',
      content: `お世話になっております。

誠に恐縮ではございますが、今回の選考を辞退させていただきたくご連絡いたしました。

貴重なお時間をいただきましたことを深くお詫び申し上げます。
今後とも何卒よろしくお願いいたします。`
    },
    {
      title: '内定を辞退したい',
      icon: '🙇',
      content: `お世話になっております。

この度は内定のご連絡をいただき、誠にありがとうございます。
大変恐縮ではございますが、諸般の事情により内定を辞退させていただきたく存じます。

貴重なお時間とご厚意をいただきましたにも関わらず、このような結果となり誠に申し訳ございません。
末筆ながら、貴社のますますのご発展をお祈り申し上げます。`
    },
    {
      title: '面接に行けなくなった',
      icon: '⚠️',
      content: `お世話になっております。

〇月〇日に予定しておりました面接につきまして、急遽やむを得ない事情により、伺うことが難しくなってしまいました。

大変申し訳ございませんが、面接日程の再調整をお願いできますでしょうか。

【再調整の候補日時】
・第1希望：〇月〇日（〇）〇〇時～
・第2希望：〇月〇日（〇）〇〇時～

お手数をおかけいたしますが、ご検討のほどよろしくお願いいたします。`
    },
    {
      title: '質問がある',
      icon: '❓',
      content: `お世話になっております。

選考について、いくつか質問がございます。

【質問内容】
1.

お忙しいところ恐れ入りますが、ご回答いただけますと幸いです。
よろしくお願いいたします。`
    },
    {
      title: '面接の確認',
      icon: '✓',
      content: `お世話になっております。

面接日程についてご連絡いただき、ありがとうございます。
以下の日程で承知いたしました。

【面接日時】
・日時：〇月〇日（〇）〇〇時～
・場所：

当日はよろしくお願いいたします。`
    },
  ]

  const useTemplate = (template: typeof messageTemplates[0]) => {
    setNewMessage(template.content)
    setShowTemplates(false)
  }

  const statusLabels: Record<string, string> = {
    PENDING: '選考中',
    REVIEWED: '書類選考通過',
    INTERVIEW: '面接中',
    ACCEPTED: '内定',
    REJECTED: '不採用',
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    INTERVIEW: 'bg-purple-100 text-purple-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  const jobTypeLabels: Record<string, string> = {
    FULL_TIME: '正社員',
    PART_TIME: 'パート',
    CONTRACT: '契約社員',
    FREELANCE: 'フリーランス',
  }

  if (loading || status === 'loading') {
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">応募情報が見つかりません</h1>
            <button
              onClick={() => router.push('/dashboard/engineer')}
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
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
                    {application.job.title}
                  </h1>
                  <p className="text-lg text-gray-600">{application.job.company.name}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${statusColors[application.status]}`}>
                  {statusLabels[application.status]}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                応募日: {new Date(application.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-6">
              {/* 志望動機 */}
              {application.coverLetter && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">提出した志望動機</h2>
                  <p className="text-gray-700 whitespace-pre-line">{application.coverLetter}</p>
                </div>
              )}

              {/* 求人詳細 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">求人詳細</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">募集要項</h3>
                    <p className="text-gray-700 whitespace-pre-line">{application.job.description}</p>
                  </div>

                  {application.job.requirements && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">必須要件</h3>
                      <p className="text-gray-700 whitespace-pre-line">{application.job.requirements}</p>
                    </div>
                  )}

                  {application.job.benefits && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">福利厚生</h3>
                      <p className="text-gray-700 whitespace-pre-line">{application.job.benefits}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* メッセージセクション */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">企業とのメッセージ</h2>

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">まだメッセージがありません</p>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === 'ENGINEER' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-4 ${
                              message.senderType === 'ENGINEER'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm mb-1 whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs ${message.senderType === 'ENGINEER' ? 'text-primary-100' : 'text-gray-500'}`}>
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
                  {/* テンプレート選択ボタン */}
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                    >
                      📝 テンプレートから選ぶ
                    </button>
                  </div>

                  {/* テンプレート一覧 */}
                  {showTemplates && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm font-semibold text-gray-700 mb-3">メッセージテンプレート</p>
                      <div className="grid grid-cols-2 gap-2">
                        {messageTemplates.map((template, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => useTemplate(template)}
                            className="p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{template.icon}</span>
                              <span className="text-sm font-medium text-gray-900">{template.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTemplates(false)}
                        className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                      >
                        閉じる
                      </button>
                    </div>
                  )}

                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    rows={8}
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
              {/* 求人情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">求人情報</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">雇用形態</p>
                    <p className="font-semibold">{jobTypeLabels[application.job.jobType]}</p>
                  </div>
                  {application.job.location && (
                    <div>
                      <p className="text-sm text-gray-600">勤務地</p>
                      <p className="font-semibold">{application.job.location}</p>
                    </div>
                  )}
                  {application.job.salaryMin && application.job.salaryMax && (
                    <div>
                      <p className="text-sm text-gray-600">想定年収</p>
                      <p className="font-semibold">
                        {application.job.salaryMin.toLocaleString()}円 - {application.job.salaryMax.toLocaleString()}円
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 企業情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">企業情報</h2>
                <div className="space-y-3">
                  {application.job.company.logoUrl && (
                    <div className="mb-4">
                      <img
                        src={application.job.company.logoUrl}
                        alt={application.job.company.name}
                        className="w-full h-32 object-contain rounded-lg bg-gray-50"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">会社名</p>
                    <p className="font-semibold">{application.job.company.name}</p>
                  </div>
                  {application.job.company.industry && (
                    <div>
                      <p className="text-sm text-gray-600">業界</p>
                      <p className="font-semibold">{application.job.company.industry}</p>
                    </div>
                  )}
                  {application.job.company.employeeCount && (
                    <div>
                      <p className="text-sm text-gray-600">従業員数</p>
                      <p className="font-semibold">{application.job.company.employeeCount}</p>
                    </div>
                  )}
                  {application.job.company.website && (
                    <div>
                      <p className="text-sm text-gray-600">ウェブサイト</p>
                      <a
                        href={application.job.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:underline break-all"
                      >
                        {application.job.company.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
