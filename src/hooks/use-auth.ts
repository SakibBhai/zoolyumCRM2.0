'use client'

import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { hasPermission, canAccessResource } from '@/lib/auth'

export function useAuth() {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const user = session?.user

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user?.role) return false
    return hasPermission(user.role, requiredRole)
  }

  const canAccess = (
    resourceOwnerId?: string,
    requiredRole: UserRole = UserRole.AGENT
  ): boolean => {
    if (!user?.id || !user?.role) return false
    return canAccessResource(user.role, user.id, resourceOwnerId, requiredRole)
  }

  const isAdmin = (): boolean => hasRole(UserRole.ADMIN)
  const isManager = (): boolean => hasRole(UserRole.MANAGER)
  const isAgent = (): boolean => hasRole(UserRole.AGENT)
  const isViewer = (): boolean => hasRole(UserRole.VIEWER)

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    canAccess,
    isAdmin,
    isManager,
    isAgent,
    isViewer,
  }
}