import { Request, Response } from 'express'
import { z } from 'zod'

// Project validation schema
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).default(0),
  teamMembers: z.array(z.string()).optional(),
  projectManager: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  resources: z.array(z.object({
    name: z.string(),
    type: z.enum(['document', 'link', 'file', 'other']),
    url: z.string().optional(),
    description: z.string().optional()
  })).optional()
})

const updateProjectSchema = projectSchema.partial()

// Mock data
let projects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the corporate website with modern UI/UX',
    clientId: '1',
    clientName: 'TechCorp Solutions',
    status: 'in_progress',
    priority: 'high',
    startDate: '2024-01-01',
    endDate: '2024-03-01',
    budget: 50000,
    actualCost: 32000,
    progress: 65,
    teamMembers: ['sarah-johnson', 'mike-wilson', 'lisa-chen'],
    projectManager: 'sarah-johnson',
    tags: ['web-development', 'ui-ux', 'responsive'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    customFields: {
      technology: 'React, Next.js',
      deliverables: 'Wireframes, Mockups, Development, Testing',
      milestones: '4'
    },
    resources: [
      {
        name: 'Project Brief',
        type: 'document',
        url: '/documents/project-brief.pdf',
        description: 'Initial project requirements and scope'
      },
      {
        name: 'Design System',
        type: 'link',
        url: 'https://figma.com/design-system',
        description: 'Brand guidelines and design components'
      }
    ]
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native iOS and Android app for customer engagement',
    clientId: '1',
    clientName: 'TechCorp Solutions',
    status: 'planning',
    priority: 'medium',
    startDate: '2024-02-15',
    endDate: '2024-06-15',
    budget: 100000,
    actualCost: 5000,
    progress: 10,
    teamMembers: ['david-kim', 'lisa-chen'],
    projectManager: 'david-kim',
    tags: ['mobile-development', 'ios', 'android', 'native'],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
    customFields: {
      technology: 'React Native',
      deliverables: 'MVP, Beta, Production Release',
      milestones: '6'
    },
    resources: [
      {
        name: 'Technical Specification',
        type: 'document',
        url: '/documents/tech-spec.pdf',
        description: 'Detailed technical requirements'
      }
    ]
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Digital marketing campaign for product launch',
    clientId: '2',
    clientName: 'Marketing Pro',
    status: 'completed',
    priority: 'high',
    startDate: '2023-11-01',
    endDate: '2024-01-31',
    budget: 25000,
    actualCost: 23500,
    progress: 100,
    teamMembers: ['mike-wilson', 'sarah-johnson'],
    projectManager: 'mike-wilson',
    tags: ['marketing', 'digital', 'campaign', 'social-media'],
    createdAt: '2023-10-15T08:00:00Z',
    updatedAt: '2024-01-31T17:00:00Z',
    customFields: {
      channels: 'Social Media, Email, PPC',
      deliverables: 'Strategy, Content, Analytics Report',
      milestones: '3'
    },
    resources: [
      {
        name: 'Campaign Strategy',
        type: 'document',
        url: '/documents/campaign-strategy.pdf',
        description: 'Marketing strategy and timeline'
      },
      {
        name: 'Analytics Dashboard',
        type: 'link',
        url: 'https://analytics.google.com/dashboard',
        description: 'Real-time campaign performance'
      }
    ]
  },
  {
    id: '4',
    name: 'E-commerce Platform',
    description: 'Custom e-commerce solution with inventory management',
    clientId: '3',
    clientName: 'Startup.io',
    status: 'on_hold',
    priority: 'low',
    startDate: '2024-01-15',
    endDate: '2024-05-15',
    budget: 75000,
    actualCost: 15000,
    progress: 25,
    teamMembers: ['lisa-chen', 'david-kim'],
    projectManager: 'lisa-chen',
    tags: ['e-commerce', 'web-development', 'inventory'],
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-25T10:15:00Z',
    customFields: {
      technology: 'Node.js, React, PostgreSQL',
      deliverables: 'MVP, Admin Panel, Payment Integration',
      milestones: '5'
    },
    resources: [
      {
        name: 'Requirements Document',
        type: 'document',
        url: '/documents/ecommerce-requirements.pdf',
        description: 'Functional and technical requirements'
      }
    ]
  }
]

// GET /api/projects - Get all projects with filtering and pagination
export const getProjects = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      priority,
      clientId,
      projectManager,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let filteredProjects = [...projects]

    // Apply filters
    if (status) {
      filteredProjects = filteredProjects.filter(project => project.status === status)
    }
    if (priority) {
      filteredProjects = filteredProjects.filter(project => project.priority === priority)
    }
    if (clientId) {
      filteredProjects = filteredProjects.filter(project => project.clientId === clientId)
    }
    if (projectManager) {
      filteredProjects = filteredProjects.filter(project => project.projectManager === projectManager)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm)) ||
        project.clientName.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredProjects.sort((a, b) => {
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
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

    res.json({
      projects: paginatedProjects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredProjects.length,
        pages: Math.ceil(filteredProjects.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
}

// GET /api/projects/:id - Get a specific project
export const getProject = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const project = projects.find(p => p.id === id)
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' })
  }
}

// POST /api/projects - Create a new project
export const createProject = (req: Request, res: Response) => {
  try {
    const validatedData = projectSchema.parse(req.body)
    
    // In a real app, you would fetch client name from database
    const clientName = 'Client Name' // Mock client name
    
    const newProject = {
      id: (projects.length + 1).toString(),
      ...validatedData,
      clientName,
      actualCost: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {},
      resources: validatedData.resources || []
    }
    
    projects.push(newProject)
    res.status(201).json(newProject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create project' })
  }
}

// PUT /api/projects/:id - Update a project
export const updateProject = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const projectIndex = projects.findIndex(p => p.id === id)
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const validatedData = updateProjectSchema.parse(req.body)
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(projects[projectIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update project' })
  }
}

// DELETE /api/projects/:id - Delete a project
export const deleteProject = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const projectIndex = projects.findIndex(p => p.id === id)
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    projects.splice(projectIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' })
  }
}

// GET /api/projects/stats - Get project statistics
export const getProjectStats = (req: Request, res: Response) => {
  try {
    const stats = {
      total: projects.length,
      byStatus: {
        planning: projects.filter(p => p.status === 'planning').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        on_hold: projects.filter(p => p.status === 'on_hold').length,
        completed: projects.filter(p => p.status === 'completed').length,
        cancelled: projects.filter(p => p.status === 'cancelled').length
      },
      byPriority: {
        low: projects.filter(p => p.priority === 'low').length,
        medium: projects.filter(p => p.priority === 'medium').length,
        high: projects.filter(p => p.priority === 'high').length,
        urgent: projects.filter(p => p.priority === 'urgent').length
      },
      totalBudget: projects.reduce((sum, project) => sum + (project.budget || 0), 0),
      totalActualCost: projects.reduce((sum, project) => sum + (project.actualCost || 0), 0),
      averageProgress: projects.length > 0 ? projects.reduce((sum, project) => sum + project.progress, 0) / projects.length : 0,
      onTimeProjects: projects.filter(p => {
        const endDate = new Date(p.endDate)
        const now = new Date()
        return p.status === 'completed' || (p.status !== 'completed' && endDate > now)
      }).length,
      overdueProjects: projects.filter(p => {
        const endDate = new Date(p.endDate)
        const now = new Date()
        return p.status !== 'completed' && endDate < now
      }).length
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project statistics' })
  }
}

// PUT /api/projects/:id/progress - Update project progress
export const updateProjectProgress = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { progress, note } = req.body
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be a number between 0 and 100' })
    }
    
    const projectIndex = projects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const oldProgress = projects[projectIndex].progress
    projects[projectIndex].progress = progress
    projects[projectIndex].updatedAt = new Date().toISOString()
    
    // Auto-update status based on progress
    if (progress === 100 && projects[projectIndex].status !== 'completed') {
      projects[projectIndex].status = 'completed'
    } else if (progress > 0 && projects[projectIndex].status === 'planning') {
      projects[projectIndex].status = 'in_progress'
    }
    
    // In a real application, you would log this progress update
    const progressUpdate = {
      projectId: id,
      oldProgress,
      newProgress: progress,
      note: note || 'Progress updated',
      updatedAt: new Date().toISOString()
    }
    
    res.json({
      project: projects[projectIndex],
      progressUpdate
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' })
  }
}

// POST /api/projects/:id/resources - Add resource to project
export const addProjectResource = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, type, url, description } = req.body
    
    const projectIndex = projects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const resource = {
      id: `resource-${Date.now()}`,
      name,
      type,
      url,
      description,
      createdAt: new Date().toISOString()
    }
    
    if (!projects[projectIndex].resources) {
      projects[projectIndex].resources = []
    }
    
    projects[projectIndex].resources.push(resource)
    projects[projectIndex].updatedAt = new Date().toISOString()
    
    res.status(201).json(resource)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add resource' })
  }
}

// GET /api/projects/:id/tasks - Get tasks for a project
export const getProjectTasks = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const project = projects.find(p => p.id === id)
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // Mock tasks data - in a real app, this would come from a tasks collection
    const tasks = [
      {
        id: '1',
        title: 'Design wireframes',
        status: 'completed',
        priority: 'high',
        assignedTo: 'sarah-johnson',
        dueDate: '2024-01-15',
        progress: 100
      },
      {
        id: '2',
        title: 'Develop homepage',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'mike-wilson',
        dueDate: '2024-01-30',
        progress: 75
      },
      {
        id: '3',
        title: 'Setup testing environment',
        status: 'todo',
        priority: 'medium',
        assignedTo: 'lisa-chen',
        dueDate: '2024-02-05',
        progress: 0
      }
    ].filter(() => Math.random() > 0.3) // Randomly show some tasks
    
    res.json(tasks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project tasks' })
  }
}

// POST /api/projects/:id/time-entries - Add time entry to project
export const addTimeEntry = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { hours, description, date, userId } = req.body
    
    const project = projects.find(p => p.id === id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // In a real application, you would store time entries in a separate collection
    const timeEntry = {
      id: `time-${Date.now()}`,
      projectId: id,
      userId: userId || 'current-user',
      hours,
      description,
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
    
    res.status(201).json(timeEntry)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add time entry' })
  }
}