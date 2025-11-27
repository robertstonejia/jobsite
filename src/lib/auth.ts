import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors back to login page
  },
  debug: true, // Enable debug mode to see detailed errors
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials')
            return null
          }

          console.log('🔍 Attempting login for:', credentials.email)

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user) {
            console.log('❌ User not found:', credentials.email)
            return null
          }

          console.log('✅ User found, checking password...')

          const isPasswordValid = await compare(credentials.password, user.passwordHash)

          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', credentials.email)
            return null
          }

          console.log('✅ Password valid, checking email verification...')

          // 企業ユーザーまたは応募者ユーザーの場合、メール検証をチェック
          if (!user.emailVerified) {
            console.log('⚠️ Email not verified for:', credentials.email)
            // メール未確認の場合はエラーを投げる
            throw new Error('EMAIL_NOT_VERIFIED')
          }

          console.log('✅ Login successful for:', credentials.email, 'Role:', user.role)

          return {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.emailVerified = (user as any).emailVerified !== false
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub as string,
            role: token.role as string,
            emailVerified: token.emailVerified as boolean,
          }
        }
      }
      return session
    },
  },
}
