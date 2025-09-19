import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'
import { UserRole } from '@prisma/client'

// Check if authentication bypass is enabled
const isAuthBypassEnabled = process.env.AUTH_BYPASS_ENABLED === 'true'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'john@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // BYPASS MODE: Skip authentication if bypass is enabled
        if (isAuthBypassEnabled) {
          console.warn('🚨 AUTH BYPASS MODE ENABLED - DEVELOPMENT ONLY!')
          
          // Return a default admin user for bypass mode
          const bypassUser = await prisma.user.findFirst({
            where: {
              role: UserRole.ADMIN,
              isActive: true,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              avatar: true,
            },
          })

          if (bypassUser) {
            return {
              id: bypassUser.id,
              email: bypassUser.email,
              name: bypassUser.name,
              role: bypassUser.role,
              avatar: bypassUser.avatar,
            }
          }

          // Fallback: create a temporary bypass user
          return {
            id: 'bypass-user',
            email: 'bypass@agency.com',
            name: 'Bypass User (DEV)',
            role: UserRole.ADMIN,
            avatar: null,
          }
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            avatar: true,
            isActive: true,
          },
        })

        if (!user || !user.isActive) {
          return null
        }

        // Compare the provided password with the hashed password
        if (!user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.avatar = user.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.avatar = token.avatar as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                avatar: user.image,
                role: UserRole.AGENT, // Default role for new users
              },
            })
          }
        } catch (error) {
          console.error('Error creating user:', error)
          return false
        }
      }
      return true
    },
  },
}

// Helper function to check user permissions
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.VIEWER]: 0,
    [UserRole.AGENT]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.ADMIN]: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Helper function to check if user can access resource
export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId?: string,
  requiredRole: UserRole = UserRole.AGENT
): boolean {
  // Admins and Managers can access everything
  if (hasPermission(userRole, UserRole.MANAGER)) {
    return true
  }

  // Users can access their own resources
  if (resourceOwnerId && userId === resourceOwnerId) {
    return true
  }

  // Check if user has required role
  return hasPermission(userRole, requiredRole)
}