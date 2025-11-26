import { prisma } from './src/lib/prisma'

async function checkNewUser() {
  try {
    // Get the most recently created user
    const latestUser = await prisma.user.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        engineer: true,
        company: true,
      }
    })

    if (latestUser) {
      console.log('\n=== Most Recently Registered User ===')
      console.log('ID:', latestUser.id)
      console.log('Email:', latestUser.email)
      console.log('Role:', latestUser.role)
      console.log('Email Verified:', latestUser.emailVerified)
      console.log('Has Password Hash:', !!latestUser.passwordHash)
      console.log('Password Hash Length:', latestUser.passwordHash?.length)
      console.log('Created At:', latestUser.createdAt)

      if (latestUser.engineer) {
        console.log('\n--- Engineer Profile ---')
        console.log('Name:', latestUser.engineer.firstName, latestUser.engineer.lastName)
        console.log('Engineer ID:', latestUser.engineer.id)
      }

      if (latestUser.company) {
        console.log('\n--- Company Profile ---')
        console.log('Name:', latestUser.company.name)
        console.log('Company ID:', latestUser.company.id)
      }

      // Check verification status
      const verifications = await prisma.emailVerification.findMany({
        where: {
          userId: latestUser.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      console.log('\n--- Email Verifications ---')
      console.log('Total verifications:', verifications.length)
      if (verifications.length > 0) {
        verifications.forEach((v, i) => {
          console.log(`\nVerification ${i + 1}:`)
          console.log('  Code:', v.verificationCode)
          console.log('  Type:', v.verificationType)
          console.log('  Verified:', v.verified)
          console.log('  Expires At:', v.expiresAt)
          console.log('  Created At:', v.createdAt)
        })
      }
    } else {
      console.log('No users found in database')
    }

  } catch (error) {
    console.error('Error checking new user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNewUser()
