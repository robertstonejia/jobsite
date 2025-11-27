import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

console.log('🚀 NextAuth route handler loading...')

let handler: any

try {
  handler = NextAuth(authOptions)
  console.log('✅ NextAuth handler created successfully')
} catch (error) {
  console.error('❌ Failed to create NextAuth handler:', error)
  throw error
}

// Wrap handlers with error logging
async function GET(req: NextRequest, context: any) {
  try {
    console.log('📥 NextAuth GET request:', req.url)
    return await handler(req, context)
  } catch (error) {
    console.error('❌ NextAuth GET error:', error)
    throw error
  }
}

async function POST(req: NextRequest, context: any) {
  try {
    console.log('📥 NextAuth POST request:', req.url)
    return await handler(req, context)
  } catch (error) {
    console.error('❌ NextAuth POST error:', error)
    throw error
  }
}

export { GET, POST }
