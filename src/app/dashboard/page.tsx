'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  Users,
  UserCheck,
  FolderOpen,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Calendar,
  Bell,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    isPositive: boolean
  }
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend.isPositive ? '' : 'rotate-180'
            }`} />
            {trend.value}
          </div>
        )}
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
    time: '2 hours ago'
  },
  {
    id: '2',
    type: 'project',
    title: 'Project Updated',
    description: 'Website Redesign project moved to In Progress',
    time: '4 hours ago'
  },
  {
    id: '3',
    type: 'task',
    title: 'Task Completed',
    description: 'Logo design review completed by Sarah',
    time: '6 hours ago'
  },
  {
    id: '4',
    type: 'client',
    title: 'Client Meeting',
    description: 'Quarterly review with ABC Company scheduled',
    time: '1 day ago'
  },
]

function getActivityIcon(type: RecentActivityItem['type']) {
  switch (type) {
    case 'lead':
      return Users
    case 'project':
      return FolderOpen
    case 'task':
      return CheckSquare
    case 'client':
      return UserCheck
    default:
      return Bell
  }
}

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Leads"
            value="24"
            description="+12% from last month"
            icon={Users}
            trend={{ value: "+12%", isPositive: true }}
          />
          <StatCard
            title="Active Clients"
            value="18"
            description="+3 new this month"
            icon={UserCheck}
            trend={{ value: "+3", isPositive: true }}
          />
          <StatCard
            title="Active Projects"
            value="12"
            description="2 completed this week"
            icon={FolderOpen}
          />
          <StatCard
            title="Monthly Revenue"
            value="$45,231"
            description="+8% from last month"
            icon={DollarSign}
            trend={{ value: "+8%", isPositive: true }}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your team and clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Create New Lead
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Start New Project
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CheckSquare className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>
              Tasks due in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming tasks</p>
              <p className="text-sm">Create your first task to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}