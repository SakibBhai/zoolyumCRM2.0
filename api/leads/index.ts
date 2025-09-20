import { Request, Response } from 'express'
import { z } from 'zod'

// Lead interface
interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: string
  status: string
  priority: string
  value?: number
  notes?: string
  tags?: string[]
  assignedTo?: string
  expectedCloseDate?: string
  lastContactDate?: string | null
  nextFollowUpDate?: string
  createdAt: string
  updatedAt: string
  customFields?: Record<string, any>
}

// Lead validation schema
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['website', 'referral', 'social', 'email', 'phone', 'event', 'other']),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  value: z.number().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  lastContactDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  customFields: z.record(z.any()).optional()
})

const updateLeadSchema = leadSchema.partial()

// Mock data
let leads: Lead[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1-555-0123',
    company: 'TechCorp Solutions',
    position: 'CTO',
    source: 'website',
    status: 'qualified',
    priority: 'high',
    value: 50000,
    notes: 'Interested in enterprise solution. Needs demo next week.',
    tags: ['enterprise', 'hot-lead'],
    assignedTo: 'sarah-johnson',
    expectedCloseDate: '2024-02-15',
    lastContactDate: '2024-01-20',
    nextFollowUpDate: '2024-01-27',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    customFields: {
      industry: 'Technology',
      employees: '500+',
      budget: '$50k-100k'
    }
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@marketingpro.com',
    phone: '+1-555-0124',
    company: 'Marketing Pro',
    position: 'Marketing Director',
    source: 'referral',
    status: 'contacted',
    priority: 'medium',
    value: 25000,
    notes: 'Referred by existing client. Looking for marketing automation.',
    tags: ['referral', 'marketing'],
    assignedTo: 'mike-wilson',
    expectedCloseDate: '2024-02-28',
    lastContactDate: '2024-01-18',
    nextFollowUpDate: '2024-01-25',
    createdAt: '2024-01-12T09:15:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    customFields: {
      industry: 'Marketing',
      employees: '50-100',
      budget: '$20k-30k'
    }
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@startup.io',
    phone: '+1-555-0125',
    company: 'Startup.io',
    position: 'Founder',
    source: 'social',
    status: 'new',
    priority: 'low',
    value: 10000,
    notes: 'Early stage startup. Budget constraints.',
    tags: ['startup', 'budget-conscious'],
    assignedTo: 'lisa-chen',
    expectedCloseDate: '2024-03-15',
    lastContactDate: null,
    nextFollowUpDate: '2024-01-26',
    createdAt: '2024-01-22T11:30:00Z',
    updatedAt: '2024-01-22T11:30:00Z',
    customFields: {
      industry: 'Technology',
      employees: '1-10',
      budget: '$5k-15k'
    }
  }
]

// GET /api/leads - Get all leads with filtering and pagination
export const getLeads = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      priority,
      source,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let filteredLeads = [...leads]

    // Apply filters
    if (status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === status)
    }
    if (priority) {
      filteredLeads = filteredLeads.filter(lead => lead.priority === priority)
    }
    if (source) {
      filteredLeads = filteredLeads.filter(lead => lead.source === source)
    }
    if (assignedTo) {
      filteredLeads = filteredLeads.filter(lead => lead.assignedTo === assignedTo)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredLeads = filteredLeads.filter(lead => 
        lead.firstName.toLowerCase().includes(searchTerm) ||
        lead.lastName.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm))
      )
    }

    // Apply sorting
    filteredLeads.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a]
      const bValue = b[sortBy as keyof typeof b]
      
      if (!aValue || !bValue) return 0

      
      

      
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
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex)

    res.json({
      leads: paginatedLeads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredLeads.length,
        pages: Math.ceil(filteredLeads.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' })
  }
}

// GET /api/leads/:id - Get a specific lead
export const getLead = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const lead = leads.find(l => l.id === id)
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    
    res.json(lead)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' })
  }
}

// POST /api/leads - Create a new lead
export const createLead = (req: Request, res: Response) => {
  try {
    const validatedData = leadSchema.parse(req.body)
    
    const newLead = {
      id: (leads.length + 1).toString(),
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastContactDate: null,
      customFields: validatedData.customFields || {}
    }
    
    leads.push(newLead)
    res.status(201).json(newLead)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create lead' })
  }
}

// PUT /api/leads/:id - Update a lead
export const updateLead = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const leadIndex = leads.findIndex(l => l.id === id)
    
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    
    const validatedData = updateLeadSchema.parse(req.body)
    
    leads[leadIndex] = {
      ...leads[leadIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(leads[leadIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update lead' })
  }
}

// DELETE /api/leads/:id - Delete a lead
export const deleteLead = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const leadIndex = leads.findIndex(l => l.id === id)
    
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    
    leads.splice(leadIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' })
  }
}

// POST /api/leads/:id/convert - Convert lead to client
export const convertLead = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const leadIndex = leads.findIndex(l => l.id === id)
    
    if (leadIndex === -1) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    
    const lead = leads[leadIndex]
    
    // Update lead status to converted
    leads[leadIndex] = {
      ...lead,
      status: 'closed_won',
      updatedAt: new Date().toISOString()
    }
    
    // In a real application, you would create a client record here
    const newClient = {
      id: `client-${Date.now()}`,
      name: lead.company || `${lead.firstName} ${lead.lastName}`,
      contactPerson: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      status: 'active',
      createdAt: new Date().toISOString(),
      convertedFromLead: lead.id
    }
    
    res.json({
      lead: leads[leadIndex],
      client: newClient,
      message: 'Lead successfully converted to client'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to convert lead' })
  }
}

// GET /api/leads/stats - Get lead statistics
export const getLeadStats = (req: Request, res: Response) => {
  try {
    const stats = {
      total: leads.length,
      byStatus: {
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        proposal: leads.filter(l => l.status === 'proposal').length,
        negotiation: leads.filter(l => l.status === 'negotiation').length,
        closed_won: leads.filter(l => l.status === 'closed_won').length,
        closed_lost: leads.filter(l => l.status === 'closed_lost').length
      },
      byPriority: {
        low: leads.filter(l => l.priority === 'low').length,
        medium: leads.filter(l => l.priority === 'medium').length,
        high: leads.filter(l => l.priority === 'high').length,
        urgent: leads.filter(l => l.priority === 'urgent').length
      },
      bySource: {
        website: leads.filter(l => l.source === 'website').length,
        referral: leads.filter(l => l.source === 'referral').length,
        social: leads.filter(l => l.source === 'social').length,
        email: leads.filter(l => l.source === 'email').length,
        phone: leads.filter(l => l.source === 'phone').length,
        event: leads.filter(l => l.source === 'event').length,
        other: leads.filter(l => l.source === 'other').length
      },
      totalValue: leads.reduce((sum, lead) => sum + (lead.value || 0), 0),
      averageValue: leads.length > 0 ? leads.reduce((sum, lead) => sum + (lead.value || 0), 0) / leads.length : 0,
      conversionRate: leads.length > 0 ? (leads.filter(l => l.status === 'closed_won').length / leads.length) * 100 : 0
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead statistics' })
  }
}

// POST /api/leads/:id/activities - Add activity to lead
export const addLeadActivity = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { type, description, date } = req.body
    
    const lead = leads.find(l => l.id === id)
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    
    // In a real application, you would store activities in a separate collection
    const activity = {
      id: `activity-${Date.now()}`,
      leadId: id,
      type,
      description,
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    
    // Update last contact date if it's a contact activity
    if (type === 'call' || type === 'email' || type === 'meeting') {
      const leadIndex = leads.findIndex(l => l.id === id)
      leads[leadIndex].lastContactDate = activity.date
      leads[leadIndex].updatedAt = new Date().toISOString()
    }
    
    res.status(201).json(activity)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add activity' })
  }
}