/**
 * 決済プロバイダー統合ライブラリ
 * WeChat Pay, Alipay, PayPay との連携処理
 */

import crypto from 'crypto'

export interface PaymentRequest {
  paymentId: string
  amount: number
  currency: string
  description: string
  callbackUrl?: string
}

export interface PaymentResponse {
  qrCodeData: string
  paymentUrl?: string
  expiresAt?: Date
}

/**
 * WeChat Pay - QRコード決済を作成
 */
export async function createWeChatPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const appId = process.env.WECHAT_APP_ID
  const mchId = process.env.WECHAT_MCH_ID
  const apiKey = process.env.WECHAT_API_KEY

  if (!appId || !mchId || !apiKey) {
    throw new Error('WeChat Pay credentials not configured')
  }

  // WeChat Pay Unified Order API
  const params: any = {
    appid: appId,
    mch_id: mchId,
    nonce_str: generateNonce(),
    body: request.description,
    out_trade_no: request.paymentId,
    total_fee: Math.round(request.amount * 100), // 元 → 分
    spbill_create_ip: '127.0.0.1',
    notify_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/payment`,
    trade_type: 'NATIVE', // QRコード決済
  }

  // 署名を生成
  const sign = generateWeChatSign(params, apiKey)
  params.sign = sign

  // XMLリクエストを作成
  const xml = objectToXml(params)

  // WeChat Pay APIを呼び出し
  const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
    body: xml,
  })

  const responseText = await response.text()
  const responseData = xmlToObject(responseText)

  if (responseData.return_code !== 'SUCCESS' || responseData.result_code !== 'SUCCESS') {
    throw new Error(`WeChat Pay error: ${responseData.return_msg || responseData.err_code_des}`)
  }

  return {
    qrCodeData: responseData.code_url,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2時間
  }
}

/**
 * Alipay - QRコード決済を作成
 */
export async function createAlipayPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const appId = process.env.ALIPAY_APP_ID
  const privateKey = process.env.ALIPAY_PRIVATE_KEY
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY

  if (!appId || !privateKey || !alipayPublicKey) {
    throw new Error('Alipay credentials not configured')
  }

  // Alipay Trade Precreate API (QRコード決済)
  const bizContent = {
    out_trade_no: request.paymentId,
    total_amount: request.amount.toFixed(2),
    subject: request.description,
  }

  const params: any = {
    app_id: appId,
    method: 'alipay.trade.precreate',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    version: '1.0',
    notify_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/payment`,
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

  if (responseData.alipay_trade_precreate_response.code !== '10000') {
    throw new Error(
      `Alipay error: ${responseData.alipay_trade_precreate_response.sub_msg}`
    )
  }

  return {
    qrCodeData: responseData.alipay_trade_precreate_response.qr_code,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2時間
  }
}

/**
 * PayPay - QRコード決済を作成
 */
export async function createPayPayPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const apiKey = process.env.PAYPAY_API_KEY
  const apiSecret = process.env.PAYPAY_API_SECRET
  const merchantId = process.env.PAYPAY_MERCHANT_ID
  const environment = process.env.PAYPAY_ENVIRONMENT || 'sandbox'

  if (!apiKey || !apiSecret || !merchantId) {
    throw new Error('PayPay credentials not configured')
  }

  const apiUrl =
    environment === 'production'
      ? 'https://api.paypay.ne.jp'
      : 'https://stg-api.sandbox.paypay.ne.jp'

  // PayPay Create QR Code API
  const requestBody = {
    merchantPaymentId: request.paymentId,
    amount: {
      amount: request.amount,
      currency: request.currency,
    },
    codeType: 'ORDER_QR',
    orderDescription: request.description,
    isAuthorization: false,
    redirectUrl: request.callbackUrl,
    redirectType: 'WEB_LINK',
  }

  // HMAC署名を生成
  const nonce = generateNonce()
  const timestamp = Math.floor(Date.now() / 1000)
  const contentType = 'application/json'
  const method = 'POST'
  const resourcePath = '/v2/codes'

  const signatureRawData = `${resourcePath}\n${method}\n${nonce}\n${timestamp}\n${contentType}\n${JSON.stringify(requestBody)}\n`
  const signature = crypto.createHmac('sha256', apiSecret).update(signatureRawData).digest('base64')

  // PayPay APIを呼び出し
  const response = await fetch(`${apiUrl}${resourcePath}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'X-ASSUME-MERCHANT': merchantId,
      Authorization: `hmac OPA-Auth:${apiKey}:${signature}`,
      'X-PAYPAY-NONCE': nonce,
      'X-PAYPAY-TIMESTAMP': timestamp.toString(),
    },
    body: JSON.stringify(requestBody),
  })

  const responseData = await response.json()

  if (responseData.resultInfo.code !== 'SUCCESS') {
    throw new Error(`PayPay error: ${responseData.resultInfo.message}`)
  }

  return {
    qrCodeData: responseData.data.url,
    paymentUrl: responseData.data.url,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分
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
