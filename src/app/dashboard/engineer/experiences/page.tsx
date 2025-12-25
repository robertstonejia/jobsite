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

export default function ExperiencesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchExperiences()
    }
  }, [status, router])

  const fetchExperiences = async () => {
    try {
      const response = await fetch('/api/engineer/experiences')
      if (response.ok) {
        const data = await response.json()
        setExperiences(data)
      } else {
        setError('職歴の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching experiences:', error)
      setError('職歴の取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingId
        ? `/api/engineer/experiences/${editingId}`
        : '/api/engineer/experiences'

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchExperiences()
        resetForm()
        setShowAddForm(false)
        setEditingId(null)
      } else {
        const data = await response.json()
        setError(data.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('Error saving experience:', error)
      setError('保存中にエラーが発生しました')
    }
  }

  const handleEdit = (exp: Experience) => {
    setFormData({
      companyName: exp.companyName,
      position: exp.position,
      description: exp.description || '',
      startDate: exp.startDate.split('T')[0],
      endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
      isCurrent: exp.isCurrent,
    })
    setEditingId(exp.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この職歴を削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/engineer/experiences/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchExperiences()
      } else {
        setError('削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting experience:', error)
      setError('削除中にエラーが発生しました')
    }
  }

  const resetForm = () => {
    setFormData({
      companyName: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
    })
    setEditingId(null)
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">職歴管理</h1>
            <p className="text-gray-600">あなたの職歴を管理します</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="mb-6">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                + 職歴を追加
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingId ? '職歴を編集' : '職歴を追加'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      会社名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      役職・ポジション <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      required
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      職務内容
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                        開始日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                        終了日
                      </label>
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleChange}
                        disabled={formData.isCurrent}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isCurrent"
                        checked={formData.isCurrent}
                        onChange={handleChange}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">現在この会社に在籍中</span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        setShowAddForm(false)
                      }}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      保存
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{exp.position}</h3>
                  {exp.isCurrent && (
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                      在職中
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-700 font-medium mb-2">{exp.companyName}</p>
                <p className="text-gray-600 text-sm mb-3">
                  {new Date(exp.startDate).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                  })}{' '}
                  〜{' '}
                  {exp.endDate
                    ? new Date(exp.endDate).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                      })
                    : '現在'}
                </p>
                {exp.description && (
                  <p className="text-gray-600 mb-4 whitespace-pre-wrap">{exp.description}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}

            {experiences.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">まだ職歴が登録されていません</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  最初の職歴を追加する
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
