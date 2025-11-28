import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日間（秒単位）
    updateAge: 24 * 60 * 60, // 24時間ごとにセッションを更新（秒単位）
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // 本番環境ではHTTPSのみ
        maxAge: 30 * 24 * 60 * 60, // 30日間（秒単位）
      },
    },
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
          return null
        }

        console.log('✅ Login successful for:', credentials.email, 'Role:', user.role)

        return {
          id: user.id,
          email: user.email,
          role: user.role,
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
            id: token.id as string,
            role: token.role as string,
            emailVerified: token.emailVerified as boolean,
          }
        }
      }
      return session
    },
  },
}
