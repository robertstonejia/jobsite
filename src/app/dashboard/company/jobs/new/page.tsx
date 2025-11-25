'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Skill {
  id: string
  name: string
  category: string
}

export default function NewJobPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

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
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchSkills()
    }
  }, [status, router])

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
    setLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
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

      console.log('Response status:', response.status)
      console.log('Response data:', data)

      if (response.ok) {
        alert('求人を作成しました')
        router.push('/dashboard/company')
      } else {
        if (data.requiresPayment) {
          // Redirect to subscription page with error message
          if (confirm(data.error + '\n\n有料プラン登録ページに移動しますか？')) {
            router.push('/dashboard/company/subscription')
          }
        } else {
          setError(data.error || '求人の作成に失敗しました')
        }
      }
    } catch (err) {
      console.error('Job creation error:', err)
      setError('求人の作成中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
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
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">新規求人作成</h1>
              <p className="text-gray-600">求人情報を入力してください</p>
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

                  <div>
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

                {skills.length === 0 && (
                  <p className="text-gray-500 text-center py-4">スキルがまだ登録されていません</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? '作成中...' : '求人を作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
