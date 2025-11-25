/**
 * 決済プロバイダーAPIで支払い状況を確認（ポーリング方式）
 * Webhook以外の方法として使用
 */

import crypto from 'crypto'

export interface PaymentVerificationResult {
  isPaid: boolean
  transactionId?: string
  paidAmount?: number
  paidAt?: Date
  error?: string
}

/**
 * WeChat Pay - 支払い状況を確認
 */
export async function verifyWeChatPayment(paymentId: string): Promise<PaymentVerificationResult> {
  const appId = process.env.WECHAT_APP_ID
  const mchId = process.env.WECHAT_MCH_ID
  const apiKey = process.env.WECHAT_API_KEY

  if (!appId || !mchId || !apiKey) {
    return { isPaid: false, error: 'WeChat Pay credentials not configured' }
  }

  try {
    // WeChat Pay Order Query API
    const params: any = {
      appid: appId,
      mch_id: mchId,
      out_trade_no: paymentId,
      nonce_str: generateNonce(),
    }

    // 署名を生成
    const sign = generateWeChatSign(params, apiKey)
    params.sign = sign

    // XMLリクエストを作成
    const xml = objectToXml(params)

    // WeChat Pay APIを呼び出し
    const response = await fetch('https://api.mch.weixin.qq.com/pay/orderquery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xml,
    })

    const responseText = await response.text()
    const responseData = xmlToObject(responseText)

    if (responseData.return_code !== 'SUCCESS') {
      return { isPaid: false, error: responseData.return_msg }
    }

    if (responseData.result_code !== 'SUCCESS') {
      return { isPaid: false, error: responseData.err_code_des }
    }

    // 支払い状態を確認
    const tradeState = responseData.trade_state
    if (tradeState === 'SUCCESS') {
      return {
        isPaid: true,
        transactionId: responseData.transaction_id,
        paidAmount: parseInt(responseData.total_fee) / 100, // 分→元
        paidAt: new Date(responseData.time_end),
      }
    }

    return { isPaid: false }
  } catch (error: any) {
    console.error('WeChat Pay verification error:', error)
    return { isPaid: false, error: error.message }
  }
}

/**
 * Alipay - 支払い状況を確認
 */
export async function verifyAlipayPayment(paymentId: string): Promise<PaymentVerificationResult> {
  const appId = process.env.ALIPAY_APP_ID
  const privateKey = process.env.ALIPAY_PRIVATE_KEY

  if (!appId || !privateKey) {
    return { isPaid: false, error: 'Alipay credentials not configured' }
  }

  try {
    // Alipay Trade Query API
    const bizContent = {
      out_trade_no: paymentId,
    }

    const params: any = {
      app_id: appId,
      method: 'alipay.trade.query',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    }

    // RSA署名を生成
    const sign = generateAlipaySign(params, privateKey)
    params.sign = sign

    // URLエンコードされたクエリ文字列を作成
    const queryString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')

    // Alipay APIを呼び出し
    const response = await fetch(`https://openapi.alipay.com/gateway.do?${queryString}`, {
      method: 'GET',
    })

    const responseData = await response.json()
    const tradeQueryResponse = responseData.alipay_trade_query_response

    if (tradeQueryResponse.code !== '10000') {
      return { isPaid: false, error: tradeQueryResponse.sub_msg }
    }

    // 支払い状態を確認
    const tradeStatus = tradeQueryResponse.trade_status
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      return {
        isPaid: true,
        transactionId: tradeQueryResponse.trade_no,
        paidAmount: parseFloat(tradeQueryResponse.total_amount),
        paidAt: new Date(tradeQueryResponse.send_pay_date),
      }
    }

    return { isPaid: false }
  } catch (error: any) {
    console.error('Alipay verification error:', error)
    return { isPaid: false, error: error.message }
  }
}

/**
 * PayPay - 支払い状況を確認
 */
export async function verifyPayPayPayment(paymentId: string): Promise<PaymentVerificationResult> {
  const apiKey = process.env.PAYPAY_API_KEY
  const apiSecret = process.env.PAYPAY_API_SECRET
  const merchantId = process.env.PAYPAY_MERCHANT_ID
  const environment = process.env.PAYPAY_ENVIRONMENT || 'sandbox'

  if (!apiKey || !apiSecret || !merchantId) {
    return { isPaid: false, error: 'PayPay credentials not configured' }
  }

  try {
    const apiUrl =
      environment === 'production'
        ? 'https://api.paypay.ne.jp'
        : 'https://stg-api.sandbox.paypay.ne.jp'

    // PayPay Get Payment Details API
    const nonce = generateNonce()
    const timestamp = Math.floor(Date.now() / 1000)
    const method = 'GET'
    const resourcePath = `/v2/codes/payments/${paymentId}`

    const signatureRawData = `${resourcePath}\n${method}\n${nonce}\n${timestamp}\n\n\n`
    const signature = crypto.createHmac('sha256', apiSecret).update(signatureRawData).digest('base64')

    // PayPay APIを呼び出し
    const response = await fetch(`${apiUrl}${resourcePath}`, {
      method: 'GET',
      headers: {
        'X-ASSUME-MERCHANT': merchantId,
        Authorization: `hmac OPA-Auth:${apiKey}:${signature}`,
        'X-PAYPAY-NONCE': nonce,
        'X-PAYPAY-TIMESTAMP': timestamp.toString(),
      },
    })

    const responseData = await response.json()

    if (responseData.resultInfo.code !== 'SUCCESS') {
      return { isPaid: false, error: responseData.resultInfo.message }
    }

    // 支払い状態を確認
    const status = responseData.data.status
    if (status === 'COMPLETED') {
      return {
        isPaid: true,
        transactionId: responseData.data.paymentId,
        paidAmount: responseData.data.amount.amount,
        paidAt: new Date(responseData.data.acceptedAt),
      }
    }

    return { isPaid: false }
  } catch (error: any) {
    console.error('PayPay verification error:', error)
    return { isPaid: false, error: error.message }
  }
}

// ヘルパー関数

function generateNonce(length = 32): string {
  return crypto.randomBytes(length / 2).toString('hex')
}

function generateWeChatSign(params: any, apiKey: string): string {
  const sortedKeys = Object.keys(params).sort()
  const stringA = sortedKeys.map((key) => `${key}=${params[key]}`).join('&')
  const stringSignTemp = `${stringA}&key=${apiKey}`
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase()
}

function generateAlipaySign(params: any, privateKey: string): string {
  const sortedKeys = Object.keys(params).sort()
  const signString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&')

  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signString)
  return sign.sign(privateKey, 'base64')
}

function objectToXml(obj: any): string {
  let xml = '<xml>'
  for (const key in obj) {
    xml += `<${key}>${obj[key]}</${key}>`
  }
  xml += '</xml>'
  return xml
}

function xmlToObject(xml: string): any {
  const obj: any = {}
  const regex = /<(\w+)>([^<]*)<\/\w+>/g
  let match

  while ((match = regex.exec(xml)) !== null) {
    obj[match[1]] = match[2]
  }

  return obj
}
