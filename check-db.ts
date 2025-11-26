import { prisma } from './src/lib/prisma'

async function checkDatabase() {
  try {
    // Check if users table exists and get structure
    const user = await prisma.user.findFirst()

    if (user) {
      console.log('✓ Users table exists')
      console.log('User fields:', Object.keys(user))
      console.log('Sample user:', {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        hasPassword: !!user.passwordHash,
      })
    } else {
      console.log('⚠ Users table exists but is empty')
    }

    // Check total user count
    const userCount = await prisma.user.count()
    console.log(`\nTotal users in database: ${userCount}`)

    // Check companies and engineers
    const companyCount = await prisma.company.count()
    const engineerCount = await prisma.engineer.count()
    console.log(`Companies: ${companyCount}`)
    console.log(`Engineers: ${engineerCount}`)

  } catch (error) {
    console.error('Database check error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
