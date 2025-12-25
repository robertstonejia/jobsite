'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Skill {
  id: string
  name: string
  category: string
}

interface JobData {
  id: string
  title: string
  description: string
  requirements: string | null
  benefits: string | null
  jobType: string
  location: string | null
  remoteOk: boolean
  salaryMin: number | null
  salaryMax: number | null
  isActive: boolean
  skills: Array<{
    skill: {
      id: string
      name: string
    }
  }>
}

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    jobType: 'FULL_TIME',
    location: '',
    remoteOk: false,
    salaryMin: '',
    salaryMax: '',
    isActive: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && params.id) {
      fetchJob()
      fetchSkills()
    }
  }, [status, params.id, router])

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`)
      if (response.ok) {
        const data: JobData = await response.json()
        setJobData(data)

        // Set form data
        setFormData({
          title: data.title,
          description: data.description,
          requirements: data.requirements || '',
          benefits: data.benefits || '',
          jobType: data.jobType,
          location: data.location || '',
          remoteOk: data.remoteOk,
          salaryMin: data.salaryMin?.toString() || '',
          salaryMax: data.salaryMax?.toString() || '',
          isActive: data.isActive,
        })

        // Set selected skills
        setSelectedSkills(data.skills.map(s => s.skill.id))
      } else {
        setError('求人情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      setError('求人情報の取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills')
      if (response.ok) {
        const data = await response.json()
        setSkills(data)
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
          skillIds: selectedSkills,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccessDialog(true)
      } else {
        // Handle zod validation errors
        if (Array.isArray(data.error)) {
          setError(data.error.map((e: any) => e.message).join(', '))
        } else if (typeof data.error === 'object') {
          setError(JSON.stringify(data.error))
        } else {
          setError(data.error || '求人の更新に失敗しました')
        }
      }
    } catch (err) {
      console.error('Job update error:', err)
      setError('求人の更新中にエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirmDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirmDialog(false)

    try {
      const response = await fetch(`/api/jobs/${params.id}`, {
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
          setError(data.error || '求人の削除に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      setError('求人の削除中にエラーが発生しました')
    }
  }

  if (status === 'loading' || loading) {
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

  if (!jobData) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">求人が見つかりません</h1>
            <button
              onClick={() => router.push('/dashboard/company')}
              className="text-primary-500 hover:underline"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 mb-4"
              >
                ← 戻る
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">求人編集</h1>
              <p className="text-gray-600">求人情報を更新してください</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      求人タイトル <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="例: フルスタックエンジニア募集"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      仕事内容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      value={formData.description}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="仕事の内容を詳しく記載してください"
                    />
                  </div>

                  <div>
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                      応募要件
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="必須スキルや経験年数など"
                    />
                  </div>

                  <div>
                    <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                      福利厚生・待遇
                    </label>
                    <textarea
                      id="benefits"
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="福利厚生や待遇について"
                    />
                  </div>
                </div>
              </div>

              {/* 雇用条件 */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">雇用条件</h2>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
                        雇用形態 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="jobType"
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      >
                        <option value="FULL_TIME">正社員</option>
                        <option value="PART_TIME">パート</option>
                        <option value="CONTRACT">契約社員</option>
                        <option value="FREELANCE">フリーランス</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        勤務地
                      </label>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="東京都渋谷区"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-2">
                        最低年収（円）
                      </label>
                      <input
                        id="salaryMin"
                        name="salaryMin"
                        type="number"
                        value={formData.salaryMin}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="4000000"
                      />
                    </div>

                    <div>
                      <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-2">
                        最高年収（円）
                      </label>
                      <input
                        id="salaryMax"
                        name="salaryMax"
                        type="number"
                        value={formData.salaryMax}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="8000000"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="remoteOk"
                        checked={formData.remoteOk}
                        onChange={handleChange}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">リモートワーク可</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">求人を公開する</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 必要スキル */}
              <div className="pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">必要スキル</h2>
                <p className="text-sm text-gray-600 mb-4">該当するスキルを選択してください</p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedSkills.includes(skill.id)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                >
                  削除
                </button>
                <div className="flex-1"></div>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? '更新中...' : '更新する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />

      {/* Success Dialog */}
      <ConfirmDialog
        isOpen={showSuccessDialog}
        title="更新完了"
        message="求人を更新しました。"
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
        message="本当にこの求人を削除しますか？この操作は取り消せません。"
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
        message="求人を削除しました。"
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
