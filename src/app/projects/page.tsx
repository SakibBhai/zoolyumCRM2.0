'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, DollarSign, Clock, AlertTriangle, CheckCircle, Target, TrendingUp, Loader2, Plus, Search, Filter, MoreHorizontal, Calendar, FileText, PlayCircle, PauseCircle, Building, Folder, Edit } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuth } from '@/hooks/useAuth'
import { useProjects, useProjectStats, Project } from '@/hooks/useProjects'

// Mock data removed - using real API data

const statusColors = {
  'planning': 'bg-blue-100 text-blue-800',
  'active': 'bg-green-100 text-green-800',
  'on-hold': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
}

const statusLabels = {
  'planning': 'Planning',
  'active': 'Active',
  'on-hold': 'On Hold',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
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

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onViewDetails: (project: Project) => void
  onUpdateProgress: (project: Project, progress: number) => void
}

function ProjectCard({ project, onEdit, onViewDetails, onUpdateProgress }: ProjectCardProps) {
  const budgetPercentage = ((project.actualCost || 0) / (project.budget || 1)) * 100
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{project.clientId}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${getHealthScoreColor(project.healthScore)}`}>
              {getHealthScoreIcon(project.healthScore)}
              <span className="text-sm font-medium">{project.healthScore}</span>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
           <div className="flex items-center space-x-2">
             <Badge variant={statusColors[project.status].variant as any}>
               {statusLabels[project.status]}
             </Badge>
             <Badge variant={priorityColors[project.priority].variant as any}>
               {priorityLabels[project.priority]}
             </Badge>
           </div>
         </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-3 w-3 mr-1" />
              Budget
            </div>
            <div className="font-medium">${(project.budget || 0).toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Spent
            </div>
            <div className={`font-medium ${getBudgetStatus(project.budget || 0, project.actualCost || 0)}`}>
              ${(project.actualCost || 0).toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              Team
            </div>
            <div className="font-medium">{project.teamMembers?.length || 0}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="h-3 w-3 mr-1" />
              Due
            </div>
            <div className="font-medium">{new Date(project.endDate).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            PM: {project.projectManager}
          </div>
          <Badge variant="outline" className="text-xs">
            {project.category}
          </Badge>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewDetails(project)}>
            <FileText className="h-3 w-3 mr-1" />
            Details
          </Button>
          <Button size="sm" className="flex-1" onClick={() => onEdit(project)}>
            <Users className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { projects, loading, error, fetchProjects } = useProjects()
  const { stats, loading: statsLoading, error: statsError } = useProjectStats()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Fetch projects on component mount and when filters change
  useEffect(() => {
    const params: any = {}
    if (searchTerm) params.search = searchTerm
    if (statusFilter !== 'all') params.status = statusFilter
    if (priorityFilter !== 'all') params.priority = priorityFilter
    if (categoryFilter !== 'all') params.category = categoryFilter
    
    fetchProjects(params)
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, fetchProjects])

  // Handle action callbacks
  const handleEdit = (project: Project) => {
    console.log('Edit project:', project)
    // TODO: Implement edit functionality
  }

  const handleViewDetails = (project: Project) => {
    console.log('View project details:', project)
    // TODO: Navigate to project details page
  }

  const handleUpdateProgress = async (project: Project, newProgress: number) => {
    try {
      // TODO: Implement progress update
      console.log('Update progress:', project.id, newProgress)
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  // Show loading state
  if (loading && projects.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show error state
  if (error && projects.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchProjects()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const filteredProjects = projects
  const categories = [...new Set(projects.map(p => p.category))]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
            <p className="text-gray-600 mt-1">
              Track project progress and manage resources
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Kanban View
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  )}
                </div>
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">{stats?.byStatus?.in_progress || 0}</p>
                  )}
                </div>
                <PlayCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Hold</p>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold text-yellow-600">{stats?.byStatus?.on_hold || 0}</p>
                  )}
                </div>
                <PauseCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{stats?.byStatus?.completed || 0}</p>
                  )}
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  {statsLoading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">${(stats?.totalBudget || 0).toLocaleString()}</p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actual Cost</p>
                  {statsLoading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">${(stats?.totalActualCost || 0).toLocaleString()}</p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">{Math.round(stats?.averageProgress || 0)}%</p>
                  )}
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Time</p>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{stats?.onTimeProjects || 0}</p>
                  )}
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search projects..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onUpdateProgress={handleUpdateProgress}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new project</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}