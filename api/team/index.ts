import { Request, Response } from 'express'
import { z } from 'zod'

// Team member validation schema
const teamMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'developer', 'designer', 'qa', 'sales', 'marketing', 'support']),
  department: z.enum(['management', 'development', 'design', 'qa', 'sales', 'marketing', 'support', 'hr']),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']),
  hireDate: z.string(),
  salary: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  permissions: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateTeamMemberSchema = teamMemberSchema.partial()

// Mock data
let teamMembers = [
  {
    id: 'sarah-johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@agency.com',
    phone: '+1-555-0101',
    role: 'manager',
    department: 'management',
    status: 'active',
    hireDate: '2022-03-15',
    salary: 85000,
    hourlyRate: 45,
    skills: ['Project Management', 'Agile', 'Scrum', 'Leadership', 'Client Relations'],
    bio: 'Experienced project manager with 8+ years in digital agencies. Specializes in client relationship management and team coordination.',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20confident%20woman%20project%20manager%20in%20business%20attire&image_size=square',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    emergencyContact: {
      name: 'John Johnson',
      relationship: 'Spouse',
      phone: '+1-555-0102'
    },
    permissions: ['projects.read', 'projects.write', 'clients.read', 'clients.write', 'team.read'],
    createdAt: '2022-03-15T09:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    customFields: {
      employeeId: 'EMP001',
      workLocation: 'Office',
      timeZone: 'PST'
    }
  },
  {
    id: 'mike-wilson',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@agency.com',
    phone: '+1-555-0103',
    role: 'developer',
    department: 'development',
    status: 'active',
    hireDate: '2021-08-20',
    salary: 95000,
    hourlyRate: 50,
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'GraphQL'],
    bio: 'Full-stack developer with expertise in modern web technologies. Passionate about clean code and scalable architectures.',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20focused%20male%20software%20developer%20with%20glasses&image_size=square',
    address: {
      street: '456 Tech Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '73301',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Lisa Wilson',
      relationship: 'Sister',
      phone: '+1-555-0104'
    },
    permissions: ['projects.read', 'projects.write', 'tasks.read', 'tasks.write'],
    createdAt: '2021-08-20T10:30:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    customFields: {
      employeeId: 'EMP002',
      workLocation: 'Remote',
      timeZone: 'CST'
    }
  },
  {
    id: 'lisa-chen',
    firstName: 'Lisa',
    lastName: 'Chen',
    email: 'lisa.chen@agency.com',
    phone: '+1-555-0105',
    role: 'designer',
    department: 'design',
    status: 'active',
    hireDate: '2023-01-10',
    salary: 75000,
    hourlyRate: 40,
    skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
    bio: 'Creative UI/UX designer with a passion for user-centered design. Experienced in creating intuitive and beautiful digital experiences.',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20creative%20asian%20female%20designer%20with%20artistic%20style&image_size=square',
    address: {
      street: '789 Design Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    emergencyContact: {
      name: 'David Chen',
      relationship: 'Father',
      phone: '+1-555-0106'
    },
    permissions: ['projects.read', 'tasks.read', 'tasks.write'],
    createdAt: '2023-01-10T11:00:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
    customFields: {
      employeeId: 'EMP003',
      workLocation: 'Hybrid',
      timeZone: 'PST'
    }
  },
  {
    id: 'david-kim',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@agency.com',
    phone: '+1-555-0107',
    role: 'developer',
    department: 'development',
    status: 'active',
    hireDate: '2022-06-01',
    salary: 90000,
    hourlyRate: 48,
    skills: ['React Native', 'iOS', 'Android', 'Firebase', 'Swift', 'Kotlin'],
    bio: 'Mobile app developer specializing in cross-platform solutions. Expert in React Native and native iOS/Android development.',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20confident%20korean%20male%20mobile%20developer&image_size=square',
    address: {
      street: '321 Mobile St',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Grace Kim',
      relationship: 'Wife',
      phone: '+1-555-0108'
    },
    permissions: ['projects.read', 'projects.write', 'tasks.read', 'tasks.write'],
    createdAt: '2022-06-01T08:30:00Z',
    updatedAt: '2024-01-25T09:15:00Z',
    customFields: {
      employeeId: 'EMP004',
      workLocation: 'Office',
      timeZone: 'PST'
    }
  },
  {
    id: 'emma-davis',
    firstName: 'Emma',
    lastName: 'Davis',
    email: 'emma.davis@agency.com',
    phone: '+1-555-0109',
    role: 'qa',
    department: 'qa',
    status: 'on_leave',
    hireDate: '2023-04-15',
    salary: 70000,
    hourlyRate: 38,
    skills: ['Manual Testing', 'Automation Testing', 'Selenium', 'Jest', 'Cypress', 'Bug Tracking'],
    bio: 'Quality assurance specialist with attention to detail. Ensures all deliverables meet the highest quality standards.',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20detail-oriented%20female%20qa%20tester&image_size=square',
    address: {
      street: '654 Quality Lane',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202',
      country: 'USA'
    },
    emergencyContact: {
      name: 'Robert Davis',
      relationship: 'Brother',
      phone: '+1-555-0110'
    },
    permissions: ['projects.read', 'tasks.read', 'tasks.write'],
    createdAt: '2023-04-15T13:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    customFields: {
      employeeId: 'EMP005',
      workLocation: 'Remote',
      timeZone: 'MST'
    }
  }
]

// GET /api/team - Get all team members with filtering and pagination
export const getTeamMembers = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      role,
      department,
      status,
      search,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query

    let filteredMembers = [...teamMembers]

    // Apply filters
    if (role) {
      filteredMembers = filteredMembers.filter(member => member.role === role)
    }
    if (department) {
      filteredMembers = filteredMembers.filter(member => member.department === department)
    }
    if (status) {
      filteredMembers = filteredMembers.filter(member => member.status === status)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredMembers = filteredMembers.filter(member => 
        member.firstName.toLowerCase().includes(searchTerm) ||
        member.lastName.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm) ||
        member.skills.some(skill => skill.toLowerCase().includes(searchTerm))
      )
    }

    // Apply sorting
    filteredMembers.sort((a, b) => {
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
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

    res.json({
      teamMembers: paginatedMembers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredMembers.length,
        pages: Math.ceil(filteredMembers.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
}

// GET /api/team/:id - Get a specific team member
export const getTeamMember = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const member = teamMembers.find(m => m.id === id)
    
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    
    res.json(member)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team member' })
  }
}

// POST /api/team - Create a new team member
export const createTeamMember = (req: Request, res: Response) => {
  try {
    const validatedData = teamMemberSchema.parse(req.body)
    
    const newMember = {
      id: `${validatedData.firstName.toLowerCase()}-${validatedData.lastName.toLowerCase()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {},
      permissions: validatedData.permissions || []
    }
    
    teamMembers.push(newMember)
    res.status(201).json(newMember)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create team member' })
  }
}

// PUT /api/team/:id - Update a team member
export const updateTeamMember = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const memberIndex = teamMembers.findIndex(m => m.id === id)
    
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    
    const validatedData = updateTeamMemberSchema.parse(req.body)
    
    teamMembers[memberIndex] = {
      ...teamMembers[memberIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(teamMembers[memberIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update team member' })
  }
}

// DELETE /api/team/:id - Delete a team member
export const deleteTeamMember = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const memberIndex = teamMembers.findIndex(m => m.id === id)
    
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    
    teamMembers.splice(memberIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team member' })
  }
}

// GET /api/team/stats - Get team statistics
export const getTeamStats = (req: Request, res: Response) => {
  try {
    const stats = {
      total: teamMembers.length,
      byStatus: {
        active: teamMembers.filter(m => m.status === 'active').length,
        inactive: teamMembers.filter(m => m.status === 'inactive').length,
        on_leave: teamMembers.filter(m => m.status === 'on_leave').length,
        terminated: teamMembers.filter(m => m.status === 'terminated').length
      },
      byRole: {
        admin: teamMembers.filter(m => m.role === 'admin').length,
        manager: teamMembers.filter(m => m.role === 'manager').length,
        developer: teamMembers.filter(m => m.role === 'developer').length,
        designer: teamMembers.filter(m => m.role === 'designer').length,
        qa: teamMembers.filter(m => m.role === 'qa').length,
        sales: teamMembers.filter(m => m.role === 'sales').length,
        marketing: teamMembers.filter(m => m.role === 'marketing').length,
        support: teamMembers.filter(m => m.role === 'support').length
      },
      byDepartment: {
        management: teamMembers.filter(m => m.department === 'management').length,
        development: teamMembers.filter(m => m.department === 'development').length,
        design: teamMembers.filter(m => m.department === 'design').length,
        qa: teamMembers.filter(m => m.department === 'qa').length,
        sales: teamMembers.filter(m => m.department === 'sales').length,
        marketing: teamMembers.filter(m => m.department === 'marketing').length,
        support: teamMembers.filter(m => m.department === 'support').length,
        hr: teamMembers.filter(m => m.department === 'hr').length
      },
      averageSalary: teamMembers.filter(m => m.salary).length > 0 ? 
        teamMembers.filter(m => m.salary).reduce((sum, m) => sum + (m.salary || 0), 0) / teamMembers.filter(m => m.salary).length : 0,
      averageHourlyRate: teamMembers.filter(m => m.hourlyRate).length > 0 ? 
        teamMembers.filter(m => m.hourlyRate).reduce((sum, m) => sum + (m.hourlyRate || 0), 0) / teamMembers.filter(m => m.hourlyRate).length : 0,
      totalPayroll: teamMembers.reduce((sum, m) => sum + (m.salary || 0), 0),
      skillsDistribution: getSkillsDistribution()
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team statistics' })
  }
}

// Helper function to get skills distribution
function getSkillsDistribution() {
  const skillsCount: { [key: string]: number } = {}
  
  teamMembers.forEach(member => {
    member.skills.forEach(skill => {
      skillsCount[skill] = (skillsCount[skill] || 0) + 1
    })
  })
  
  return Object.entries(skillsCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [skill, count]) => ({ ...obj, [skill]: count }), {})
}

// GET /api/team/:id/workload - Get team member workload
export const getTeamMemberWorkload = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const member = teamMembers.find(m => m.id === id)
    
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    
    // Mock workload data - in a real app, this would come from tasks/projects collections
    const workload = {
      currentTasks: Math.floor(Math.random() * 10) + 1,
      completedTasks: Math.floor(Math.random() * 50) + 10,
      activeProjects: Math.floor(Math.random() * 5) + 1,
      hoursThisWeek: Math.floor(Math.random() * 40) + 10,
      hoursThisMonth: Math.floor(Math.random() * 160) + 80,
      utilizationRate: Math.floor(Math.random() * 40) + 60, // 60-100%
      upcomingDeadlines: Math.floor(Math.random() * 5),
      overdueItems: Math.floor(Math.random() * 3)
    }
    
    res.json(workload)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workload' })
  }
}

// PUT /api/team/:id/permissions - Update team member permissions
export const updatePermissions = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { permissions } = req.body
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' })
    }
    
    const memberIndex = teamMembers.findIndex(m => m.id === id)
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    
    teamMembers[memberIndex].permissions = permissions
    teamMembers[memberIndex].updatedAt = new Date().toISOString()
    
    res.json({
      member: teamMembers[memberIndex],
      message: 'Permissions updated successfully'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permissions' })
  }
}

// GET /api/team/:id/performance - Get team member performance metrics
export const getPerformanceMetrics = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const member = teamMembers.find(m => m.id === id)
    
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    
    // Mock performance data - in a real app, this would be calculated from actual data
    const performance = {
      tasksCompleted: Math.floor(Math.random() * 50) + 20,
      tasksOnTime: Math.floor(Math.random() * 40) + 15,
      averageTaskRating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      clientSatisfaction: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      codeQuality: member.role === 'developer' ? (Math.random() * 2 + 3).toFixed(1) : null,
      designQuality: member.role === 'designer' ? (Math.random() * 2 + 3).toFixed(1) : null,
      communicationScore: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      teamworkScore: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      innovationScore: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      lastReviewDate: '2024-01-15',
      nextReviewDate: '2024-04-15',
      goals: [
        'Improve project delivery time by 15%',
        'Complete advanced certification',
        'Mentor junior team members'
      ],
      achievements: [
        'Successfully delivered 3 major projects',
        'Received client appreciation award',
        'Completed leadership training'
      ]
    }
    
    res.json(performance)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance metrics' })
  }
}

// POST /api/team/:id/time-off - Request time off
export const requestTimeOff = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate, type, reason } = req.body
    
    const member = teamMembers.find(m => m.id === id)
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' })
    }
    
    // In a real application, you would store time-off requests in a separate collection
    const timeOffRequest = {
      id: `timeoff-${Date.now()}`,
      employeeId: id,
      startDate,
      endDate,
      type, // vacation, sick, personal, etc.
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null
    }
    
    res.status(201).json(timeOffRequest)
  } catch (error) {
    res.status(500).json({ error: 'Failed to request time off' })
  }
}

// GET /api/team/directory - Get team directory (simplified view)
export const getTeamDirectory = (req: Request, res: Response) => {
  try {
    const directory = teamMembers
      .filter(m => m.status === 'active')
      .map(member => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        role: member.role,
        department: member.department,
        avatar: member.avatar,
        skills: member.skills.slice(0, 3) // Show only top 3 skills
      }))
    
    res.json(directory)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team directory' })
  }
}