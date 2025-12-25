'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Dialog from '@/components/Dialog'

interface Experience {
  id: string
  companyName: string
  position: string
  description: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

interface Skill {
  id: string
  name: string
  category: string
}

interface EngineerSkill {
  id: string
  level: number
  yearsUsed: number | null
  skill: Skill
}

interface EngineerProfile {
  firstName: string
  lastName: string
  displayName: string | null
  birthDate: string | null
  phoneNumber: string | null
  nationality: string | null
  residenceStatus: string | null
  residenceExpiry: string | null
  address: string | null
  nearestStation: string | null
  bio: string | null
  yearsOfExperience: number | null
  currentPosition: string | null
  desiredPosition: string | null
  desiredSalaryMin: number | null
  desiredSalaryMax: number | null
  availableFrom: string | null
  isITEngineer: boolean
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  experiences?: Experience[]
  skills?: EngineerSkill[]
}

export default function EngineerProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingSkills, setSavingSkills] = useState(false)
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'info' | 'confirm'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Map<string, { level: number; yearsUsed: number }>>(new Map())
  const [showExpForm, setShowExpForm] = useState(false)
  const [editingExpId, setEditingExpId] = useState<string | null>(null)
  const [expFormData, setExpFormData] = useState({
    companyName: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  })

  const [formData, setFormData] = useState<EngineerProfile>({
    firstName: '',
    lastName: '',
    displayName: null,
    birthDate: null,
    phoneNumber: null,
    nationality: null,
    residenceStatus: null,
    residenceExpiry: null,
    address: null,
    nearestStation: null,
    bio: null,
    yearsOfExperience: null,
    currentPosition: null,
    desiredPosition: null,
    desiredSalaryMin: null,
    desiredSalaryMax: null,
    availableFrom: null,
    isITEngineer: true,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    experiences: [],
    skills: [],
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
      fetchSkills()
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
          residenceExpiry: data.residenceExpiry ? data.residenceExpiry.split('T')[0] : null,
          isITEngineer: data.isITEngineer ?? true,
          experiences: data.experiences || [],
          skills: data.skills || [],
        })

        // Initialize selected skills
        if (data.skills) {
          const skillMap = new Map()
          data.skills.forEach((es: EngineerSkill) => {
            skillMap.set(es.skill.id, {
              level: es.level,
              yearsUsed: es.yearsUsed || 0,
            })
          })
          setSelectedSkills(skillMap)
        }
      } else {
        setDialog({
          isOpen: true,
          type: 'error',
          title: 'エラー',
          message: 'プロフィールの取得に失敗しました',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: 'プロフィールの取得中にエラーが発生しました',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills')
      if (response.ok) {
        const data = await response.json()
        setAllSkills(data)
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
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
        setDialog({
          isOpen: true,
          type: 'success',
          title: '保存成功',
          message: 'プロフィールを正常に更新しました。',
        })
      } else {
        let errorMessage = 'プロフィールの更新に失敗しました'
        if (Array.isArray(data.error)) {
          // Zod validation errors
          errorMessage = data.error.map((err: any) => `${err.path.join('.')}: ${err.message}`).join('\n')
        } else if (data.error) {
          errorMessage = data.error
        }

        setDialog({
          isOpen: true,
          type: 'error',
          title: '保存失敗',
          message: errorMessage,
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: 'プロフィールの更新中にエラーが発生しました。\nもう一度お試しください。',
      })
    } finally {
      setSaving(false)
    }
  }

  // Skills management handlers
  const handleSkillToggle = (skillId: string) => {
    const newMap = new Map(selectedSkills)
    if (newMap.has(skillId)) {
      newMap.delete(skillId)
    } else {
      newMap.set(skillId, { level: 3, yearsUsed: 1 })
    }
    setSelectedSkills(newMap)
  }

  const handleLevelChange = (skillId: string, level: number) => {
    const newMap = new Map(selectedSkills)
    const current = newMap.get(skillId)
    if (current) {
      newMap.set(skillId, { ...current, level })
      setSelectedSkills(newMap)
    }
  }

  const handleYearsChange = (skillId: string, years: number) => {
    const newMap = new Map(selectedSkills)
    const current = newMap.get(skillId)
    if (current) {
      newMap.set(skillId, { ...current, yearsUsed: years })
      setSelectedSkills(newMap)
    }
  }

  const handleSaveSkills = async () => {
    setSavingSkills(true)
    try {
      const skillsData = Array.from(selectedSkills.entries()).map(([skillId, data]) => ({
        skillId,
        level: data.level,
        yearsUsed: data.yearsUsed,
      }))

      const response = await fetch('/api/engineer/skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills: skillsData }),
      })

      if (response.ok) {
        await fetchProfile()
        setDialog({
          isOpen: true,
          type: 'success',
          title: '保存成功',
          message: 'スキル情報を正常に更新しました。',
        })
      } else {
        const data = await response.json()
        setDialog({
          isOpen: true,
          type: 'error',
          title: '保存失敗',
          message: data.error || 'スキル情報の更新に失敗しました',
        })
      }
    } catch (error) {
      console.error('Error updating skills:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: 'スキル情報の更新中にエラーが発生しました。\nもう一度お試しください。',
      })
    } finally {
      setSavingSkills(false)
    }
  }

  // Experience management handlers
  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setExpFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleExpSubmit = async () => {
    // バリデーション
    if (!expFormData.companyName.trim()) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: '入力エラー',
        message: '会社名は必須です。',
      })
      return
    }

    if (!expFormData.position.trim()) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: '入力エラー',
        message: '役職は必須です。',
      })
      return
    }

    if (!expFormData.startDate) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: '入力エラー',
        message: '開始日は必須です。',
      })
      return
    }

    try {
      const url = editingExpId
        ? `/api/engineer/experiences/${editingExpId}`
        : '/api/engineer/experiences'

      // 空文字列をundefinedに変換
      const submitData = {
        companyName: expFormData.companyName,
        position: expFormData.position,
        description: expFormData.description || undefined,
        startDate: expFormData.startDate,
        endDate: expFormData.endDate || null,
        isCurrent: expFormData.isCurrent,
      }

      const response = await fetch(url, {
        method: editingExpId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const savedExp = await response.json()
        console.log('Experience saved:', savedExp)

        // プロフィールを再取得して最新の職歴を表示
        await fetchProfile()
        resetExpForm()
        setDialog({
          isOpen: true,
          type: 'success',
          title: '保存成功',
          message: '職歴を正常に保存しました。',
        })
      } else {
        const data = await response.json()
        setDialog({
          isOpen: true,
          type: 'error',
          title: '保存失敗',
          message: data.error || '職歴の保存に失敗しました',
        })
      }
    } catch (error) {
      console.error('Error saving experience:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '職歴の保存中にエラーが発生しました。\nもう一度お試しください。',
      })
    }
  }

  const handleExpEdit = (exp: Experience) => {
    setExpFormData({
      companyName: exp.companyName,
      position: exp.position,
      description: exp.description || '',
      startDate: exp.startDate.split('T')[0],
      endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
      isCurrent: exp.isCurrent,
    })
    setEditingExpId(exp.id)
    setShowExpForm(true)
  }

  const handleExpDelete = (id: string) => {
    // 削除確認ダイアログを表示
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: '職歴の削除',
      message: 'この職歴を削除してもよろしいですか？\nこの操作は取り消せません。',
      onConfirm: () => confirmExpDelete(id),
    })
  }

  const confirmExpDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/engineer/experiences/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchProfile()
        setDialog({
          isOpen: true,
          type: 'success',
          title: '削除成功',
          message: '職歴を正常に削除しました。',
        })
      } else {
        setDialog({
          isOpen: true,
          type: 'error',
          title: '削除失敗',
          message: '職歴の削除に失敗しました',
        })
      }
    } catch (error) {
      console.error('Error deleting experience:', error)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '職歴の削除中にエラーが発生しました。\nもう一度お試しください。',
      })
    }
  }

  const resetExpForm = () => {
    setExpFormData({
      companyName: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
    })
    setEditingExpId(null)
    setShowExpForm(false)
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
      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        confirmText={dialog.type === 'confirm' ? '削除' : 'OK'}
        cancelText="キャンセル"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
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
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                    国籍
                  </label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="">選択してください</option>
                    <option value="日本">日本</option>
                    <option value="中国">中国</option>
                    <option value="韓国">韓国</option>
                    <option value="アメリカ">アメリカ</option>
                    <option value="イギリス">イギリス</option>
                    <option value="フランス">フランス</option>
                    <option value="ドイツ">ドイツ</option>
                    <option value="インド">インド</option>
                    <option value="ベトナム">ベトナム</option>
                    <option value="フィリピン">フィリピン</option>
                    <option value="タイ">タイ</option>
                    <option value="インドネシア">インドネシア</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                {/* 在留資格情報（日本以外の国籍の場合のみ表示） */}
                {formData.nationality && formData.nationality !== '日本' && (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        ⚠️ 在留資格情報の入力が必要です
                      </p>
                      <p className="text-xs text-yellow-700">
                        日本国籍以外の方は、在留資格の種類と在留期限の入力が必須となります。
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="residenceStatus" className="block text-sm font-medium text-gray-700 mb-2">
                          在留資格の種類 <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="residenceStatus"
                          name="residenceStatus"
                          value={formData.residenceStatus || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                          <option value="">選択してください</option>
                          <option value="永住者">永住者</option>
                          <option value="特別永住者">特別永住者</option>
                          <option value="日本人の配偶者等">日本人の配偶者等</option>
                          <option value="永住者の配偶者等">永住者の配偶者等</option>
                          <option value="定住者">定住者</option>
                          <option value="技術・人文知識・国際業務">技術・人文知識・国際業務</option>
                          <option value="高度専門職">高度専門職</option>
                          <option value="技能">技能</option>
                          <option value="留学">留学</option>
                          <option value="家族滞在">家族滞在</option>
                          <option value="特定活動">特定活動</option>
                          <option value="その他">その他</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="residenceExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                          在留期限 <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="residenceExpiry"
                          name="residenceExpiry"
                          type="date"
                          value={formData.residenceExpiry || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

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
                  <select
                    id="availableFrom"
                    name="availableFrom"
                    value={formData.availableFrom || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="">選択してください</option>
                    <option value="すぐにでも">すぐにでも</option>
                    <option value="一か月以内">一か月以内</option>
                    <option value="三か月以内">三か月以内</option>
                    <option value="半年以内">半年以内</option>
                    <option value="一年以内">一年以内</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-500">いつ頃から新しい職場で働けるかをお知らせください</p>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isITEngineer"
                    name="isITEngineer"
                    checked={formData.isITEngineer}
                    onChange={(e) => setFormData(prev => ({ ...prev, isITEngineer: e.target.checked }))}
                    className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <label htmlFor="isITEngineer" className="text-sm font-medium text-gray-700">
                    IT技術者
                  </label>
                  <p className="text-sm text-gray-500 ml-2">IT技術者の場合、スキル管理とSNS・ポートフォリオの項目が表示されます</p>
                </div>
              </div>
            </div>

            {/* 職歴 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">職歴</h2>
                {!showExpForm && (
                  <button
                    type="button"
                    onClick={() => setShowExpForm(true)}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition text-sm font-medium"
                  >
                    + 職歴を追加
                  </button>
                )}
              </div>

              {showExpForm && (
                <div className="mb-6 border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">{editingExpId ? '職歴を編集' : '職歴を追加'}</h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          会社名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="companyName"
                          type="text"
                          value={expFormData.companyName}
                          onChange={handleExpChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          役職 <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="position"
                          type="text"
                          value={expFormData.position}
                          onChange={handleExpChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">職務内容</label>
                      <textarea
                        name="description"
                        value={expFormData.description}
                        onChange={handleExpChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          開始日 <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="startDate"
                          type="date"
                          value={expFormData.startDate}
                          onChange={handleExpChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                        <input
                          name="endDate"
                          type="date"
                          value={expFormData.endDate}
                          onChange={handleExpChange}
                          disabled={expFormData.isCurrent}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isCurrent"
                          checked={expFormData.isCurrent}
                          onChange={handleExpChange}
                          className="w-4 h-4 text-primary-500 rounded"
                        />
                        <span className="text-sm text-gray-700">現在この会社に在籍中</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={resetExpForm}
                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={handleExpSubmit}
                        className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition text-sm"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                        <p className="text-gray-600 mt-2 text-sm whitespace-pre-wrap">{exp.description}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => handleExpEdit(exp)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExpDelete(exp.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    職歴が登録されていません
                  </p>
                )}
              </div>
            </div>

            {/* SNS・ポートフォリオ (IT技術者のみ) */}
            {formData.isITEngineer && (
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
            )}

            {/* スキル管理 (IT技術者のみ) */}
            {formData.isITEngineer && (
              <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">スキル管理</h2>
                <button
                  type="button"
                  onClick={handleSaveSkills}
                  disabled={savingSkills}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 text-sm"
                >
                  {savingSkills ? 'スキル保存中...' : 'スキルを保存'}
                </button>
              </div>

              {selectedSkills.size > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-semibold text-gray-900">選択中のスキル: {selectedSkills.size}件</h3>
                  {Array.from(selectedSkills.entries()).map(([skillId, data]) => {
                    const skill = allSkills.find(s => s.id === skillId)
                    if (!skill) return null
                    return (
                      <div key={skillId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">{skill.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({skill.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">レベル:</label>
                          <select
                            value={data.level}
                            onChange={(e) => handleLevelChange(skillId, parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                          >
                            <option value={1}>1 - 初級</option>
                            <option value={2}>2 - 中級下</option>
                            <option value={3}>3 - 中級</option>
                            <option value={4}>4 - 上級</option>
                            <option value={5}>5 - エキスパート</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">経験:</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={data.yearsUsed}
                            onChange={(e) => handleYearsChange(skillId, parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                          <span className="text-sm text-gray-600">年</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSkillToggle(skillId)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                        >
                          削除
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {allSkills.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-900">スキルを追加</h3>
                  {Object.entries(allSkills.reduce((acc, skill) => {
                    if (!acc[skill.category]) {
                      acc[skill.category] = []
                    }
                    acc[skill.category].push(skill)
                    return acc
                  }, {} as Record<string, Skill[]>))
                    .sort(([categoryA], [categoryB]) => {
                      // プログラミング言語とデータベースを最初に表示
                      const priorityCategories = ['プログラミング言語', 'データベース']
                      const aIndex = priorityCategories.indexOf(categoryA)
                      const bIndex = priorityCategories.indexOf(categoryB)

                      if (aIndex !== -1 && bIndex !== -1) {
                        return aIndex - bIndex
                      }
                      if (aIndex !== -1) return -1
                      if (bIndex !== -1) return 1
                      return categoryA.localeCompare(categoryB)
                    })
                    .map(([category, skills]) => (
                    <div key={category} className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {skills.map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => handleSkillToggle(skill.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              selectedSkills.has(skill.id)
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {skill.name}
                            {selectedSkills.has(skill.id) && ' ✓'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {allSkills.length === 0 && (
                <p className="text-gray-500 text-center py-4">スキルデータを読み込み中...</p>
              )}
            </div>
            )}

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
