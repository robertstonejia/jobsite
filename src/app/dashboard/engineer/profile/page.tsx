'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Experience {
  id: string
  companyName: string
  position: string
  description: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

interface EngineerProfile {
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
  experiences?: Experience[]
}

export default function EngineerProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<EngineerProfile>({
    firstName: '',
    lastName: '',
    displayName: null,
    birthDate: null,
    phoneNumber: null,
    address: null,
    nearestStation: null,
    bio: null,
    yearsOfExperience: null,
    currentPosition: null,
    desiredPosition: null,
    desiredSalaryMin: null,
    desiredSalaryMax: null,
    availableFrom: null,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    experiences: [],
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/engineer/profile')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          ...data,
          birthDate: data.birthDate ? data.birthDate.split('T')[0] : null,
          availableFrom: data.availableFrom ? data.availableFrom.split('T')[0] : null,
          experiences: data.experiences || [],
        })
      } else {
        setError('プロフィールの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('プロフィールの取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : parseInt(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      console.log('Submitting profile data:', formData)

      const response = await fetch('/api/engineer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)

      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        if (Array.isArray(data.error)) {
          // Zod validation errors
          const errorMessages = data.error.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
          setError(errorMessages)
        } else {
          setError(data.error || 'プロフィールの更新に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('プロフィールの更新中にエラーが発生しました: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">プロフィール編集</h1>
            <p className="text-gray-600">あなたの情報を更新して、企業にアピールしましょう</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              プロフィールを更新しました
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      姓 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    表示名
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="プロフィールに表示される名前"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                      生年月日
                    </label>
                    <input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    住所
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="東京都渋谷区..."
                  />
                </div>

                <div>
                  <label htmlFor="nearestStation" className="block text-sm font-medium text-gray-700 mb-2">
                    最寄り駅
                  </label>
                  <input
                    id="nearestStation"
                    name="nearestStation"
                    type="text"
                    value={formData.nearestStation || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="例: 渋谷駅"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="あなたの経歴やスキル、得意分野などを記載してください"
                  />
                </div>
              </div>
            </div>

            {/* 職務情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">職務情報</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="currentPosition" className="block text-sm font-medium text-gray-700 mb-2">
                      現在の職種
                    </label>
                    <input
                      id="currentPosition"
                      name="currentPosition"
                      type="text"
                      value={formData.currentPosition || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="例: フロントエンドエンジニア"
                    />
                  </div>

                  <div>
                    <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                      実務経験年数
                    </label>
                    <input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      min="0"
                      value={formData.yearsOfExperience || ''}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="desiredPosition" className="block text-sm font-medium text-gray-700 mb-2">
                    希望職種
                  </label>
                  <input
                    id="desiredPosition"
                    name="desiredPosition"
                    type="text"
                    value={formData.desiredPosition || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="例: シニアフロントエンドエンジニア"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    希望年収
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <input
                        id="desiredSalaryMin"
                        name="desiredSalaryMin"
                        type="number"
                        min="0"
                        step="10000"
                        value={formData.desiredSalaryMin || ''}
                        onChange={handleNumberChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="最低希望年収 (円)"
                      />
                    </div>
                    <div>
                      <input
                        id="desiredSalaryMax"
                        name="desiredSalaryMax"
                        type="number"
                        min="0"
                        step="10000"
                        value={formData.desiredSalaryMax || ''}
                        onChange={handleNumberChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="最高希望年収 (円)"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-2">
                    転職希望時期
                  </label>
                  <input
                    id="availableFrom"
                    name="availableFrom"
                    type="date"
                    value={formData.availableFrom || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <p className="mt-2 text-sm text-gray-500">いつ頃から新しい職場で働けるかをお知らせください</p>
                </div>
              </div>
            </div>

            {/* 職歴 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">職歴</h2>
              <div className="space-y-4">
                {formData.experiences && formData.experiences.length > 0 ? (
                  formData.experiences.map((exp) => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{exp.position}</h3>
                        {exp.isCurrent && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">在職中</span>
                        )}
                      </div>
                      <p className="text-gray-700 font-medium">{exp.companyName}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        {new Date(exp.startDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })} 〜
                        {exp.endDate ? new Date(exp.endDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) : '現在'}
                      </p>
                      {exp.description && (
                        <p className="text-gray-600 mt-2 text-sm">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    職歴が登録されていません
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/engineer/experiences')}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-500 transition"
                >
                  + 職歴を管理
                </button>
              </div>
            </div>

            {/* SNS・ポートフォリオ */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">SNS・ポートフォリオ</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub URL
                  </label>
                  <input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    value={formData.githubUrl || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={formData.linkedinUrl || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    ポートフォリオサイト URL
                  </label>
                  <input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    type="url"
                    value={formData.portfolioUrl || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
