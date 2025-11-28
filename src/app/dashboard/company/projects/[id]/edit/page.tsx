'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    preferredSkills: '',
    monthlyRate: '',
    workingHours: '',
    contractType: '',
    interviewCount: '',
    nearestStation: '',
    paymentTerms: '',
    category: '',
    duration: '',
    location: '',
    remoteOk: false,
    foreignNationalityOk: false,
    isActive: true
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProject()
    }
  }, [status, params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          title: data.title || '',
          description: data.description || '',
          requirements: data.requirements || '',
          preferredSkills: data.preferredSkills || '',
          monthlyRate: data.monthlyRate?.toString() || '',
          workingHours: data.workingHours || '',
          contractType: data.contractType || '',
          interviewCount: data.interviewCount?.toString() || '',
          nearestStation: data.nearestStation || '',
          paymentTerms: data.paymentTerms || '',
          category: data.category || '',
          duration: data.duration || '',
          location: data.location || '',
          remoteOk: data.remoteOk || false,
          foreignNationalityOk: data.foreignNationalityOk || false,
          isActive: data.isActive !== undefined ? data.isActive : true
        })
      } else {
        setError('案件が見つかりませんでした')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('案件情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Exclude numeric fields from formData spread
      const { monthlyRate, interviewCount, ...restFormData } = formData

      const payload: any = {
        ...restFormData,
      }

      // Only include numeric fields if they have values
      if (monthlyRate) {
        payload.monthlyRate = parseInt(monthlyRate)
      }
      if (interviewCount) {
        payload.interviewCount = parseInt(interviewCount)
      }

      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowSuccessDialog(true)
      } else {
        const data = await response.json()
        // Handle zod validation errors
        if (Array.isArray(data.error)) {
          setError(data.error.map((e: any) => e.message).join(', '))
        } else if (typeof data.error === 'object') {
          setError(JSON.stringify(data.error))
        } else {
          setError(data.error || '更新に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error updating project:', error)
      setError('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirmDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirmDialog(false)
    setDeleting(true)

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteDialog(true)
      } else {
        const data = await response.json()
        // Handle zod validation errors
        if (Array.isArray(data.error)) {
          setError(data.error.map((e: any) => e.message).join(', '))
        } else if (typeof data.error === 'object') {
          setError(JSON.stringify(data.error))
        } else {
          setError(data.error || '削除に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      setError('削除に失敗しました')
    } finally {
      setDeleting(false)
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

  const categories = ['Java', 'C#', 'PHP', 'Ruby', 'Python', 'JavaScript', 'AWS', 'Linux', 'Go', 'Kotlin', 'その他']

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IT案件を編集</h1>
            <p className="text-gray-600">案件情報を更新してください</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件タイトル *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例: Reactエンジニア募集"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                職務内容 *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="案件の詳細な説明を入力してください"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  必須スキル
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: React 3年以上、TypeScript経験"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  尚可スキル
                </label>
                <textarea
                  value={formData.preferredSkills}
                  onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: Next.js、AWS経験"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月額単価（円）
                </label>
                <input
                  type="number"
                  value={formData.monthlyRate}
                  onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 600000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  稼働時間
                </label>
                <input
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 160-180時間/月"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  契約形態
                </label>
                <input
                  type="text"
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 業務委託、準委任"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商談回数
                </label>
                <input
                  type="number"
                  value={formData.interviewCount}
                  onChange={(e) => setFormData({ ...formData, interviewCount: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト期間
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 6ヶ月（延長可能性あり）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支払サイト
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 月末締め翌月末払い"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  勤務地
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 東京都渋谷区"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最寄駅
                </label>
                <input
                  type="text"
                  value={formData.nearestStation}
                  onChange={(e) => setFormData({ ...formData, nearestStation: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例: 渋谷駅"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.remoteOk}
                  onChange={(e) => setFormData({ ...formData, remoteOk: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">リモート可</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.foreignNationalityOk}
                  onChange={(e) => setFormData({ ...formData, foreignNationalityOk: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">外国籍可</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">案件を公開する</span>
              </label>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? '更新中...' : '更新する'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />

      {/* Success Dialog */}
      <ConfirmDialog
        isOpen={showSuccessDialog}
        title="更新完了"
        message="IT案件を更新しました。"
        confirmText="OK"
        cancelText=""
        onConfirm={() => {
          setShowSuccessDialog(false)
          router.push('/dashboard/company')
        }}
        onCancel={() => {}}
        type="success"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirmDialog}
        title="削除の確認"
        message="この案件を削除してもよろしいですか？"
        confirmText="削除する"
        cancelText="キャンセル"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirmDialog(false)}
        type="warning"
      />

      {/* Delete Success Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="削除完了"
        message="IT案件を削除しました。"
        confirmText="OK"
        cancelText=""
        onConfirm={() => {
          setShowDeleteDialog(false)
          router.push('/dashboard/company')
        }}
        onCancel={() => {}}
        type="success"
      />
    </>
  )
}
