'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function EngineerRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    address: '',
    nearestStation: '',
    bio: '',
    yearsOfExperience: '',
    currentPosition: '',
    desiredSalary: '',
    availableFrom: '',
    isITEngineer: true,
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    verificationType: 'email' as 'email' | 'phone',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
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
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // メール検証画面に遷移
        router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(formData.email)}&type=${data.verificationType}`)
      } else {
        setError(data.error || '登録に失敗しました')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('登録中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">技術者登録</h1>
              <p className="text-gray-600">あなたのスキルを活かせる仕事を見つけましょう</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* アカウント情報 */}
              <div className="border-b pb-6">
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
              <div className="border-b pb-6">
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

              {/* 職務情報 */}
              <div className="border-b pb-6">
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

              {/* SNS・ポートフォリオ (IT技術者のみ) */}
              {formData.isITEngineer && (
                <div className="pb-6">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? '登録中...' : '技術者登録'}
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
      </div>
      <Footer />
    </>
  )
}
