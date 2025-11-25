'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUnreadCount()
      fetchSubscriptionStatus()
      // 30秒ごとに未読メッセージ数を更新
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [status])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchSubscriptionStatus = async () => {
    const role = (session?.user as any)?.role
    if (role === 'COMPANY') {
      try {
        const response = await fetch('/api/company/profile')
        if (response.ok) {
          const data = await response.json()
          const now = new Date()
          const expiry = data.subscriptionExpiry ? new Date(data.subscriptionExpiry) : null
          const isActive = data.subscriptionPlan !== 'FREE' && expiry && expiry > now
          setHasActiveSubscription(isActive || false)
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error)
      }
    }
  }

  const handleAdvancedTalentClick = (e: React.MouseEvent) => {
    const role = (session?.user as any)?.role
    if (role === 'COMPANY' && !hasActiveSubscription) {
      e.preventDefault()
      if (confirm('高度人材企業の閲覧には有料プランへの登録が必要です。登録ページに移動しますか?')) {
        router.push('/dashboard/company/subscription')
      }
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const getDashboardLink = () => {
    if (!session) return null
    const role = (session.user as any).role
    if (role === 'COMPANY') return '/dashboard/company'
    if (role === 'ENGINEER') return '/dashboard/engineer'
    return null
  }

  const getUserDisplayName = () => {
    if (!session) return null
    return session.user?.email || 'ユーザー'
  }

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (!session) return

    const role = (session.user as any).role

    // 企業の場合は常にダッシュボードの応募者管理タブを開く
    if (role === 'COMPANY') {
      router.push('/dashboard/company?tab=applications')
    } else if (role === 'ENGINEER') {
      // 技術者の場合は未読メッセージがある最初の応募を取得して遷移
      if (unreadCount === 0) {
        router.push(getDashboardLink() || '/')
        return
      }

      try {
        const response = await fetch('/api/applications/first-unread')
        if (response.ok) {
          const data = await response.json()
          if (data.applicationId) {
            router.push(`/dashboard/engineer/applications/${data.applicationId}`)
          } else {
            router.push(getDashboardLink() || '/')
          }
        }
      } catch (error) {
        console.error('Error navigating to unread message:', error)
        router.push(getDashboardLink() || '/')
      }
    } else {
      router.push(getDashboardLink() || '/')
    }
  }

  return (
    <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition">
            🚀 TechJob
          </Link>
          <ul className="flex gap-8 items-center">
            <li>
              <Link href="/" className="hover:opacity-80 transition">
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:opacity-80 transition">
                求人検索
              </Link>
            </li>
            <li>
              <Link href="/projects" className="hover:opacity-80 transition">
                IT案件
              </Link>
            </li>
            <li>
              <Link
                href="/companies/advanced-talent"
                onClick={handleAdvancedTalentClick}
                className="hover:opacity-80 transition"
              >
                高度人材企業
              </Link>
            </li>
            {status === 'authenticated' ? (
              <>
                {getDashboardLink() && (
                  <li>
                    <Link href={getDashboardLink()!} className="hover:opacity-80 transition relative">
                      ダッシュボード
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )}
                <li>
                  <a
                    href="#"
                    onClick={handleMessageClick}
                    className="hover:opacity-80 transition relative cursor-pointer"
                  >
                    💬 メッセージ
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </a>
                </li>
                <li className="flex items-center gap-4">
                  <span className="text-sm opacity-90">
                    👤 {getUserDisplayName()}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
                  >
                    ログアウト
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/company/register" className="hover:opacity-80 transition">
                    企業登録
                  </Link>
                </li>
                <li>
                  <Link href="/engineer/register" className="hover:opacity-80 transition">
                    応募者登録
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                    ログイン
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </header>
  )
}
