'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Building,
  Target,
  TrendingUp,
  Folder,
  Grid3X3,
  List,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  client: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  progress: number
  budget: number
  spent: number
  startDate: string
  endDate: string
  teamMembers: string[]
  projectManager: string
  tasksTotal: number
  tasksCompleted: number
  category: string
  healthScore: number
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design and improved UX',
    client: 'TechCorp Inc.',
    status: 'active',
    priority: 'high',
    progress: 65,
    budget: 50000,
    spent: 32500,
    startDate: '2024-01-01',
    endDate: '2024-03-15',
    teamMembers: ['Sarah Johnson', 'Mike Chen', 'David Lee'],
    projectManager: 'Sarah Johnson',
    tasksTotal: 24,
    tasksCompleted: 16,
    category: 'Web Development',
    healthScore: 85
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native iOS and Android app for customer engagement',
    client: 'Design Studio Pro',
    status: 'planning',
    priority: 'medium',
    progress: 15,
    budget: 75000,
    spent: 11250,
    startDate: '2024-02-01',
    endDate: '2024-06-30',
    teamMembers: ['Mike Chen', 'Emily Davis', 'Robert Wilson'],
    projectManager: 'Mike Chen',
    tasksTotal: 32,
    tasksCompleted: 5,
    category: 'Mobile Development',
    healthScore: 72
  },
  {
    id: '3',
    name: 'Brand Identity Package',
    description: 'Complete brand identity including logo, guidelines, and marketing materials',
    client: 'Enterprise Solutions',
    status: 'completed',
    priority: 'low',
    progress: 100,
    budget: 25000,
    spent: 24500,
    startDate: '2023-11-01',
    endDate: '2024-01-15',
    teamMembers: ['Emily Davis', 'David Lee'],
    projectManager: 'Emily Davis',
    tasksTotal: 18,
    tasksCompleted: 18,
    category: 'Branding',
    healthScore: 95
  },
  {
    id: '4',
    name: 'E-commerce Platform',
    description: 'Custom e-commerce solution with advanced features',
    client: 'RetailCo',
    status: 'on-hold',
    priority: 'critical',
    progress: 40,
    budget: 120000,
    spent: 48000,
    startDate: '2023-12-01',
    endDate: '2024-05-30',
    teamMembers: ['Sarah Johnson', 'Mike Chen', 'David Lee', 'Robert Wilson'],
    projectManager: 'David Lee',
    tasksTotal: 45,
    tasksCompleted: 18,
    category: 'E-commerce',
    healthScore: 45
  },
  {
    id: '5',
    name: 'Marketing Campaign',
    description: 'Digital marketing campaign for product launch',
    client: 'StartupXYZ',
    status: 'active',
    priority: 'high',
    progress: 80,
    budget: 30000,
    spent: 24000,
    startDate: '2024-01-15',
    endDate: '2024-02-28',
    teamMembers: ['Emily Davis', 'Robert Wilson'],
    projectManager: 'Emily Davis',
    tasksTotal: 15,
    tasksCompleted: 12,
    category: 'Marketing',
    healthScore: 88
  },
  {
    id: '6',
    name: 'Data Migration',
    description: 'Legacy system data migration to new platform',
    client: 'FinanceCorpLtd',
    status: 'planning',
    priority: 'critical',
    progress: 5,
    budget: 85000,
    spent: 4250,
    startDate: '2024-03-01',
    endDate: '2024-07-15',
    teamMembers: ['Mike Chen', 'David Lee', 'Robert Wilson'],
    projectManager: 'David Lee',
    tasksTotal: 28,
    tasksCompleted: 1,
    category: 'Data Migration',
    healthScore: 65
  },
]

const statusColumns = {
  'planning': {
    title: 'Planning',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-800',
    icon: Target
  },
  'active': {
    title: 'Active',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100 text-green-800',
    icon: PlayCircle
  },
  'on-hold': {
    title: 'On Hold',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100 text-yellow-800',
    icon: PauseCircle
  },
  'completed': {
    title: 'Completed',
    color: 'bg-emerald-50 border-emerald-200',
    headerColor: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle
  },
  'cancelled': {
    title: 'Cancelled',
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-100 text-red-800',
    icon: AlertTriangle
  },
}

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800',
  'critical': 'bg-red-100 text-red-800',
}

const priorityLabels = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
}

function getHealthScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

function getHealthScoreIcon(score: number) {
  if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />
  if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-600" />
  if (score >= 40) return <Clock className="h-4 w-4 text-orange-600" />
  return <AlertTriangle className="h-4 w-4 text-red-600" />
}

function getBudgetStatus(budget: number, spent: number) {
  const percentage = (spent / budget) * 100
  if (percentage > 90) return 'text-red-600'
  if (percentage > 75) return 'text-yellow-600'
  return 'text-green-600'
}

function ProjectKanbanCard({ project }: { project: Project }) {
  const budgetPercentage = (project.spent / project.budget) * 100
  
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
              <Folder className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
              <CardDescription className="text-xs flex items-center mt-1">
                <Building className="h-3 w-3 mr-1" />
                {project.client}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`flex items-center space-x-1 ${getHealthScoreColor(project.healthScore)}`}>
              {getHealthScoreIcon(project.healthScore)}
              <span className="text-xs font-medium">{project.healthScore}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-600 line-clamp-2">{project.description}</p>
        
        <div className="flex items-center justify-between">
          <Badge className={priorityColors[project.priority]} variant="secondary">
            {priorityLabels[project.priority]}
          </Badge>
          <span className="text-xs text-gray-500">{project.category}</span>
        </div>
        
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Budget</span>
              <span className={`font-medium ${getBudgetStatus(project.budget, project.spent)}`}>
                {budgetPercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={budgetPercentage} className="h-1" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Budget</span>
            <div className="font-medium">${(project.budget / 1000).toFixed(0)}k</div>
          </div>
          <div>
            <span className="text-gray-600">Tasks</span>
            <div className="font-medium">{project.tasksCompleted}/{project.tasksTotal}</div>
          </div>
        </div>
        
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{project.endDate}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{project.teamMembers.length} members</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ status, projects }: { status: keyof typeof statusColumns, projects: Project[] }) {
  const column = statusColumns[status]
  const Icon = column.icon
  
  return (
    <div className={`flex-1 min-w-80 ${column.color} rounded-lg border-2 border-dashed`}>
      <div className={`${column.headerColor} px-4 py-3 rounded-t-lg border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4" />
            <h3 className="font-medium">{column.title}</h3>
            <Badge variant="secondary" className="bg-white/50">
              {projects.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-3 min-h-96 max-h-96 overflow-y-auto">
        {projects.map((project) => (
          <ProjectKanbanCard key={project.id} project={project} />
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Folder className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No projects</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectKanbanPage() {
  const { user } = useAuth()
  
  const projectsByStatus = {
    'planning': mockProjects.filter(p => p.status === 'planning'),
    'active': mockProjects.filter(p => p.status === 'active'),
    'on-hold': mockProjects.filter(p => p.status === 'on-hold'),
    'completed': mockProjects.filter(p => p.status === 'completed'),
    'cancelled': mockProjects.filter(p => p.status === 'cancelled'),
  }

  const stats = {
    total: mockProjects.length,
    active: mockProjects.filter(p => p.status === 'active').length,
    onHold: mockProjects.filter(p => p.status === 'on-hold').length,
    completed: mockProjects.filter(p => p.status === 'completed').length,
    totalBudget: mockProjects.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: mockProjects.reduce((sum, p) => sum + p.spent, 0),
    avgProgress: mockProjects.reduce((sum, p) => sum + p.progress, 0) / mockProjects.length,
    avgHealthScore: mockProjects.reduce((sum, p) => sum + p.healthScore, 0) / mockProjects.length,
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Kanban Board</h1>
            <p className="text-gray-600 mt-1">
              Visual project management with drag-and-drop workflow
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
            <Button variant="outline">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grid View
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} active, {stats.completed} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalBudget / 1000).toFixed(0)}k</div>
              <p className="text-xs text-muted-foreground">
                ${(stats.totalSpent / 1000).toFixed(0)}k spent ({((stats.totalSpent / stats.totalBudget) * 100).toFixed(0)}%)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avgProgress)}%</div>
              <p className="text-xs text-muted-foreground">
                Across all active projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthScoreColor(stats.avgHealthScore)}`}>
                {Math.round(stats.avgHealthScore)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average project health
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="flex space-x-4 min-w-max pb-4">
            {Object.entries(projectsByStatus).map(([status, projects]) => (
              <KanbanColumn 
                key={status} 
                status={status as keyof typeof statusColumns} 
                projects={projects} 
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Status Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(statusColumns).map(([status, config]) => {
                const Icon = config.icon
                return (
                  <div key={status} className="flex items-center space-x-2">
                    <div className={`p-2 rounded-md ${config.headerColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{config.title}</div>
                      <div className="text-xs text-gray-500">
                        {projectsByStatus[status as keyof typeof projectsByStatus].length} projects
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}