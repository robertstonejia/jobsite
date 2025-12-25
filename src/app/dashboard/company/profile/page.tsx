'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Dialog from '@/components/Dialog'

interface CompanyProfile {
  name: string
  description: string | null
  industry: string | null
  website: string | null
  address: string | null
  phoneNumber: string | null
  employeeCount: number | null
  foundedYear: number | null
  isITCompany: boolean
  supportsAdvancedTalentPoints: boolean
  emailNotificationEnabled: boolean
}

export default function CompanyProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const [dialog, setDialog] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'info'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  const [formData, setFormData] = useState<CompanyProfile>({
    name: '',
    description: null,
    industry: null,
    website: null,
    address: null,
    phoneNumber: null,
    employeeCount: null,
    foundedYear: null,
    isITCompany: true,
    supportsAdvancedTalentPoints: false,
    emailNotificationEnabled: true,
  })

  const [initialFormData, setInitialFormData] = useState<CompanyProfile>({
    name: '',
    description: null,
    industry: null,
    website: null,
    address: null,
    phoneNumber: null,
    employeeCount: null,
    foundedYear: null,
    isITCompany: true,
    supportsAdvancedTalentPoints: false,
    emailNotificationEnabled: true,
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
      const response = await fetch('/api/company/profile')
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
        setInitialFormData(data)
        setHasChanges(false)
      } else {
        setError('企業情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('企業情報の取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Detect form changes
  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData)
    setHasChanges(isChanged)
  }, [formData, initialFormData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value),
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
    setSaving(true)

    try {
      const response = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setInitialFormData(formData) // Reset initial data to current data
        setHasChanges(false) // Disable save button after successful save
        setDialog({
          isOpen: true,
          type: 'success',
          title: '保存成功',
          message: '企業情報を更新しました'
        })
      } else {
        const data = await response.json()
        let errorMessage = '企業情報の更新に失敗しました'
        if (Array.isArray(data.error)) {
          errorMessage = data.error.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        } else if (data.error) {
          errorMessage = data.error
        }
        setDialog({
          isOpen: true,
          type: 'error',
          title: '保存失敗',
          message: errorMessage
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '企業情報の更新中にエラーが発生しました'
      })
    } finally {
      setSaving(false)
    }
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4"
            >
              ← 戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">企業情報編集</h1>
            <p className="text-gray-600">企業の情報を更新してください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    会社名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    会社概要
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="会社の事業内容やビジョンなど"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                      業界
                    </label>
                    <input
                      id="industry"
                      name="industry"
                      type="text"
                      value={formData.industry || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="例: IT・Web・通信"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      ウェブサイト
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">連絡先情報</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    所在地
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
                    placeholder="03-1234-5678"
                  />
                </div>
              </div>
            </div>

            {/* 企業詳細 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">企業詳細</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-2">
                      従業員数
                    </label>
                    <input
                      id="employeeCount"
                      name="employeeCount"
                      type="number"
                      min="1"
                      value={formData.employeeCount || ''}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="例: 100"
                    />
                  </div>

                  <div>
                    <label htmlFor="foundedYear" className="block text-sm font-medium text-gray-700 mb-2">
                      設立年
                    </label>
                    <input
                      id="foundedYear"
                      name="foundedYear"
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={formData.foundedYear || ''}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="例: 2020"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 設定 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">設定</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="isITCompany"
                    name="isITCompany"
                    type="checkbox"
                    checked={formData.isITCompany}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isITCompany" className="ml-3 text-sm text-gray-700">
                    IT企業として登録
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="supportsAdvancedTalentPoints"
                    name="supportsAdvancedTalentPoints"
                    type="checkbox"
                    checked={formData.supportsAdvancedTalentPoints}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="supportsAdvancedTalentPoints" className="ml-3 text-sm text-gray-700">
                    高度人材加点制度に対応
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="emailNotificationEnabled"
                    name="emailNotificationEnabled"
                    type="checkbox"
                    checked={formData.emailNotificationEnabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="emailNotificationEnabled" className="ml-3 text-sm text-gray-700">
                    応募通知メールを受け取る
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
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

      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </>
  )
}
