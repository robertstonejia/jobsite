import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { log } from './logger'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        log('Authorize - Started', { email: credentials?.email })

        if (!credentials?.email || !credentials?.password) {
          log('Authorize - Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        log('Authorize - User from DB', {
          found: !!user,
          id: user?.id,
          email: user?.email,
          role: user?.role
        })

        if (!user) {
          log('Authorize - User not found')
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          log('Authorize - Invalid password')
          return null
        }

        // 企業ユーザーまたは応募者ユーザーの場合、メール検証をチェック
        if (!user.emailVerified) {
          log('Authorize - Email not verified')
          // nullを返す代わりに、特殊なオブジェクトを返してフロントエンドで判別
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            emailVerified: false,
          } as any
        }

        const returnUser = {
          id: user.id,
          email: user.email,
          role: user.role,
        }

        log('Authorize - Returning user', returnUser)

        return returnUser
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        log('JWT callback - user', user)
        token.id = user.id
        token.role = (user as any).role
        token.emailVerified = (user as any).emailVerified !== false
        log('JWT callback - token after update', token)
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
