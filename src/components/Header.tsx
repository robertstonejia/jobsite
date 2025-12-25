'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Dialog from '@/components/Dialog'

export default function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)

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
      setShowSubscriptionDialog(true)
    }
  }

  const handleSubscriptionDialogClose = () => {
    setShowSubscriptionDialog(false)
    router.push('/dashboard/company/subscription')
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

  const getDashboardText = () => {
    if (!session) return 'マイページ'
    const role = (session.user as any).role
    if (role === 'COMPANY') return '企業ダッシュボード'
    if (role === 'ENGINEER') return 'マイページ'
    return 'マイページ'
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
    <header className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 py-4 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold hover:opacity-80 transition">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 外側のリング - グラデーション */}
              <circle cx="16" cy="16" r="14" stroke="url(#logoGradientBlue)" strokeWidth="2.5" fill="none" />
              {/* 中心のノード */}
              <circle cx="16" cy="16" r="4" fill="#3b82f6" />
              {/* 接続線 - 上 */}
              <line x1="16" y1="12" x2="16" y2="5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              {/* 接続線 - 右下 */}
              <line x1="19" y1="18.5" x2="24" y2="24" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              {/* 接続線 - 左下 */}
              <line x1="13" y1="18.5" x2="8" y2="24" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              {/* 小さなノード - 上 */}
              <circle cx="16" cy="5" r="2.5" fill="#3b82f6" />
              {/* 小さなノード - 右下 */}
              <circle cx="24" cy="24" r="2.5" fill="#6366f1" />
              {/* 小さなノード - 左下 */}
              <circle cx="8" cy="24" r="2.5" fill="#6366f1" />
              <defs>
                <linearGradient id="logoGradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">seekjob</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="メニュー"
          >
            <span className={`w-6 h-0.5 bg-gray-700 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-gray-700 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-gray-700 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          {/* Desktop menu */}
          <ul className="hidden lg:flex gap-6 xl:gap-8 items-center text-sm xl:text-base text-gray-800 font-medium">
            <li>
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="text-gray-700 hover:text-blue-600 transition">
                求人検索
              </Link>
            </li>
            <li>
              <Link href="/projects" className="text-gray-700 hover:text-blue-600 transition">
                IT案件
              </Link>
            </li>
            <li>
              <Link
                href="/companies/advanced-talent"
                onClick={handleAdvancedTalentClick}
                className="text-gray-700 hover:text-blue-600 transition whitespace-nowrap"
              >
                高度人材企業
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-gray-700 hover:text-blue-600 transition whitespace-nowrap">
                利用契約
              </Link>
            </li>
            {status === 'authenticated' ? (
              <>
                {getDashboardLink() && (
                  <li>
                    <Link href={getDashboardLink()!} className="text-gray-700 hover:text-blue-600 transition relative whitespace-nowrap">
                      {getDashboardText()}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )}
                <li className="flex items-center gap-2 xl:gap-4">
                  <span className="text-xs xl:text-sm text-gray-500 hidden xl:inline">
                    👤 {getUserDisplayName()}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 xl:px-4 py-2 rounded-lg transition text-sm"
                  >
                    ログアウト
                  </button>
                </li>
              </>
            ) : null}
          </ul>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-3">
            <Link
              href="/"
              className="block py-2 text-gray-700 hover:text-blue-600 transition font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              ホーム
            </Link>
            <Link
              href="/jobs"
              className="block py-2 text-gray-700 hover:text-blue-600 transition font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              求人検索
            </Link>
            <Link
              href="/projects"
              className="block py-2 text-gray-700 hover:text-blue-600 transition font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              IT案件
            </Link>
            <Link
              href="/companies/advanced-talent"
              onClick={(e) => {
                handleAdvancedTalentClick(e)
                setMobileMenuOpen(false)
              }}
              className="block py-2 text-gray-700 hover:text-blue-600 transition font-medium"
            >
              高度人材企業
            </Link>
            <Link
              href="/terms"
              className="block py-2 text-gray-700 hover:text-blue-600 transition font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              利用契約
            </Link>
            {status === 'authenticated' && (
              <>
                {getDashboardLink() && (
                  <Link
                    href={getDashboardLink()!}
                    className="block py-2 text-gray-700 hover:text-blue-600 transition font-medium relative"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {getDashboardText()}
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                <div className="py-2 border-t border-gray-200 mt-2">
                  <span className="block text-sm text-gray-500 mb-2">
                    👤 {getUserDisplayName()}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition text-sm w-full text-left"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      <Dialog
        isOpen={showSubscriptionDialog}
        onClose={handleSubscriptionDialogClose}
        title="有料プランが必要です"
        message="高度人材企業の閲覧には有料プランへの登録が必要です。登録ページに移動しますか?"
        type="info"
      />
    </header>
  )
}
