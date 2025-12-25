'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    description: '',
    industry: '',
    website: '',
    address: '',
    phoneNumber: '',
    employeeCount: '',
    foundedYear: '',
    isITCompany: true,
    supportsAdvancedTalentPoints: false,
    emailNotificationEnabled: true,
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          description: formData.description || undefined,
          industry: formData.industry || undefined,
          website: formData.website || undefined,
          address: formData.address || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
          foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
          isITCompany: formData.isITCompany,
          supportsAdvancedTalentPoints: formData.supportsAdvancedTalentPoints,
          emailNotificationEnabled: formData.emailNotificationEnabled,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // メール検証画面に遷移
        router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(formData.email)}`)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">企業登録</h1>
              <p className="text-gray-600">求人を掲載して優秀な人材を見つけましょう</p>
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
                      placeholder="company@example.com"
                    />
                  </div>

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

              {/* 企業情報 */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">企業情報</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      企業名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="株式会社〇〇"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      企業概要
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="企業の事業内容や特徴を記載してください"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        業種
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      >
                        <option value="">選択してください</option>
                        <option value="IT・通信">IT・通信</option>
                        <option value="Web・インターネット">Web・インターネット</option>
                        <option value="ゲーム">ゲーム</option>
                        <option value="SIer">SIer</option>
                        <option value="コンサルティング">コンサルティング</option>
                        <option value="製造業">製造業</option>
                        <option value="金融">金融</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-2">
                        従業員数
                      </label>
                      <input
                        id="employeeCount"
                        name="employeeCount"
                        type="number"
                        value={formData.employeeCount}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="foundedYear" className="block text-sm font-medium text-gray-700 mb-2">
                        設立年
                      </label>
                      <input
                        id="foundedYear"
                        name="foundedYear"
                        type="number"
                        value={formData.foundedYear}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="2000"
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
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      所在地
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
                      placeholder="03-1234-5678"
                    />
                  </div>
                </div>
              </div>

              {/* 企業設定 */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">企業設定</h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="isITCompany"
                        name="isITCompany"
                        type="checkbox"
                        checked={formData.isITCompany}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="isITCompany" className="font-medium text-gray-700">
                        IT企業として登録
                      </label>
                      <p className="text-sm text-gray-500">
                        IT企業として登録すると、IT案件情報の投稿が可能になります(1日5件まで)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="supportsAdvancedTalentPoints"
                        name="supportsAdvancedTalentPoints"
                        type="checkbox"
                        checked={formData.supportsAdvancedTalentPoints}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="supportsAdvancedTalentPoints" className="font-medium text-gray-700">
                        高度人材加点制度に対応
                      </label>
                      <p className="text-sm text-gray-500">
                        高度人材ポイント制度に対応している企業として、専用ページに掲載されます
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="emailNotificationEnabled"
                        name="emailNotificationEnabled"
                        type="checkbox"
                        checked={formData.emailNotificationEnabled}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="emailNotificationEnabled" className="font-medium text-gray-700">
                        応募通知メールを受け取る
                      </label>
                      <p className="text-sm text-gray-500">
                        求人に応募があった際に、メールで通知を受け取ります
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                {loading ? '登録中...' : '企業登録'}
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
