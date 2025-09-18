'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Users,
  Clock,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  Circle,
  Timer,
  User,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Edit,
  Trash2,
  Target,
  List,
  ArrowLeft,
  GripVertical,
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: string
  reporter: string
  project: string
  dueDate: string
  createdDate: string
  estimatedHours: number
  loggedHours: number
  tags: string[]
  comments: number
  attachments: number
  subtasks: number
  completedSubtasks: number
  category: string
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design homepage mockup',
    description: 'Create wireframes and high-fidelity mockups for the new homepage design',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Sarah Johnson',
    reporter: 'Mike Chen',
    project: 'Website Redesign',
    dueDate: '2024-02-15',
    createdDate: '2024-01-20',
    estimatedHours: 16,
    loggedHours: 8.5,
    tags: ['design', 'ui/ux', 'homepage'],
    comments: 5,
    attachments: 3,
    subtasks: 4,
    completedSubtasks: 2,
    category: 'Design'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up NextAuth.js with OAuth providers and database integration',
    status: 'todo',
    priority: 'critical',
    assignee: 'David Lee',
    reporter: 'Sarah Johnson',
    project: 'Mobile App Development',
    dueDate: '2024-02-10',
    createdDate: '2024-01-25',
    estimatedHours: 24,
    loggedHours: 0,
    tags: ['backend', 'auth', 'security'],
    comments: 2,
    attachments: 1,
    subtasks: 6,
    completedSubtasks: 0,
    category: 'Development'
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Document all REST API endpoints with examples and response schemas',
    status: 'review',
    priority: 'medium',
    assignee: 'Emily Davis',
    reporter: 'David Lee',
    project: 'E-commerce Platform',
    dueDate: '2024-02-20',
    createdDate: '2024-01-15',
    estimatedHours: 12,
    loggedHours: 10,
    tags: ['documentation', 'api', 'backend'],
    comments: 8,
    attachments: 2,
    subtasks: 3,
    completedSubtasks: 3,
    category: 'Documentation'
  },
  {
    id: '4',
    title: 'Setup CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'done',
    priority: 'high',
    assignee: 'Robert Wilson',
    reporter: 'Mike Chen',
    project: 'Website Redesign',
    dueDate: '2024-01-30',
    createdDate: '2024-01-10',
    estimatedHours: 8,
    loggedHours: 6,
    tags: ['devops', 'ci/cd', 'automation'],
    comments: 3,
    attachments: 0,
    subtasks: 2,
    completedSubtasks: 2,
    category: 'DevOps'
  },
  {
    id: '5',
    title: 'User testing session',
    description: 'Conduct usability testing with 10 target users and collect feedback',
    status: 'todo',
    priority: 'medium',
    assignee: 'Emily Davis',
    reporter: 'Sarah Johnson',
    project: 'Mobile App Development',
    dueDate: '2024-02-25',
    createdDate: '2024-01-28',
    estimatedHours: 20,
    loggedHours: 0,
    tags: ['testing', 'ux', 'research'],
    comments: 1,
    attachments: 0,
    subtasks: 5,
    completedSubtasks: 0,
    category: 'Testing'
  },
  {
    id: '6',
    title: 'Database optimization',
    description: 'Optimize database queries and add proper indexing for better performance',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Mike Chen',
    reporter: 'David Lee',
    project: 'E-commerce Platform',
    dueDate: '2024-02-18',
    createdDate: '2024-01-22',
    estimatedHours: 16,
    loggedHours: 12,
    tags: ['database', 'performance', 'optimization'],
    comments: 4,
    attachments: 1,
    subtasks: 3,
    completedSubtasks: 1,
    category: 'Development'
  },
  {
    id: '7',
    title: 'Mobile app testing',
    description: 'Test mobile app on different devices and screen sizes',
    status: 'review',
    priority: 'medium',
    assignee: 'Sarah Johnson',
    reporter: 'Emily Davis',
    project: 'Mobile App Development',
    dueDate: '2024-02-22',
    createdDate: '2024-01-30',
    estimatedHours: 12,
    loggedHours: 8,
    tags: ['mobile', 'testing', 'qa'],
    comments: 6,
    attachments: 4,
    subtasks: 4,
    completedSubtasks: 3,
    category: 'Testing'
  },
  {
    id: '8',
    title: 'Performance monitoring setup',
    description: 'Implement application performance monitoring and alerting',
    status: 'done',
    priority: 'high',
    assignee: 'Robert Wilson',
    reporter: 'Mike Chen',
    project: 'E-commerce Platform',
    dueDate: '2024-02-05',
    createdDate: '2024-01-12',
    estimatedHours: 10,
    loggedHours: 9,
    tags: ['monitoring', 'performance', 'devops'],
    comments: 2,
    attachments: 1,
    subtasks: 3,
    completedSubtasks: 3,
    category: 'DevOps'
  },
]

const columns = [
  { id: 'todo', title: 'To Do', status: 'todo' as const },
  { id: 'in-progress', title: 'In Progress', status: 'in-progress' as const },
  { id: 'review', title: 'Review', status: 'review' as const },
  { id: 'done', title: 'Done', status: 'done' as const },
]

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

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'low': return <Flag className="h-3 w-3 text-gray-500" />
    case 'medium': return <Flag className="h-3 w-3 text-yellow-500" />
    case 'high': return <Flag className="h-3 w-3 text-orange-500" />
    case 'critical': return <AlertTriangle className="h-3 w-3 text-red-500" />
    default: return <Flag className="h-3 w-3 text-gray-500" />
  }
}

function TaskKanbanCard({ task }: { task: Task }) {
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const progressPercentage = task.subtasks > 0 ? (task.completedSubtasks / task.subtasks) * 100 : 0
  const timeProgress = task.estimatedHours > 0 ? (task.loggedHours / task.estimatedHours) * 100 : 0
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done'
  
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">
              {task.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <GripVertical className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={priorityColors[task.priority]} variant="secondary">
            <div className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
              <span className="text-xs">{priorityLabels[task.priority]}</span>
            </div>
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
        
        {task.subtasks > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{task.completedSubtasks}/{task.subtasks}</span>
            </div>
            <Progress value={progressPercentage} className="h-1" />
          </div>
        )}
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Time</span>
            <span className={`font-medium ${timeProgress > 100 ? 'text-red-600' : 'text-gray-900'}`}>
              {task.loggedHours}h / {task.estimatedHours}h
            </span>
          </div>
          <Progress value={Math.min(timeProgress, 100)} className="h-1" />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{task.assignee.split(' ')[0]}</span>
          </div>
          <div className="flex items-center space-x-2">
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
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Due: {task.dueDate}</span>
          <Button 
            size="sm" 
            variant={isTimerRunning ? "destructive" : "outline"}
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              setIsTimerRunning(!isTimerRunning)
            }}
          >
            {isTimerRunning ? (
              <>
                <Pause className="h-2 w-2 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-2 w-2 mr-1" />
                Start
              </>
            )}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ column, tasks }: { column: typeof columns[0], tasks: Task[] }) {
  const columnTasks = tasks.filter(task => task.status === column.status)
  
  const getColumnColor = (status: string) => {
    switch (status) {
      case 'todo': return 'border-gray-200 bg-gray-50'
      case 'in-progress': return 'border-blue-200 bg-blue-50'
      case 'review': return 'border-yellow-200 bg-yellow-50'
      case 'done': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }
  
  return (
    <div className={`flex-1 min-w-[280px] ${getColumnColor(column.status)} rounded-lg border-2 border-dashed p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {columnTasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-0 max-h-[calc(100vh-300px)] overflow-y-auto">
        {columnTasks.map((task) => (
          <TaskKanbanCard key={task.id} task={task} />
        ))}
        
        {columnTasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TaskKanbanPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter
    const matchesProject = projectFilter === 'all' || task.project === projectFilter
    
    return matchesSearch && matchesPriority && matchesAssignee && matchesProject
  })

  const stats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
    inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
    review: filteredTasks.filter(t => t.status === 'review').length,
    done: filteredTasks.filter(t => t.status === 'done').length,
  }

  const assignees = [...new Set(mockTasks.map(t => t.assignee))]
  const projects = [...new Set(mockTasks.map(t => t.project))]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/tasks">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </a>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Kanban Board</h1>
              <p className="text-gray-600 mt-1">
                Drag and drop tasks to update their status
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
              <p className="text-xs text-muted-foreground">Pending tasks</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Active tasks</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.review}</div>
              <p className="text-xs text-muted-foreground">In review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Done</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} tasks={filteredTasks} />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}