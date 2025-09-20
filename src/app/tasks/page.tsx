'use client'

import { useState, useMemo, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { useTasks, useTaskStats, Task } from '@/hooks/useTasks'
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  User,
  Tag,
  CheckCircle,
  Circle,
  AlertCircle,
  Play,
  Pause,
  MoreHorizontal,
  Grid3X3,
  List,
  Kanban,
  Edit,
  Eye,
  Users,
  Square,
  AlertTriangle,
  Timer,
  Flag,
  MessageSquare,
  Paperclip,
  Trash2,
  Target,
  Folder,
  Grid
} from 'lucide-react'

// Mock data removed - using real API data

const statusColors = {
  'todo': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'review': 'bg-yellow-100 text-yellow-800',
  'done': 'bg-green-100 text-green-800',
}

const statusLabels = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'Review',
  'done': 'Done',
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'todo': return <Circle className="h-4 w-4 text-gray-500" />
    case 'in-progress': return <Timer className="h-4 w-4 text-blue-500" />
    case 'review': return <Eye className="h-4 w-4 text-yellow-500" />
    case 'done': return <CheckCircle className="h-4 w-4 text-green-500" />
    default: return <Circle className="h-4 w-4 text-gray-500" />
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'low': return <Flag className="h-4 w-4 text-gray-500" />
    case 'medium': return <Flag className="h-4 w-4 text-yellow-500" />
    case 'high': return <Flag className="h-4 w-4 text-orange-500" />
    case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
    default: return <Flag className="h-4 w-4 text-gray-500" />
  }
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onUpdateProgress: (taskId: string, progress: number) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, onEdit, onViewDetails, onUpdateProgress, onDelete }: TaskCardProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const progressPercentage = task.progress || 0
  const timeProgressPercentage = task.estimatedHours > 0 ? ((task.actualHours || 0) / task.estimatedHours) * 100 : 0
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{task.title}</CardTitle>
              <CardDescription className="mt-1 text-sm">
                {task.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getPriorityIcon(task.priority)}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={statusColors[task.status]}>
            {statusLabels[task.status]}
          </Badge>
          <Badge className={priorityColors[task.priority]}>
            {priorityLabels[task.priority]}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Time Progress</span>
            <span className={`font-medium ${timeProgressPercentage > 100 ? 'text-red-600' : 'text-gray-900'}`}>
              {task.actualHours || 0}h / {task.estimatedHours || 0}h
            </span>
          </div>
          <Progress value={Math.min(timeProgressPercentage, 100)} className="h-2" />
          {timeProgressPercentage > 100 && (
            <p className="text-xs text-red-600">Over estimated time</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Project</span>
            <div className="font-medium truncate">{task.projectId || 'No Project'}</div>
          </div>
          <div>
            <span className="text-gray-600">Due Date</span>
            <div className="font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span className="truncate">{task.assignee}</span>
          </div>
          <div className="flex items-center space-x-3">
            {task.comments > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.comments}</span>
              </div>
            )}
            {task.attachments > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tags and Assignee */}
        <div className="space-y-2">
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {task.assignedTo && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{task.assignedTo}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewDetails(task)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(task)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant={isTimerRunning ? "destructive" : "default"}
            className="flex-1"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
          >
            {isTimerRunning ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Start
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TasksPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { fetchTasks, updateTask, deleteTask, updateProgress, loading, error } = useTasks()
  const { fetchStats, loading: statsLoading, error: statsError } = useTaskStats()
  const [stats, setStats] = useState<any>(null)

  // Fetch tasks when filters change
  useEffect(() => {
    const loadTasks = async () => {
      const filters = {
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(assigneeFilter !== 'all' && { assignedTo: assigneeFilter }),
        ...(projectFilter !== 'all' && { projectId: projectFilter })
      }
      
      const result = await fetchTasks(filters)
      if (result) {
        setTasks(result.tasks)
        setTotalPages(result.pagination.pages)
      }
    }

    loadTasks()
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter, projectFilter, currentPage, fetchTasks])

  // Fetch stats
  useEffect(() => {
    const loadStats = async () => {
      const result = await fetchStats()
      if (result) {
        setStats(result)
      }
    }

    loadStats()
  }, [fetchStats])

  // Handler functions
  const handleEdit = async (task: Task) => {
    // In a real app, this would open an edit modal
    console.log('Edit task:', task)
  }

  const handleViewDetails = (task: Task) => {
    // In a real app, this would open a task details modal
    console.log('View task details:', task)
  }

  const handleUpdateProgress = async (taskId: string, progress: number) => {
    const result = await updateProgress(taskId, progress)
    if (result) {
      // Refresh tasks
      const filters = {
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(assigneeFilter !== 'all' && { assignedTo: assigneeFilter }),
        ...(projectFilter !== 'all' && { projectId: projectFilter })
      }
      
      const tasksResult = await fetchTasks(filters)
      if (tasksResult) {
        setTasks(tasksResult.tasks)
      }
    }
  }

  const handleDelete = async (taskId: string) => {
    const success = await deleteTask(taskId)
    if (success) {
      // Refresh tasks
      const filters = {
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(assigneeFilter !== 'all' && { assignedTo: assigneeFilter }),
        ...(projectFilter !== 'all' && { projectId: projectFilter })
      }
      
      const tasksResult = await fetchTasks(filters)
      if (tasksResult) {
        setTasks(tasksResult.tasks)
      }
    }
  }

  // Loading and error states
  if (loading && tasks.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Error loading tasks</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const filteredTasks = tasks
  const assignees = [...new Set(tasks.map(t => t.assignee))]
  const projects = [...new Set(tasks.map(t => t.project))]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600 mt-1">
              Track tasks, manage time, and collaborate with your team
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
            <Button 
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Tasks</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-gray-600">{stats?.byStatus?.todo || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">{stats?.byStatus?.in_progress || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-yellow-600">{stats?.byStatus?.review || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Reviewing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Done</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-green-600">{stats?.byStatus?.completed || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Late</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold">{stats?.totalEstimatedHours || 0}h</div>
              )}
              <p className="text-xs text-muted-foreground">Total time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logged</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">{stats?.totalActualHours || 0}h</div>
              )}
              <p className="text-xs text-muted-foreground">Time spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search tasks..."
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
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
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
                <Label htmlFor="assignee">Assignee</Label>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {assignees.map((assignee) => (
                      <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>{project}</SelectItem>
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

        {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleEdit}
                  onViewDetails={handleViewDetails}
                  onUpdateProgress={handleUpdateProgress}
                  onDelete={handleDelete}
                />
              ))}
            </div>

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new task</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}