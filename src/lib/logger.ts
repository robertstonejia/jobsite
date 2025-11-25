import fs from 'fs'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'auth.log')

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
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

  const logMessage = `[${timestamp}] ${message}${dataString}\n`

  // Log to console
  console.log(logMessage)

  // Log to file
  try {
    fs.appendFileSync(LOG_FILE, logMessage)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}
