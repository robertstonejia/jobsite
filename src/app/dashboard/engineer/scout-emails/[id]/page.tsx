'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Dialog from '@/components/Dialog'

interface ScoutEmail {
  id: string
  subject: string
  content: string
  isRead: boolean
  isReplied: boolean
  createdAt: string
  company: {
    id: string
    name: string
    logoUrl: string | null
    description: string | null
    website: string | null
    industry: string | null
    employeeCount: string | null
    address: string | null
  }
}

export default function ScoutEmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [scoutEmail, setScoutEmail] = useState<ScoutEmail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyLoading, setReplyLoading] = useState(false)
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'info' | 'confirm'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && params.id) {
      fetchScoutEmail()
    }
  }, [status, params.id, router])

  const fetchScoutEmail = async () => {
    try {
      const response = await fetch(`/api/engineer/scout-emails/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setScoutEmail(data)
      } else {
        console.error('Scout email not found')
      }
    } catch (error) {
      console.error('Error fetching scout email:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = () => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: '返信確認',
      message: 'このスカウトメールに興味があることを企業に伝えますか？\n\n返信すると、あなたの連絡先情報（メールアドレス・電話番号）が企業に開示されます。',
      onConfirm: confirmReply,
    })
  }

  const confirmReply = async () => {
    setReplyLoading(true)

    try {
      const response = await fetch(`/api/engineer/scout-emails/${params.id}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        const data = await response.json()
        setScoutEmail(data)
        setDialog({
          isOpen: true,
          type: 'success',
          title: '返信完了',
          message: '企業に返信しました。\n企業があなたの連絡先情報を確認できるようになりました。',
        })
      } else {
        const errorData = await response.json()
        setDialog({
          isOpen: true,
          type: 'error',
          title: '返信失敗',
          message: errorData.error || '返信に失敗しました',
        })
      }
    } catch (error) {
      console.error('Error replying to scout email:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '返信処理中にエラーが発生しました',
      })
    } finally {
      setReplyLoading(false)
    }
  }

  if (status === 'loading' || loading) {
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

  if (!scoutEmail) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">スカウトメールが見つかりません</h1>
            <button
              onClick={() => router.push('/dashboard/engineer')}
              className="text-primary-500 hover:underline"
            >
              マイページに戻る
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
      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        confirmText={dialog.type === 'confirm' ? '返信する' : 'OK'}
        cancelText="キャンセル"
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* ヘッダー */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              ← 戻る
            </button>
          </div>

          {/* スカウトメール本文 */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{scoutEmail.subject}</h1>
              <p className="text-sm text-gray-600">
                受信日: {new Date(scoutEmail.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="border-t pt-6">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{scoutEmail.content}</p>
            </div>
          </div>

          {/* 企業情報 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">送信企業情報</h2>

            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {scoutEmail.company.logoUrl ? (
                  <img
                    src={scoutEmail.company.logoUrl}
                    alt={scoutEmail.company.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-4xl">🏢</span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{scoutEmail.company.name}</h3>

                {scoutEmail.company.industry && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">業種:</span> {scoutEmail.company.industry}
                  </p>
                )}

                {scoutEmail.company.address && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">所在地:</span> {scoutEmail.company.address}
                  </p>
                )}

                {scoutEmail.company.employeeCount && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">従業員数:</span> {scoutEmail.company.employeeCount}
                  </p>
                )}

                {scoutEmail.company.website && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">ウェブサイト:</span>{' '}
                    <a
                      href={scoutEmail.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:underline"
                    >
                      {scoutEmail.company.website}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {scoutEmail.company.description && (
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">会社概要</h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {scoutEmail.company.description}
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <Link
                href={`/companies/${scoutEmail.company.id}`}
                className="inline-block w-full text-center bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition font-semibold"
              >
                企業の求人を見る
              </Link>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-6 space-y-4">
            {!scoutEmail.isReplied ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">このスカウトに興味がありますか？</h3>
                <p className="text-sm text-blue-800 mb-4">
                  返信すると、企業があなたの連絡先情報（メールアドレス・電話番号）を確認できるようになります。
                </p>
                <button
                  onClick={handleReply}
                  disabled={replyLoading}
                  className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replyLoading ? '返信中...' : '興味があります - 企業に返信する'}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-green-900 mb-2">✓ 返信済み</h3>
                <p className="text-sm text-green-800">
                  企業に返信しました。企業があなたの連絡先情報を確認できるようになっています。
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/dashboard/engineer')}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                マイページに戻る
              </button>
              <Link
                href="/jobs"
                className="flex-1 text-center bg-secondary-500 text-white px-6 py-3 rounded-lg hover:bg-secondary-600 transition font-semibold"
              >
                求人を探す
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
