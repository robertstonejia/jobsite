import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cancelSubscription(email: string) {
  try {
    console.log(`Canceling subscription for user: ${email}`)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user) {
      console.error(`User not found: ${email}`)
      return
    }

    if (!user.company) {
      console.error(`Company not found for user: ${email}`)
      return
    }

    console.log(`Found company: ${user.company.name}`)
    console.log(`Current plan: ${user.company.subscriptionPlan}`)
    console.log(`Current expiry: ${user.company.subscriptionExpiry}`)

    // Reset subscription to FREE
    await prisma.company.update({
      where: { id: user.company.id },
      data: {
        subscriptionPlan: 'FREE',
        subscriptionExpiry: null,
      },
    })

    console.log('✅ Subscription canceled successfully!')
    console.log('Plan reset to: FREE')
    console.log('Expiry reset to: null')
  } catch (error) {
    console.error('Error canceling subscription:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
const email = process.argv[2] || 'ka-hyousei@ndbhd.com'
cancelSubscription(email)
