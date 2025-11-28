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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-bold hover:opacity-80 transition">
            🚀 seekjob
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="メニュー"
          >
            <span className={`w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          {/* Desktop menu */}
          <ul className="hidden lg:flex gap-6 xl:gap-8 items-center text-sm xl:text-base">
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
                className="hover:opacity-80 transition whitespace-nowrap"
              >
                高度人材企業
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:opacity-80 transition whitespace-nowrap">
                利用契約
              </Link>
            </li>
            {status === 'authenticated' ? (
              <>
                {getDashboardLink() && (
                  <li>
                    <Link href={getDashboardLink()!} className="hover:opacity-80 transition relative whitespace-nowrap">
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
                  <span className="text-xs xl:text-sm opacity-90 hidden xl:inline">
                    👤 {getUserDisplayName()}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white/20 hover:bg-white/30 px-3 xl:px-4 py-2 rounded-lg transition text-sm"
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
              className="block py-2 hover:opacity-80 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              ホーム
            </Link>
            <Link
              href="/jobs"
              className="block py-2 hover:opacity-80 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              求人検索
            </Link>
            <Link
              href="/projects"
              className="block py-2 hover:opacity-80 transition"
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
              className="block py-2 hover:opacity-80 transition"
            >
              高度人材企業
            </Link>
            <Link
              href="/terms"
              className="block py-2 hover:opacity-80 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              利用契約
            </Link>
            {status === 'authenticated' && (
              <>
                {getDashboardLink() && (
                  <Link
                    href={getDashboardLink()!}
                    className="block py-2 hover:opacity-80 transition relative"
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
                <div className="py-2 border-t border-white/20 mt-2">
                  <span className="block text-sm opacity-90 mb-2">
                    👤 {getUserDisplayName()}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm w-full text-left"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
