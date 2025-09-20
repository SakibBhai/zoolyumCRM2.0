import { Request, Response } from 'express'
import { z } from 'zod'

// Client type definition
interface Client {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  industry: string
  website: string
  status: 'active' | 'inactive' | 'prospect' | 'churned'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  healthScore: number
  totalValue: number
  notes: string
  tags: string[]
  assignedTo: string
  contractStartDate: string
  contractEndDate: string
  createdAt: string
  updatedAt: string
  customFields: Record<string, any>
}

// Client validation schema
const clientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  industry: z.string().min(1, 'Industry is required'),
  website: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'prospect', 'churned']),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  healthScore: z.number().min(0).max(100),
  totalValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  customFields: z.record(z.any()).optional()
})

const updateClientSchema = clientSchema.partial()

// Mock data
let clients: Client[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    contactPerson: 'John Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1-555-0123',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    industry: 'Technology',
    website: 'https://techcorp.com',
    status: 'active',
    tier: 'gold',
    healthScore: 85,
    totalValue: 150000,
    notes: 'Long-term client with multiple projects. Very satisfied with our services.',
    tags: ['enterprise', 'long-term', 'high-value'],
    assignedTo: 'sarah-johnson',
    contractStartDate: '2023-01-15',
    contractEndDate: '2024-01-15',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    customFields: {
      employees: '500+',
      revenue: '$10M+',
      decisionMaker: 'John Smith'
    }
  },
  {
    id: '2',
    name: 'Marketing Pro',
    contactPerson: 'Sarah Johnson',
    email: 'sarah.johnson@marketingpro.com',
    phone: '+1-555-0124',
    address: {
      street: '456 Marketing Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    industry: 'Marketing',
    website: 'https://marketingpro.com',
    status: 'active',
    tier: 'silver',
    healthScore: 72,
    totalValue: 75000,
    notes: 'Growing agency with increasing needs. Good potential for upselling.',
    tags: ['growing', 'marketing', 'upsell-potential'],
    assignedTo: 'mike-wilson',
    contractStartDate: '2023-06-01',
    contractEndDate: '2024-06-01',
    createdAt: '2023-06-01T09:15:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    customFields: {
      employees: '50-100',
      revenue: '$1M-5M',
      decisionMaker: 'Sarah Johnson'
    }
  },
  {
    id: '3',
    name: 'Startup.io',
    contactPerson: 'Michael Brown',
    email: 'michael.brown@startup.io',
    phone: '+1-555-0125',
    address: {
      street: '789 Innovation Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '73301',
      country: 'USA'
    },
    industry: 'Technology',
    website: 'https://startup.io',
    status: 'prospect',
    tier: 'bronze',
    healthScore: 45,
    totalValue: 25000,
    notes: 'Early stage startup. Budget constraints but high growth potential.',
    tags: ['startup', 'budget-conscious', 'high-potential'],
    assignedTo: 'lisa-chen',
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    createdAt: '2024-01-01T11:30:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
    customFields: {
      employees: '1-10',
      revenue: '$100K-500K',
      decisionMaker: 'Michael Brown'
    }
  },
  {
    id: '4',
    name: 'Global Enterprises',
    contactPerson: 'Emily Davis',
    email: 'emily.davis@globalent.com',
    phone: '+1-555-0126',
    address: {
      street: '321 Corporate Plaza',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    industry: 'Manufacturing',
    website: 'https://globalenterprises.com',
    status: 'inactive',
    tier: 'platinum',
    healthScore: 30,
    totalValue: 300000,
    notes: 'Contract ended. Relationship strained due to project delays.',
    tags: ['enterprise', 'churned', 'high-value'],
    assignedTo: 'david-kim',
    contractStartDate: '2022-03-01',
    contractEndDate: '2023-12-31',
    createdAt: '2022-03-01T08:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    customFields: {
      employees: '1000+',
      revenue: '$100M+',
      decisionMaker: 'Emily Davis'
    }
  }
]

// GET /api/clients - Get all clients with filtering and pagination
export const getClients = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      tier,
      industry,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let filteredClients = [...clients]

    // Apply filters
    if (status) {
      filteredClients = filteredClients.filter(client => client.status === status)
    }
    if (tier) {
      filteredClients = filteredClients.filter(client => client.tier === tier)
    }
    if (industry) {
      filteredClients = filteredClients.filter(client => client.industry === industry)
    }
    if (assignedTo) {
      filteredClients = filteredClients.filter(client => client.assignedTo === assignedTo)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredClients = filteredClients.filter(client => 
        client.name.toLowerCase().includes(searchTerm) ||
        client.contactPerson.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm) ||
        (client.industry && client.industry.toLowerCase().includes(searchTerm))
      )
    }

    // Apply sorting
    filteredClients.sort((a, b) => {
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
    const paginatedClients = filteredClients.slice(startIndex, endIndex)

    res.json({
      clients: paginatedClients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredClients.length,
        pages: Math.ceil(filteredClients.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
}

// GET /api/clients/:id - Get a specific client
export const getClient = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const client = clients.find(c => c.id === id)
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    res.json(client)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client' })
  }
}

// POST /api/clients - Create a new client
export const createClient = (req: Request, res: Response) => {
  try {
    const validatedData = clientSchema.parse(req.body)
    
    const newClient = {
      id: (clients.length + 1).toString(),
      name: validatedData.name,
      contactPerson: validatedData.contactPerson,
      email: validatedData.email,
      phone: validatedData.phone,
      address: {
        street: validatedData.address?.street || '',
        city: validatedData.address?.city || '',
        state: validatedData.address?.state || '',
        zipCode: validatedData.address?.zipCode || '',
        country: validatedData.address?.country || ''
      },
      industry: validatedData.industry,
      website: validatedData.website || '',
      status: validatedData.status,
      tier: validatedData.tier,
      healthScore: validatedData.healthScore,
      totalValue: validatedData.totalValue || 0,
      notes: validatedData.notes || '',
      tags: validatedData.tags || [],
      assignedTo: validatedData.assignedTo || '',
      contractStartDate: validatedData.contractStartDate || '',
      contractEndDate: validatedData.contractEndDate || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {}
    }
    
    clients.push(newClient)
    res.status(201).json(newClient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create client' })
  }
}

// PUT /api/clients/:id - Update a client
export const updateClient = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const clientIndex = clients.findIndex(c => c.id === id)
    
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    const validatedData = updateClientSchema.parse(req.body)
    
    const updatedClient: Client = {
      ...clients[clientIndex],
      ...validatedData,
      address: validatedData.address ? {
        street: validatedData.address.street || clients[clientIndex].address.street,
        city: validatedData.address.city || clients[clientIndex].address.city,
        state: validatedData.address.state || clients[clientIndex].address.state,
        zipCode: validatedData.address.zipCode || clients[clientIndex].address.zipCode,
        country: validatedData.address.country || clients[clientIndex].address.country
      } : clients[clientIndex].address,
      updatedAt: new Date().toISOString()
    }
    
    clients[clientIndex] = updatedClient
    
    res.json(clients[clientIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update client' })
  }
}

// DELETE /api/clients/:id - Delete a client
export const deleteClient = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const clientIndex = clients.findIndex(c => c.id === id)
    
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    clients.splice(clientIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' })
  }
}

// GET /api/clients/stats - Get client statistics
export const getClientStats = (req: Request, res: Response) => {
  try {
    const stats = {
      total: clients.length,
      byStatus: {
        active: clients.filter(c => c.status === 'active').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
        prospect: clients.filter(c => c.status === 'prospect').length,
        churned: clients.filter(c => c.status === 'churned').length
      },
      byTier: {
        bronze: clients.filter(c => c.tier === 'bronze').length,
        silver: clients.filter(c => c.tier === 'silver').length,
        gold: clients.filter(c => c.tier === 'gold').length,
        platinum: clients.filter(c => c.tier === 'platinum').length
      },
      totalValue: clients.reduce((sum, client) => sum + (client.totalValue || 0), 0),
      averageValue: clients.length > 0 ? clients.reduce((sum, client) => sum + (client.totalValue || 0), 0) / clients.length : 0,
      averageHealthScore: clients.length > 0 ? clients.reduce((sum, client) => sum + client.healthScore, 0) / clients.length : 0,
      healthDistribution: {
        excellent: clients.filter(c => c.healthScore >= 80).length,
        good: clients.filter(c => c.healthScore >= 60 && c.healthScore < 80).length,
        fair: clients.filter(c => c.healthScore >= 40 && c.healthScore < 60).length,
        poor: clients.filter(c => c.healthScore < 40).length
      }
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client statistics' })
  }
}

// PUT /api/clients/:id/health-score - Update client health score
export const updateHealthScore = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { healthScore, reason } = req.body
    
    if (typeof healthScore !== 'number' || healthScore < 0 || healthScore > 100) {
      return res.status(400).json({ error: 'Health score must be a number between 0 and 100' })
    }
    
    const clientIndex = clients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    const oldScore = clients[clientIndex].healthScore
    clients[clientIndex].healthScore = healthScore
    clients[clientIndex].updatedAt = new Date().toISOString()
    
    // In a real application, you would log this change
    const healthScoreUpdate = {
      clientId: id,
      oldScore,
      newScore: healthScore,
      reason: reason || 'Manual update',
      updatedAt: new Date().toISOString()
    }
    
    res.json({
      client: clients[clientIndex],
      healthScoreUpdate
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update health score' })
  }
}

// GET /api/clients/:id/projects - Get projects for a client
export const getClientProjects = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const client = clients.find(c => c.id === id)
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    // Mock projects data - in a real app, this would come from a projects collection
    const projects = [
      {
        id: '1',
        name: 'Website Redesign',
        status: 'in_progress',
        startDate: '2024-01-01',
        endDate: '2024-03-01',
        budget: 50000,
        progress: 65
      },
      {
        id: '2',
        name: 'Mobile App Development',
        status: 'planning',
        startDate: '2024-02-15',
        endDate: '2024-06-15',
        budget: 100000,
        progress: 10
      }
    ].filter(() => Math.random() > 0.5) // Randomly show some projects
    
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client projects' })
  }
}

// POST /api/clients/:id/notes - Add note to client
export const addClientNote = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content, type = 'general' } = req.body
    
    const client = clients.find(c => c.id === id)
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    // In a real application, you would store notes in a separate collection
    const note = {
      id: `note-${Date.now()}`,
      clientId: id,
      content,
      type,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user' // In a real app, this would come from auth
    }
    
    res.status(201).json(note)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' })
  }
}