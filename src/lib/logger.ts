import fs from 'fs'
import path from 'path'

// Vercel環境かどうかをチェック
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined

let LOG_DIR: string | undefined
let LOG_FILE: string | undefined

// Vercel環境ではファイルロギングを無効化
if (!isVercel) {
  LOG_DIR = path.join(process.cwd(), 'logs')
  LOG_FILE = path.join(LOG_DIR, 'auth.log')
  
  // Create logs directory if it doesn't exist (ローカル環境のみ)
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

export function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  let dataString = ''
  
  if (data) {
    try {
      dataString = '\n' + JSON.stringify(data, null, 2)
    } catch (err) {
      dataString = '\n[Unable to stringify data]'
      console.error('JSON stringify error:', err)
    }
  }
  
  const logMessage = `[${timestamp}] ${message}${dataString}`
  
  // 常にコンソールに出力（Vercelのログビューアで確認可能）
  console.log(logMessage)
  
  // ファイルへのログ記録（ローカル環境のみ）
  if (!isVercel && LOG_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, logMessage + '\n')
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }
}