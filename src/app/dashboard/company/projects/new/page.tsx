'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Dialog from '@/components/Dialog'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    preferredSkills: '',
    monthlyRate: '',
    workingHours: '',
    contractType: '業務委託',
    interviewCount: '',
    nearestStation: '',
    paymentTerms: '',
    category: 'Java',
    duration: '',
    location: '',
    remoteOk: false,
    foreignNationalityOk: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements || undefined,
          preferredSkills: formData.preferredSkills || undefined,
          monthlyRate: formData.monthlyRate ? parseInt(formData.monthlyRate) : undefined,
          workingHours: formData.workingHours || undefined,
          contractType: formData.contractType || undefined,
          interviewCount: formData.interviewCount ? parseInt(formData.interviewCount) : undefined,
          nearestStation: formData.nearestStation || undefined,
          paymentTerms: formData.paymentTerms || undefined,
          category: formData.category,
          duration: formData.duration || undefined,
          location: formData.location || undefined,
          remoteOk: formData.remoteOk,
          foreignNationalityOk: formData.foreignNationalityOk,
        }),
      })

      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data:', data)

      if (response.ok) {
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'IT案件投稿成功',
          message: 'IT案件が正常に投稿されました。'
        })
        setTimeout(() => {
          router.push('/dashboard/company')
        }, 2000)
      } else {
        if (data.requiresPayment) {
          // Redirect to subscription page with error message
          setDialog({
            isOpen: true,
            type: 'error',
            title: '有料プランが必要です',
            message: data.error + '\n\n有料プラン登録ページに移動しますか？'
          })
          setTimeout(() => {
            router.push('/dashboard/company/subscription')
          }, 3000)
        } else {
          setDialog({
            isOpen: true,
            type: 'error',
            title: 'IT案件投稿失敗',
            message: data.error || '投稿に失敗しました'
          })
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '投稿中にエラーが発生しました'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-primary-500 mb-4 transition"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IT案件投稿</h1>
            <p className="text-gray-600">1日5件まで投稿可能です</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
            {/* 基本情報 */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    案件タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例: Javaエンジニア募集"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      技術カテゴリー <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Java">Java</option>
                      <option value="C#">C#</option>
                      <option value="PHP">PHP</option>
                      <option value="Ruby">Ruby</option>
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="AWS">AWS</option>
                      <option value="Linux">Linux</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      月額単価（円）
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentRate = parseInt(formData.monthlyRate) || 0
                          const newRate = Math.max(0, currentRate - 10000)
                          setFormData({ ...formData, monthlyRate: newRate.toString() })
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        name="monthlyRate"
                        value={formData.monthlyRate}
                        onChange={handleChange}
                        step="10000"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 text-center"
                        placeholder="例: 600000"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const currentRate = parseInt(formData.monthlyRate) || 0
                          const newRate = currentRate + 10000
                          setFormData({ ...formData, monthlyRate: newRate.toString() })
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">※ ボタンで1万円ずつ増減できます</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 職務内容 */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">職務内容</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  職務内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="案件の詳細な職務内容を記載してください"
                />
              </div>
            </div>

            {/* スキル要件 */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">スキル要件</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    必須スキル
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例: Java開発経験3年以上、Spring Bootの実務経験"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    尚可スキル
                  </label>
                  <textarea
                    name="preferredSkills"
                    value={formData.preferredSkills}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例: AWSの知識、Docker/Kubernetesの経験"
                  />
                </div>
              </div>
            </div>

            {/* 契約条件 */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">契約条件</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    稼働時間
                  </label>
                  <input
                    type="text"
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例: 160-180時間/月"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    契約形態
                  </label>
                  <select
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="業務委託">業務委託</option>
                    <option value="準委任">準委任</option>
                    <option value="請負">請負</option>
                    <option value="派遣">派遣</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商談回数
                  </label>
                  <input
                    type="number"
                    name="interviewCount"
                    value={formData.interviewCount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例: 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支払サイト
                  </label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例: 月末締め翌月末払い"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロジェクト期間
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="例: 3ヶ月〜長期"
                  />
                </div>
              </div>
            </div>

            {/* 勤務地 */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">勤務地</h2>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最寄駅
                    </label>
                    <input
                      type="text"
                      name="nearestStation"
                      value={formData.nearestStation}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="例: 渋谷駅"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      勤務地
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="例: 東京都渋谷区"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="remoteOk"
                      checked={formData.remoteOk}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      リモートワーク可
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="foreignNationalityOk"
                      checked={formData.foreignNationalityOk}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      外国籍可
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:bg-gray-400"
              >
                {loading ? '投稿中...' : 'IT案件を投稿'}
              </button>
            </div>
          </form>
        </div>
      </div>

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
