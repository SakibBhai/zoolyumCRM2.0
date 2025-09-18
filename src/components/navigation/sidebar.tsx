'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderOpen,
  CheckSquare,
  Team,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: Users,
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: UserCheck,
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    title: 'Team',
    href: '/team',
    icon: Team,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Proposals',
    href: '/proposals',
    icon: FileText,
  },
  {
    title: 'Finance',
    href: '/finance',
    icon: DollarSign,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['ADMIN', 'MANAGER'],
  },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, hasRole, signOut } = useAuth()

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.some(role => hasRole(role))
  })

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 lg:relative lg:translate-x-0",
        isCollapsed ? "-translate-x-full lg:w-16" : "w-64 translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <span className="font-semibold text-gray-900">AgencyCRM</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isCollapsed && "justify-center px-2"
                )}
                onClick={() => setIsCollapsed(true)}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-blue-700")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Settings className="h-5 w-5" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Sign Out</span>}
          </Button>
          
          {!isCollapsed && user && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 lg:hidden"
        onClick={() => setIsCollapsed(false)}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  )
}