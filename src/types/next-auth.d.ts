import { UserRole } from '@prisma/client'
import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      avatar?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
    avatar?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: UserRole
    avatar?: string
  }
}