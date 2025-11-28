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
  debug: process.env.NODE_ENV === 'development', // Only enable debug in development
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            role: true,
            emailVerified: true,
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        // 企業ユーザーまたは応募者ユーザーの場合、メール検証をチェック
        if (!user.emailVerified) {
          return null
        }

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
