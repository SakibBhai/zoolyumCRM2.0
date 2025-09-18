import { Request, Response } from 'express'
import { z } from 'zod'

// Task validation schema
const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).default(0),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateTaskSchema = taskSchema.partial()

// Mock data
let tasks = [
  {
    id: '1',
    title: 'Design Homepage Wireframes',
    description: 'Create detailed wireframes for the new homepage layout including mobile responsive design',
    status: 'completed',
    priority: 'high',
    assignedTo: 'sarah-johnson',
    assignedToName: 'Sarah Johnson',
    projectId: '1',
    projectName: 'Website Redesign',
    clientId: '1',
    clientName: 'TechCorp Solutions',
    dueDate: '2024-01-15',
    estimatedHours: 16,
    actualHours: 14,
    progress: 100,
    tags: ['design', 'wireframes', 'ui-ux'],
    dependencies: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T16:30:00Z',
    completedAt: '2024-01-15T16:30:00Z',
    customFields: {
      complexity: 'medium',
      tools: 'Figma, Sketch',
      reviewRequired: true
    }
  },
  {
    id: '2',
    title: 'Develop Homepage Component',
    description: 'Implement the homepage component based on approved wireframes using React and Tailwind CSS',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'mike-wilson',
    assignedToName: 'Mike Wilson',
    projectId: '1',
    projectName: 'Website Redesign',
    clientId: '1',
    clientName: 'TechCorp Solutions',
    dueDate: '2024-01-30',
    estimatedHours: 24,
    actualHours: 18,
    progress: 75,
    tags: ['development', 'react', 'frontend'],
    dependencies: ['1'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T14:20:00Z',
    customFields: {
      complexity: 'high',
      tools: 'React, Tailwind CSS, TypeScript',
      reviewRequired: true
    }
  },
  {
    id: '3',
    title: 'Setup Testing Environment',
    description: 'Configure automated testing environment with Jest and Cypress for the project',
    status: 'todo',
    priority: 'medium',
    assignedTo: 'lisa-chen',
    assignedToName: 'Lisa Chen',
    projectId: '1',
    projectName: 'Website Redesign',
    clientId: '1',
    clientName: 'TechCorp Solutions',
    dueDate: '2024-02-05',
    estimatedHours: 12,
    actualHours: 0,
    progress: 0,
    tags: ['testing', 'automation', 'qa'],
    dependencies: ['2'],
    createdAt: '2024-01-15T11:30:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    customFields: {
      complexity: 'medium',
      tools: 'Jest, Cypress, GitHub Actions',
      reviewRequired: false
    }
  },
  {
    id: '4',
    title: 'Mobile App Architecture Planning',
    description: 'Define the technical architecture and technology stack for the mobile application',
    status: 'review',
    priority: 'high',
    assignedTo: 'david-kim',
    assignedToName: 'David Kim',
    projectId: '2',
    projectName: 'Mobile App Development',
    clientId: '1',
    clientName: 'TechCorp Solutions',
    dueDate: '2024-02-20',
    estimatedHours: 20,
    actualHours: 18,
    progress: 90,
    tags: ['architecture', 'planning', 'mobile'],
    dependencies: [],
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-01-28T17:45:00Z',
    customFields: {
      complexity: 'high',
      tools: 'React Native, Firebase, AWS',
      reviewRequired: true
    }
  },
  {
    id: '5',
    title: 'Content Strategy Document',
    description: 'Create comprehensive content strategy for the marketing campaign',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'mike-wilson',
    assignedToName: 'Mike Wilson',
    projectId: '3',
    projectName: 'Marketing Campaign',
    clientId: '2',
    clientName: 'Marketing Pro',
    dueDate: '2023-11-15',
    estimatedHours: 10,
    actualHours: 12,
    progress: 100,
    tags: ['content', 'strategy', 'marketing'],
    dependencies: [],
    createdAt: '2023-11-01T09:00:00Z',
    updatedAt: '2023-11-15T15:30:00Z',
    completedAt: '2023-11-15T15:30:00Z',
    customFields: {
      complexity: 'low',
      tools: 'Google Docs, Canva',
      reviewRequired: true
    }
  },
  {
    id: '6',
    title: 'Database Schema Design',
    description: 'Design the database schema for the e-commerce platform including products, orders, and users',
    status: 'todo',
    priority: 'urgent',
    assignedTo: 'lisa-chen',
    assignedToName: 'Lisa Chen',
    projectId: '4',
    projectName: 'E-commerce Platform',
    clientId: '3',
    clientName: 'Startup.io',
    dueDate: '2024-02-01',
    estimatedHours: 16,
    actualHours: 0,
    progress: 0,
    tags: ['database', 'schema', 'backend'],
    dependencies: [],
    createdAt: '2024-01-25T10:15:00Z',
    updatedAt: '2024-01-25T10:15:00Z',
    customFields: {
      complexity: 'high',
      tools: 'PostgreSQL, Prisma',
      reviewRequired: true
    }
  }
]

// GET /api/tasks - Get all tasks with filtering and pagination
export const getTasks = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      priority,
      assignedTo,
      projectId,
      clientId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      overdue = 'false'
    } = req.query

    let filteredTasks = [...tasks]

    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status)
    }
    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority)
    }
    if (assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === assignedTo)
    }
    if (projectId) {
      filteredTasks = filteredTasks.filter(task => task.projectId === projectId)
    }
    if (clientId) {
      filteredTasks = filteredTasks.filter(task => task.clientId === clientId)
    }
    if (overdue === 'true') {
      const now = new Date()
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false
        return new Date(task.dueDate) < now
      })
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        (task.projectName && task.projectName.toLowerCase().includes(searchTerm)) ||
        (task.clientName && task.clientName.toLowerCase().includes(searchTerm))
      )
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a]
      const bValue = b[sortBy as keyof typeof b]
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

    res.json({
      tasks: paginatedTasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredTasks.length,
        pages: Math.ceil(filteredTasks.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
}

// GET /api/tasks/:id - Get a specific task
export const getTask = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const task = tasks.find(t => t.id === id)
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    res.json(task)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' })
  }
}

// POST /api/tasks - Create a new task
export const createTask = (req: Request, res: Response) => {
  try {
    const validatedData = taskSchema.parse(req.body)
    
    // In a real app, you would fetch project and client names from database
    const projectName = 'Project Name' // Mock project name
    const clientName = 'Client Name' // Mock client name
    const assignedToName = 'User Name' // Mock user name
    
    const newTask = {
      id: (tasks.length + 1).toString(),
      ...validatedData,
      projectName,
      clientName,
      assignedToName,
      actualHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {},
      dependencies: validatedData.dependencies || []
    }
    
    tasks.push(newTask)
    res.status(201).json(newTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create task' })
  }
}

// PUT /api/tasks/:id - Update a task
export const updateTask = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const taskIndex = tasks.findIndex(t => t.id === id)
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const validatedData = updateTaskSchema.parse(req.body)
    
    // Auto-set completion date if status changed to completed
    if (validatedData.status === 'completed' && tasks[taskIndex].status !== 'completed') {
      validatedData.completedAt = new Date().toISOString()
      validatedData.progress = 100
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(tasks[taskIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update task' })
  }
}

// DELETE /api/tasks/:id - Delete a task
export const deleteTask = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const taskIndex = tasks.findIndex(t => t.id === id)
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    tasks.splice(taskIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
}

// GET /api/tasks/stats - Get task statistics
export const getTaskStats = (req: Request, res: Response) => {
  try {
    const now = new Date()
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false
      return new Date(t.dueDate) < now
    })
    
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length
      },
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length
      },
      overdue: overdueTasks.length,
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
      averageProgress: tasks.length > 0 ? tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length : 0,
      totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      productivity: {
        onTime: tasks.filter(t => {
          if (t.status !== 'completed' || !t.dueDate || !t.completedAt) return false
          return new Date(t.completedAt) <= new Date(t.dueDate)
        }).length,
        late: tasks.filter(t => {
          if (t.status !== 'completed' || !t.dueDate || !t.completedAt) return false
          return new Date(t.completedAt) > new Date(t.dueDate)
        }).length
      }
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task statistics' })
  }
}

// PUT /api/tasks/:id/progress - Update task progress
export const updateTaskProgress = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { progress, note } = req.body
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be a number between 0 and 100' })
    }
    
    const taskIndex = tasks.findIndex(t => t.id === id)
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    const oldProgress = tasks[taskIndex].progress
    tasks[taskIndex].progress = progress
    tasks[taskIndex].updatedAt = new Date().toISOString()
    
    // Auto-update status based on progress
    if (progress === 100 && tasks[taskIndex].status !== 'completed') {
      tasks[taskIndex].status = 'completed'
      tasks[taskIndex].completedAt = new Date().toISOString()
    } else if (progress > 0 && progress < 100 && tasks[taskIndex].status === 'todo') {
      tasks[taskIndex].status = 'in_progress'
    }
    
    // In a real application, you would log this progress update
    const progressUpdate = {
      taskId: id,
      oldProgress,
      newProgress: progress,
      note: note || 'Progress updated',
      updatedAt: new Date().toISOString()
    }
    
    res.json({
      task: tasks[taskIndex],
      progressUpdate
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' })
  }
}

// POST /api/tasks/:id/time-entries - Add time entry to task
export const addTimeEntry = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { hours, description, date } = req.body
    
    const taskIndex = tasks.findIndex(t => t.id === id)
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // In a real application, you would store time entries in a separate collection
    const timeEntry = {
      id: `time-${Date.now()}`,
      taskId: id,
      hours,
      description,
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
    
    // Update actual hours
    tasks[taskIndex].actualHours = (tasks[taskIndex].actualHours || 0) + hours
    tasks[taskIndex].updatedAt = new Date().toISOString()
    
    res.status(201).json({
      timeEntry,
      task: tasks[taskIndex]
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add time entry' })
  }
}

// POST /api/tasks/:id/comments - Add comment to task
export const addTaskComment = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content, userId } = req.body
    
    const task = tasks.find(t => t.id === id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // In a real application, you would store comments in a separate collection
    const comment = {
      id: `comment-${Date.now()}`,
      taskId: id,
      content,
      userId: userId || 'current-user',
      createdAt: new Date().toISOString()
    }
    
    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' })
  }
}

// GET /api/tasks/kanban - Get tasks organized by status for Kanban view
export const getTasksKanban = (req: Request, res: Response) => {
  try {
    const { projectId, assignedTo } = req.query
    
    let filteredTasks = [...tasks]
    
    if (projectId) {
      filteredTasks = filteredTasks.filter(task => task.projectId === projectId)
    }
    if (assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === assignedTo)
    }
    
    const kanbanData = {
      todo: filteredTasks.filter(t => t.status === 'todo'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      review: filteredTasks.filter(t => t.status === 'review'),
      completed: filteredTasks.filter(t => t.status === 'completed')
    }
    
    res.json(kanbanData)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Kanban data' })
  }
}

// PUT /api/tasks/:id/assign - Assign task to user
export const assignTask = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { assignedTo, assignedToName } = req.body
    
    const taskIndex = tasks.findIndex(t => t.id === id)
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    tasks[taskIndex].assignedTo = assignedTo
    tasks[taskIndex].assignedToName = assignedToName || 'Unknown User'
    tasks[taskIndex].updatedAt = new Date().toISOString()
    
    res.json(tasks[taskIndex])
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign task' })
  }
}