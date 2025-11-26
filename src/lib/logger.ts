// Simple logger that works in Vercel serverless environment
// Note: File system operations are not available in Vercel functions
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

  // Log to console (will appear in Vercel function logs)
  console.log(logMessage)
}
