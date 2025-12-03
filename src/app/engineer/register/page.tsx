'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Dialog from '@/components/Dialog'

interface Experience {
  companyName: string
  position: string
  description: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

interface Skill {
  id: string
  name: string
  category: string
}

export default function EngineerRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  const [deleteExpIndex, setDeleteExpIndex] = useState<number | null>(null)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Map<string, { level: number; yearsUsed: number }>>(new Map())
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [showExpForm, setShowExpForm] = useState(false)
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null)
  const [expFormData, setExpFormData] = useState({
    companyName: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  })

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    nationality: '',
    residenceStatus: '',
    residenceExpiry: '',
    finalEducation: '',
    graduationSchool: '',
    major: '',
    graduationYear: '',
    address: '',
    nearestStation: '',
    bio: '',
    yearsOfExperience: '',
    currentPosition: '',
    desiredSalary: '',
    availableFrom: '',
    isITEngineer: false,
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    verificationType: 'email' as 'email' | 'phone',
  })

  // スキルデータを取得
  useEffect(() => {
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
    fetchSkills()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  // Experience handlers
  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setExpFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleExpSubmit = () => {
    // バリデーション
    if (!expFormData.companyName.trim()) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: '入力エラー',
        message: '会社名を入力してください',
      })
      return
    }
    if (!expFormData.position.trim()) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: '入力エラー',
        message: '役職を入力してください',
      })
      return
    }
    if (!expFormData.startDate) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: '入力エラー',
        message: '開始日を入力してください',
      })
      return
    }

    if (editingExpIndex !== null) {
      // 編集
      const newExperiences = [...experiences]
      newExperiences[editingExpIndex] = expFormData
      setExperiences(newExperiences)
    } else {
      // 追加
      setExperiences([...experiences, expFormData])
    }
    resetExpForm()
  }

  const handleExpEdit = (index: number) => {
    setExpFormData(experiences[index])
    setEditingExpIndex(index)
    setShowExpForm(true)
  }

  const handleExpDelete = (index: number) => {
    setDeleteExpIndex(index)
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: '職歴の削除',
      message: 'この職歴を削除してもよろしいですか？',
      onConfirm: () => {
        setExperiences(experiences.filter((_, i) => i !== index))
        setDeleteExpIndex(null)
      },
    })
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
    setEditingExpIndex(null)
    setShowExpForm(false)
  }

  // Skill handlers
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    // 国籍の入力は必須
    if (!formData.nationality) {
      setError('国籍の入力は必須です')
      return
    }

    // 日本以外の国籍の場合、在留資格と在留期限が必要
    if (formData.nationality !== '日本') {
      if (!formData.residenceStatus) {
        setError('在留資格の種類の入力は必須です')
        return
      }
      if (!formData.residenceExpiry) {
        setError('在留期限の入力は必須です')
        return
      }
    }

    // 電話番号検証の場合、電話番号が必要
    if (formData.verificationType === 'phone' && !formData.phoneNumber) {
      setError('電話番号検証を選択した場合、電話番号の入力が必要です')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register/engineer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber || undefined,
          birthDate: formData.birthDate || undefined,
          gender: formData.gender || undefined,
          nationality: formData.nationality,
          residenceStatus: formData.residenceStatus || undefined,
          residenceExpiry: formData.residenceExpiry || undefined,
          finalEducation: formData.finalEducation || undefined,
          graduationSchool: formData.graduationSchool || undefined,
          major: formData.major || undefined,
          graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
          address: formData.address || undefined,
          nearestStation: formData.nearestStation || undefined,
          bio: formData.bio || undefined,
          yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
          currentPosition: formData.currentPosition || undefined,
          desiredSalary: formData.desiredSalary ? parseInt(formData.desiredSalary) : undefined,
          availableFrom: formData.availableFrom || undefined,
          isITEngineer: formData.isITEngineer,
          githubUrl: formData.githubUrl || undefined,
          linkedinUrl: formData.linkedinUrl || undefined,
          portfolioUrl: formData.portfolioUrl || undefined,
          verificationType: formData.verificationType,
          // 職歴データ
          experiences: experiences.length > 0 ? experiences.map(exp => ({
            companyName: exp.companyName,
            position: exp.position,
            description: exp.description || undefined,
            startDate: exp.startDate,
            endDate: exp.endDate || undefined,
            isCurrent: exp.isCurrent,
          })) : undefined,
          // スキルデータ
          skills: selectedSkills.size > 0 ? Array.from(selectedSkills.entries()).map(([skillId, data]) => ({
            skillId,
            level: data.level,
            yearsUsed: data.yearsUsed,
          })) : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // 成功ダイアログを表示
        setDialog({
          isOpen: true,
          type: 'success',
          title: '登録成功',
          message: 'アカウントが正常に作成されました。\n\n登録したメールアドレスに確認コードを送信しました。\nメールをご確認ください。',
        })
        // 2秒後にメール検証画面に遷移
        setTimeout(() => {
          router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(formData.email)}`)
        }, 2000)
      } else {
        // エラーメッセージをクリーンアップ（localhostのURLを削除）
        let errorMessage = data.error || '登録に失敗しました'
        if (typeof errorMessage === 'string') {
          errorMessage = errorMessage.replace(/http:\/\/localhost:\d+/g, '').trim()
        }

        setDialog({
          isOpen: true,
          type: 'error',
          title: '登録失敗',
          message: errorMessage,
        })
      }
    } catch (err) {
      console.error('Registration error:', err)
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'エラー',
        message: '登録中にエラーが発生しました。\nもう一度お試しください。',
      })
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">応募者登録</h1>
            <p className="text-gray-600">あなたのスキルを活かせる仕事を見つけましょう</p>
          </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* アカウント情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">アカウント情報</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="your@example.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        パスワード <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="8文字以上"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        パスワード（確認） <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="パスワードを再入力"
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                        placeholder="山田"
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
                        placeholder="太郎"
                      />
                    </div>
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
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                        性別
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      >
                        <option value="">選択してください</option>
                        <option value="男性">男性</option>
                        <option value="女性">女性</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                      国籍 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="nationality"
                      name="nationality"
                      required
                      value={formData.nationality}
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
                            required
                            value={formData.residenceStatus}
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
                            required
                            value={formData.residenceExpiry}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="090-1234-5678"
                    />
                  </div>

                  {/* 検証方法の選択 - 電話検証は現在無効 */}
                  {/*
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      アカウント確認方法を選択してください <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-white transition">
                        <input
                          type="radio"
                          name="verificationType"
                          value="email"
                          checked={formData.verificationType === 'email'}
                          onChange={(e) => setFormData({ ...formData, verificationType: e.target.value as 'email' | 'phone' })}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">メールアドレスで確認</p>
                          <p className="text-sm text-gray-600 mt-1">
                            登録したメールアドレスに確認コードを送信します
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-white transition">
                        <input
                          type="radio"
                          name="verificationType"
                          value="phone"
                          checked={formData.verificationType === 'phone'}
                          onChange={(e) => setFormData({ ...formData, verificationType: e.target.value as 'email' | 'phone' })}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">電話番号で確認</p>
                          <p className="text-sm text-gray-600 mt-1">
                            登録した電話番号に確認コードを送信します（電話番号の入力が必要です）
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                  */}

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      住所
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
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
                      value={formData.nearestStation}
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
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="あなたの経歴やスキル、得意分野などを記載してください"
                    />
                  </div>
                </div>
              </div>

              {/* 学歴情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">学歴情報</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="finalEducation" className="block text-sm font-medium text-gray-700 mb-2">
                      最終学歴
                    </label>
                    <select
                      id="finalEducation"
                      name="finalEducation"
                      value={formData.finalEducation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="高校卒業">高校卒業</option>
                      <option value="専門学校卒業">専門学校卒業</option>
                      <option value="短大卒業">短大卒業</option>
                      <option value="大学卒業">大学卒業</option>
                      <option value="大学院卒業（修士）">大学院卒業（修士）</option>
                      <option value="大学院卒業（博士）">大学院卒業（博士）</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="graduationSchool" className="block text-sm font-medium text-gray-700 mb-2">
                        卒業学校名
                      </label>
                      <input
                        id="graduationSchool"
                        name="graduationSchool"
                        type="text"
                        value={formData.graduationSchool}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="例: 東京大学"
                      />
                    </div>

                    <div>
                      <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                        専攻
                      </label>
                      <input
                        id="major"
                        name="major"
                        type="text"
                        value={formData.major}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="例: 情報工学"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-2">
                      卒業年度
                    </label>
                    <input
                      id="graduationYear"
                      name="graduationYear"
                      type="number"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="例: 2020"
                      min="1950"
                      max="2030"
                    />
                  </div>
                </div>
              </div>

              {/* 職務情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">職務情報</h2>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="isITEngineer"
                      name="isITEngineer"
                      type="checkbox"
                      checked={formData.isITEngineer}
                      onChange={handleChange}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <label htmlFor="isITEngineer" className="ml-2 text-sm font-medium text-gray-700">
                      IT技術者である
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="currentPosition" className="block text-sm font-medium text-gray-700 mb-2">
                        現在の職種
                      </label>
                      <input
                        id="currentPosition"
                        name="currentPosition"
                        type="text"
                        value={formData.currentPosition}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="例: フロントエンドエンジニア"
                      />
                    </div>

                    <div>
                      <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                        実務経験年数
                      </label>
                      <select
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      >
                        <option value="">選択してください</option>
                        <option value="0">未経験</option>
                        <option value="1">1年未満</option>
                        <option value="2">1-3年</option>
                        <option value="4">3-5年</option>
                        <option value="6">5-10年</option>
                        <option value="11">10年以上</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="desiredSalary" className="block text-sm font-medium text-gray-700 mb-2">
                        希望年収
                      </label>
                      <input
                        id="desiredSalary"
                        name="desiredSalary"
                        type="number"
                        value={formData.desiredSalary}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="例: 6000000"
                      />
                    </div>

                    <div>
                      <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-2">
                        転職希望時期
                      </label>
                      <select
                        id="availableFrom"
                        name="availableFrom"
                        value={formData.availableFrom}
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
                    </div>
                  </div>
                </div>
              </div>

              {/* 職歴 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">職歴</h2>
                  <button
                    type="button"
                    onClick={() => setShowExpForm(!showExpForm)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                  >
                    {showExpForm ? 'フォームを閉じる' : '職歴を追加'}
                  </button>
                </div>

                {/* 職歴フォーム */}
                {showExpForm && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            会社名 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="companyName"
                            required
                            value={expFormData.companyName}
                            onChange={handleExpChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            placeholder="株式会社..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            役職 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="position"
                            required
                            value={expFormData.position}
                            onChange={handleExpChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            placeholder="例: ソフトウェアエンジニア"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          業務内容
                        </label>
                        <textarea
                          name="description"
                          value={expFormData.description}
                          onChange={handleExpChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="担当した業務内容を記載してください"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            開始日 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            required
                            value={expFormData.startDate}
                            onChange={handleExpChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            終了日 {expFormData.isCurrent && <span className="text-gray-500 text-xs">(現在も在職中)</span>}
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={expFormData.endDate}
                            onChange={handleExpChange}
                            disabled={expFormData.isCurrent}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isCurrent"
                          checked={expFormData.isCurrent}
                          onChange={handleExpChange}
                          className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">
                          現在もこの会社に在職中
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleExpSubmit}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                        >
                          {editingExpIndex !== null ? '更新' : '追加'}
                        </button>
                        <button
                          type="button"
                          onClick={resetExpForm}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 職歴リスト */}
                {experiences.length > 0 ? (
                  <div className="space-y-3">
                    {experiences.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-900">{exp.companyName}</h3>
                              {exp.isCurrent && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                  在職中
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 mb-1">{exp.position}</p>
                            {exp.description && (
                              <p className="text-sm text-gray-600 mb-2">{exp.description}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              {new Date(exp.startDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                              {' - '}
                              {exp.isCurrent ? '現在' : new Date(exp.endDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                            </p>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleExpEdit(index)}
                              className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExpDelete(index)}
                              className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">職歴が登録されていません</p>
                )}
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
                        value={formData.githubUrl}
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
                        value={formData.linkedinUrl}
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
                        value={formData.portfolioUrl}
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
                  <h2 className="text-xl font-bold text-gray-900 mb-6">スキル管理</h2>

                  {/* スキル選択 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">スキルを選択</h3>

                    {/* カテゴリ別スキル表示 */}
                    {['プログラミング言語', 'データベース', 'フレームワーク', 'クラウド', 'その他'].map((category) => {
                      const categorySkills = allSkills.filter(skill => skill.category === category)
                      if (categorySkills.length === 0) return null

                      return (
                        <div key={category} className="mb-6">
                          <h4 className="font-semibold text-gray-700 mb-3">{category}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {categorySkills.map((skill) => (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() => handleSkillToggle(skill.id)}
                                className={`px-4 py-2 rounded-lg border-2 transition ${
                                  selectedSkills.has(skill.id)
                                    ? 'bg-primary-100 border-primary-500 text-primary-700 font-semibold'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                                }`}
                              >
                                {skill.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 選択されたスキルの詳細設定 */}
                  {selectedSkills.size > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">選択したスキル</h3>
                      <div className="space-y-4">
                        {Array.from(selectedSkills.entries()).map(([skillId, data]) => {
                          const skill = allSkills.find(s => s.id === skillId)
                          if (!skill) return null

                          return (
                            <div key={skillId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                    {skill.category}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSkillToggle(skillId)}
                                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                >
                                  削除
                                </button>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    習熟度レベル
                                  </label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                      <button
                                        key={level}
                                        type="button"
                                        onClick={() => handleLevelChange(skillId, level)}
                                        className={`w-10 h-10 rounded-lg font-semibold transition ${
                                          data.level === level
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-primary-50'
                                        }`}
                                      >
                                        {level}
                                      </button>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    1: 初心者 ～ 5: エキスパート
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    使用年数
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={data.yearsUsed}
                                    onChange={(e) => handleYearsChange(skillId, parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">年数</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {selectedSkills.size === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500">上記からスキルを選択してください</p>
                    </div>
                  )}
                </div>
              )}

              {/* 利用契約確認 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  登録することで、当サービスの
                  <Link href="/terms" target="_blank" className="text-primary-500 hover:underline font-semibold">
                    利用契約
                  </Link>
                  に同意したものとみなされます。
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  ※ 登録前に必ず利用契約をご確認ください
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? '登録中...' : '応募者登録'}
              </button>
            </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              既にアカウントをお持ちですか?{' '}
              <Link href="/login" className="text-primary-500 hover:underline font-semibold">
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
