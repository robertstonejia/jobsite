import { prisma } from './src/lib/prisma'
import { compare } from 'bcryptjs'

async function testAuth() {
  try {
    console.log('Testing authentication flow...\n')

    // Test user lookup
    const email = 'tarotanaka580@gmail.com'
    console.log('1. Looking up user:', email)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      passwordHashLength: user.passwordHash.length
    })

    // Test password comparison
    console.log('\n2. Testing password comparison...')
    const testPassword = 'test123456' // Replace with actual password

    try {
      const isValid = await compare(testPassword, user.passwordHash)
      console.log('Password valid:', isValid)
    } catch (err) {
      console.error('❌ Password comparison error:', err)
    }

    // Test Prisma connection
    console.log('\n3. Testing Prisma connection...')
    const count = await prisma.user.count()
    console.log('✅ Prisma working, total users:', count)

    // Check environment variables
    console.log('\n4. Checking environment variables...')
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET')
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
