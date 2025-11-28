import { Company } from '@prisma/client'

export interface TrialStatus {
  isActive: boolean
  daysRemaining: number
  hasExpired: boolean
  trialEndDate: Date | null
}

/**
 * 企業のトライアル状態をチェック
 */
export function checkTrialStatus(company: Company): TrialStatus {
  // トライアルが有効でない場合
  if (!company.isTrialActive || !company.trialEndDate) {
    return {
      isActive: false,
      daysRemaining: 0,
      hasExpired: true,
      trialEndDate: company.trialEndDate,
    }
  }

  const now = new Date()
  const trialEndDate = new Date(company.trialEndDate)
  const timeDiff = trialEndDate.getTime() - now.getTime()
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  // トライアル期間が終了している場合
  if (daysRemaining <= 0) {
    return {
      isActive: false,
      daysRemaining: 0,
      hasExpired: true,
      trialEndDate,
    }
  }

  // トライアル期間が有効な場合
  return {
    isActive: true,
    daysRemaining,
    hasExpired: false,
    trialEndDate,
  }
}

/**
 * 企業が有料プランまたは有効なトライアル期間中かをチェック
 */
export function canAccessPaidFeatures(company: Company): boolean {
  // 有料プランに加入している場合
  if (company.subscriptionPlan !== 'FREE') {
    // サブスクリプション有効期限をチェック
    if (company.subscriptionExpiry) {
      const now = new Date()
      const expiry = new Date(company.subscriptionExpiry)
      if (now <= expiry) {
        return true
      }
    }
  }

  // トライアル期間が有効な場合
  const trialStatus = checkTrialStatus(company)
  return trialStatus.isActive
}

/**
 * トライアル状態のメッセージを取得
 */
export function getTrialMessage(company: Company): {
  message: string
  type: 'success' | 'warning' | 'error'
} {
  const trialStatus = checkTrialStatus(company)

  if (!company.hasUsedTrial) {
    return {
      message: 'トライアル期間はまだ開始されていません',
      type: 'success',
    }
  }

  if (trialStatus.isActive) {
    if (trialStatus.daysRemaining <= 3) {
      return {
        message: `トライアル期間の残り ${trialStatus.daysRemaining} 日です。プランのアップグレードをご検討ください。`,
        type: 'warning',
      }
    }
    return {
      message: `トライアル期間の残り ${trialStatus.daysRemaining} 日です`,
      type: 'success',
    }
  }

  if (trialStatus.hasExpired) {
    return {
      message: 'トライアル期間が終了しました。引き続きサービスをご利用いただくには、プランのアップグレードが必要です。',
      type: 'error',
    }
  }

  return {
    message: '',
    type: 'success',
  }
}
