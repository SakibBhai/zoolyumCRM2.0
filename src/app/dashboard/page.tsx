import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  User,
  CheckCircle,
  MessageSquare,
  DollarSign,
  Calendar,
  FileText,
  FolderOpen,
  Users,
  UserCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  color: 'blue' | 'green' | 'orange' | 'purple' | 'emerald'
  icon: LucideIcon
}

function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>{change}</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface RecentActivityItem {
  id: string
  type: 'lead' | 'project' | 'task' | 'client'
  title: string
  description: string
  time: string
}

const recentActivities: RecentActivityItem[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New Lead Created',
    description: 'John Doe from TechCorp submitted a contact form',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'project',
    title: 'Project Updated',
    description: 'Website Redesign project moved to In Progress',
    time: '4 hours ago',
  },
  {
    id: '3',
    type: 'task',
    title: 'Task Completed',
    description: 'Logo design review completed by Sarah',
    time: '6 hours ago',
  },
  {
    id: '4',
    type: 'client',
    title: 'Client Meeting',
    description: 'Quarterly review with ABC Company scheduled',
    time: '1 day ago',
  },
]

function getActivityIcon(type: RecentActivityItem['type']) {
  switch (type) {
    case 'lead':
      return User
    case 'project':
      return FolderOpen
    case 'task':
      return CheckCircle
    case 'client':
      return UserCheck
    default:
      return MessageSquare
  }
}

function getActivityIconColor(type: RecentActivityItem['type']) {
  switch (type) {
    case 'lead':
      return 'bg-blue-50 text-blue-600 border border-blue-100'
    case 'project':
      return 'bg-purple-50 text-purple-600 border border-purple-100'
    case 'task':
      return 'bg-green-50 text-green-600 border border-green-100'
    case 'client':
      return 'bg-orange-50 text-orange-600 border border-orange-100'
    default:
      return 'bg-gray-50 text-gray-600 border border-gray-100'
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, Demo!</h1>
            <p className="text-gray-600">Here&apos;s what&apos;s happening with your business today.</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" className="flex items-center space-x-2 px-4 py-2 font-medium transition-all duration-200 hover:bg-gray-50">
              <Calendar className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </Button>
            <Button className="flex items-center space-x-2 px-4 py-2 font-medium bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:shadow-md">
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Leads" value="24" change="+12% from last month" trend="up" icon={Users} color="blue" />
          <StatCard title="Active Clients" value="18" change="+3 new this week" trend="up" icon={UserCheck} color="green" />
          <StatCard title="Active Projects" value="12" change="2 completed this week" trend="up" icon={FolderOpen} color="purple" />
          <StatCard title="Monthly Revenue" value="$45,231" change="+8% from last month" trend="up" icon={DollarSign} color="emerald" />
        </div>

        {/* Content Grid - Optimized for better space utilization */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Recent Activity - Takes more space on larger screens */}
          <div className="xl:col-span-3">
            <Card className="h-full border-gray-100 transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200">
                    View All
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Latest updates from your team and clients</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.type)
                    const iconColor = getActivityIconColor(activity.type)

                    return (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-100 transition-all duration-200 hover:bg-gray-100 hover:shadow-sm group"
                      >
                        <div className={`p-2 rounded-lg ${iconColor} transition-all duration-200 group-hover:scale-105`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">{activity.title}</p>
                          <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Compact sidebar */}
          <div className="xl:col-span-1">
            <Card className="h-full bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                <p className="text-sm text-gray-500">Common tasks and shortcuts</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start h-10 px-3 transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 group"
                  >
                    <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium text-sm">Create New Lead</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-10 px-3 transition-all duration-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 group"
                  >
                    <FileText className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium text-sm">Start New Project</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-10 px-3 transition-all duration-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 group"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium text-sm">Add Task</span>
                  </Button>
                </div>

                {/* Upcoming Tasks Preview - More compact */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Upcoming Tasks</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 transition-all duration-200 hover:bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-900">Follow up with TechCorp</span>
                      </div>
                      <span className="text-xs text-gray-500">Today</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 transition-all duration-200 hover:bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-900">Review project proposal</span>
                      </div>
                      <span className="text-xs text-gray-500">Tomorrow</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}