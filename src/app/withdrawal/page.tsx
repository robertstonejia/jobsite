'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Dialog from '@/components/Dialog'

export default function WithdrawalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')
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

  const handleWithdrawal = () => {
    if (confirmText !== '退会する') {
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '「退会する」と正確に入力してください',
      })
      return
    }

    // 確認ダイアログを表示
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: '退会確認',
      message: '本当に退会しますか？\n\nこの操作は取り消せません。\nすべてのデータが完全に削除されます。',
      onConfirm: confirmWithdrawal,
    })
  }

  const confirmWithdrawal = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        setDialog({
          isOpen: true,
          type: 'success',
          title: '退会完了',
          message: '退会処理が完了しました。\nご利用ありがとうございました。',
        })

        // 2秒後にログアウトしてホームに遷移
        setTimeout(async () => {
          await signOut({ redirect: false })
          router.push('/')
        }, 2000)
      } else {
        const data = await response.json()
        setDialog({
          isOpen: true,
          type: 'error',
          title: '退会失敗',
          message: data.error || '退会処理に失敗しました',
        })
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '退会処理中にエラーが発生しました',
      })
    } finally {
      setLoading(false)
    }
  }

  // 未ログインの場合はログインページへ
  if (status === 'unauthenticated') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">退会について</h1>
            <div className="bg-white rounded-lg shadow p-8">
              <p className="text-gray-700 mb-6">
                退会手続きを行うには、ログインが必要です。
              </p>
              <Link
                href="/login?redirect=/withdrawal"
                className="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition font-semibold"
              >
                ログイン
              </Link>
            </div>
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
        confirmText={dialog.type === 'confirm' ? '退会する' : 'OK'}
        cancelText="キャンセル"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">退会について</h1>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-red-600 mb-3">⚠️ 退会前に必ずご確認ください</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold mb-2">
                  退会すると、以下のデータが完全に削除されます。
                </p>
                <ul className="list-disc list-inside text-red-700 space-y-1 ml-4">
                  <li>アカウント情報（メールアドレス、パスワード）</li>
                  <li>プロフィール情報（個人情報、経歴、スキル）</li>
                  <li>応募履歴および選考状況</li>
                  <li>企業とのメッセージ履歴</li>
                  <li>保存した求人情報</li>
                  <li>その他すべてのサービス利用データ</li>
                </ul>
                <p className="text-red-800 font-semibold mt-3">
                  ※ 一度退会すると、これらのデータを復元することはできません。
                </p>
              </div>
            </section>

            {status === 'authenticated' && (
              <>
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">退会手続き</h2>
                  <p className="text-gray-700 mb-4">
                    退会を希望される場合は、以下の手順に従ってください。
                  </p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-700 font-semibold mb-2">
                        確認のため、下のフィールドに「退会する」と入力してください。
                      </p>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="退会する"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <button
                      onClick={handleWithdrawal}
                      disabled={loading || confirmText !== '退会する'}
                      className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '処理中...' : '退会する'}
                    </button>
                  </div>
                </section>

                <section className="pt-4 border-t">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">退会以外の選択肢</h2>
                  <p className="text-gray-700 mb-3">
                    一時的にサービスを利用しない場合は、以下の方法もご検討ください。
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>プロフィールを非公開にする</li>
                    <li>メール通知を停止する</li>
                    <li>一時的にログアウトして利用を控える</li>
                  </ul>
                </section>
              </>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition font-semibold"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
