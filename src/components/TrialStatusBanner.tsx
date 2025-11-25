'use client'

import Link from 'next/link'

interface TrialStatusBannerProps {
  trialStartDate: string | null
  trialEndDate: string | null
  isTrialActive: boolean
}

export default function TrialStatusBanner({ trialStartDate, trialEndDate, isTrialActive }: TrialStatusBannerProps) {
  if (!isTrialActive || !trialEndDate) {
    return null
  }

  const now = new Date()
  const endDate = new Date(trialEndDate)
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // トライアル期間が終了している場合
  if (daysRemaining <= 0) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              無料トライアル期間が終了しました
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>引き続きサービスをご利用いただくには、有料プランへのアップグレードが必要です。</p>
            </div>
            <div className="mt-4">
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                プランを選択
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 残り7日以下の場合は警告
  const isWarning = daysRemaining <= 7

  return (
    <div className={`border-l-4 p-4 mb-6 ${isWarning ? 'bg-yellow-50 border-yellow-400' : 'bg-blue-50 border-blue-400'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${isWarning ? 'text-yellow-400' : 'text-blue-400'}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${isWarning ? 'text-yellow-800' : 'text-blue-800'}`}>
            無料トライアル期間中
          </h3>
          <div className={`mt-2 text-sm ${isWarning ? 'text-yellow-700' : 'text-blue-700'}`}>
            <p>
              残り<strong className="font-bold text-lg mx-1">{daysRemaining}</strong>日間
              {trialStartDate && (
                <span className="ml-2 text-xs">
                  ({new Date(trialStartDate).toLocaleDateString('ja-JP')} ～ {endDate.toLocaleDateString('ja-JP')})
                </span>
              )}
            </p>
            {isWarning && (
              <p className="mt-1 font-medium">
                トライアル期間終了が近づいています。継続してご利用いただくには有料プランへの切り替えが必要です。
              </p>
            )}
          </div>
          <div className="mt-4">
            <Link
              href="/pricing"
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                isWarning ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              プランを確認
            </Link>
            <Link
              href="/contact"
              className={`ml-3 inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                isWarning ? 'border-yellow-600 text-yellow-700 hover:bg-yellow-50' : 'border-blue-600 text-blue-700 hover:bg-blue-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isWarning ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}`}
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
