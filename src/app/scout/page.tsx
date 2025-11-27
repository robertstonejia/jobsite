'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Engineer {
  id: string
  firstName: string
  lastName: string
  currentPosition: string | null
  yearsOfExperience: number | null
  desiredSalary: number | null
  user: {
    email: string
  }
  skills: Array<{
    skill: {
      id: string
      name: string
      category: string
    }
    level: number
  }>
}

export default function ScoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchSkill, setSearchSkill] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const [selectedEngineers, setSelectedEngineers] = useState<Set<string>>(new Set())
  const [scoutMessage, setScoutMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      const role = (session.user as any).role
      if (role !== 'COMPANY') {
        router.push('/')
        return
      }
      fetchEngineers()
    }
  }, [status, session, router])

  const fetchEngineers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchSkill) params.append('skill', searchSkill)
      if (minExperience) params.append('minExperience', minExperience)

      const response = await fetch(`/api/engineers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEngineers(data)
      }
    } catch (error) {
      console.error('Error fetching engineers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchEngineers()
  }

  const toggleEngineer = (engineerId: string) => {
    const newSelected = new Set(selectedEngineers)
    if (newSelected.has(engineerId)) {
      newSelected.delete(engineerId)
    } else {
      newSelected.add(engineerId)
    }
    setSelectedEngineers(newSelected)
  }

  const handleSendScout = async () => {
    if (selectedEngineers.size === 0) {
      alert('スカウトする応募者を選択してください')
      return
    }

    if (!scoutMessage.trim()) {
      alert('スカウトメッセージを入力してください')
      return
    }

    if (!confirm(`${selectedEngineers.size}名にスカウトメッセージを送信しますか？`)) {
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/scout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engineerIds: Array.from(selectedEngineers),
          message: scoutMessage,
        }),
      })

      if (response.ok) {
        alert('スカウトメッセージを送信しました')
        setSelectedEngineers(new Set())
        setScoutMessage('')
      } else {
        const error = await response.json()
        alert(`エラー: ${error.error || 'スカウトメッセージの送信に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error sending scout:', error)
      alert('スカウトメッセージの送信に失敗しました')
    } finally {
      setSending(false)
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">スカウト機能</h1>
            <p className="text-gray-600">優秀な応募者にスカウトメッセージを送信できます</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スキル検索
                </label>
                <input
                  type="text"
                  value={searchSkill}
                  onChange={(e) => setSearchSkill(e.target.value)}
                  placeholder="例: JavaScript, Python"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最低経験年数
                </label>
                <input
                  type="number"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  placeholder="例: 3"
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
                >
                  検索
                </button>
              </div>
            </div>
          </form>

          {/* Scout Message */}
          {selectedEngineers.size > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                スカウトメッセージ ({selectedEngineers.size}名選択中)
              </h3>
              <textarea
                value={scoutMessage}
                onChange={(e) => setScoutMessage(e.target.value)}
                placeholder="スカウトメッセージを入力してください"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-4"
                rows={6}
              />
              <button
                onClick={handleSendScout}
                disabled={sending}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
              >
                {sending ? '送信中...' : `${selectedEngineers.size}名にスカウトメッセージを送信`}
              </button>
            </div>
          )}

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              応募者一覧 ({engineers.length}名)
            </h2>

            {engineers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                応募者が見つかりませんでした
              </div>
            ) : (
              <div className="space-y-4">
                {engineers.map((engineer) => (
                  <div
                    key={engineer.id}
                    className={`border rounded-lg p-6 transition ${
                      selectedEngineers.has(engineer.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedEngineers.has(engineer.id)}
                            onChange={() => toggleEngineer(engineer.id)}
                            className="w-5 h-5 text-primary-500"
                          />
                          <h3 className="text-lg font-bold text-gray-900">
                            {engineer.lastName} {engineer.firstName}
                          </h3>
                        </div>

                        {engineer.currentPosition && (
                          <p className="text-sm text-gray-600 mb-2">
                            現職: {engineer.currentPosition}
                          </p>
                        )}

                        {engineer.yearsOfExperience !== null && (
                          <p className="text-sm text-gray-600 mb-2">
                            経験年数: {engineer.yearsOfExperience}年
                          </p>
                        )}

                        {engineer.desiredSalary && (
                          <p className="text-sm text-gray-600 mb-2">
                            希望年収: ¥{engineer.desiredSalary.toLocaleString()}
                          </p>
                        )}

                        {engineer.skills.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-2">スキル:</p>
                            <div className="flex flex-wrap gap-2">
                              {engineer.skills.map((skillItem) => (
                                <span
                                  key={skillItem.skill.id}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                >
                                  {skillItem.skill.name} (Lv.{skillItem.level})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/scout/${engineer.id}`)
                        }}
                        className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                      >
                        詳細を見る
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
