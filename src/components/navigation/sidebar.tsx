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
  Users2,
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
    icon: Users2,
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
        "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-100 transition-all duration-300 shadow-sm",
        isCollapsed ? "-translate-x-full lg:w-16 lg:translate-x-0" : "w-64 translate-x-0 lg:w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">AC</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg">AgencyCRM</span>
                <p className="text-xs text-gray-500 mt-0.5">Professional Edition</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden hover:bg-gray-100"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isCollapsed && "justify-center px-3"
                )}
                onClick={() => setIsCollapsed(true)}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-colors duration-200", 
                  isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
                )} />
                {!isCollapsed && <span className="font-medium">{item.title}</span>}
                {!isCollapsed && isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
              pathname === '/settings'
                ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              isCollapsed && "justify-center px-3"
            )}
          >
            <Settings className={cn(
              "h-5 w-5 transition-colors duration-200",
              pathname === '/settings' ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
            )} />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </Link>
          
          <Button
            variant="ghost"
            onClick={signOut}
            className={cn(
              "w-full justify-start space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-red-50 hover:text-red-700 group",
              isCollapsed && "justify-center px-3"
            )}
          >
            <LogOut className="h-5 w-5 transition-colors duration-200 text-gray-500 group-hover:text-red-600" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </Button>
          
          {/* User Profile */}
          {!isCollapsed && user && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name || 'Demo User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email || 'demo@agency.com'}
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