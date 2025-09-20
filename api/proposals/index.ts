import { Request, Response } from 'express'
import { z } from 'zod'

// Proposal interface
interface Proposal {
  id: string
  title: string
  description?: string
  clientId: string
  clientName?: string
  projectType?: string
  status: string
  value?: number
  validUntil: string
  createdBy?: string
  scope?: string[]
  timeline?: {
    startDate: string
    endDate: string
    milestones?: {
      name: string
      date: string
      deliverables: string[]
    }[]
  }
  budget?: {
    amount: number
    currency: string
    breakdown?: {
      item: string
      quantity: number
      rate: number
      total: number
    }[]
  }
  items?: {
    name: string
    description?: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  terms: {
    paymentTerms: string
    deliveryTerms: string
    revisions: number
    warranty?: string
    cancellation?: string
  }
  notes?: string
  attachments?: string[]
  sentAt?: string
  viewedAt?: string
  acceptedAt?: string
  createdAt: string
  updatedAt: string
  customFields?: Record<string, any>
}


// Invoice interface
interface Invoice {
  id: string
  clientId: string
  projectId?: string
  proposalId?: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  items: {
    description: string
    quantity: number
    rate: number
    total: number
  }[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountRate?: number
  discountAmount?: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  paymentTerms: string
  notes?: string
  attachments?: string[]
  sentAt?: string
  viewedAt?: string
  paidAt?: string
  paymentMethod?: string
  createdAt: string
  updatedAt: string
  customFields?: Record<string, any>
}

// Proposal validation schema
const proposalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  projectType: z.enum(['web_development', 'mobile_app', 'design', 'consulting', 'marketing', 'other']),
  description: z.string().min(1, 'Description is required'),
  scope: z.array(z.string()).min(1, 'At least one scope item is required'),
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string(),
    milestones: z.array(z.object({
      name: z.string(),
      date: z.string(),
      deliverables: z.array(z.string())
    })).optional()
  }),
  budget: z.object({
    amount: z.number().min(0),
    currency: z.string().default('USD'),
    breakdown: z.array(z.object({
      item: z.string(),
      quantity: z.number().min(1),
      rate: z.number().min(0),
      total: z.number().min(0)
    })).optional()
  }),
  terms: z.object({
    paymentTerms: z.string(),
    deliveryTerms: z.string(),
    revisions: z.number().min(0),
    warranty: z.string().optional(),
    cancellation: z.string().optional()
  }),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).default('draft'),
  validUntil: z.string(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateProposalSchema = proposalSchema.partial()

// Invoice validation schema
const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  projectId: z.string().optional(),
  proposalId: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    rate: z.number().min(0),
    total: z.number().min(0)
  })).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().min(0),
  discountRate: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  total: z.number().min(0),
  currency: z.string().default('USD'),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).default('draft'),
  paymentTerms: z.string(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateInvoiceSchema = invoiceSchema.partial()

// Mock data
let invoices: Invoice[] = [
  {
    id: 'inv-001',
    clientId: 'acme-corp',
    projectId: 'proj-001',
    proposalId: 'prop-001',
    invoiceNumber: 'INV-2024-001',
    issueDate: '2024-01-20',
    dueDate: '2024-02-19',
    items: [
      {
        description: 'E-commerce Website Development - Upfront Payment (50%)',
        quantity: 1,
        rate: 22500,
        total: 22500
      }
    ],
    subtotal: 22500,
    taxRate: 10,
    taxAmount: 2250,
    discountRate: 0,
    discountAmount: 0,
    total: 24750,
    currency: 'USD',
    status: 'sent',
    paymentTerms: 'Net 30 days',
    notes: 'Upfront payment for e-commerce website development project',
    attachments: ['invoice-001.pdf'],
    createdAt: '2024-01-20T15:00:00Z',
    updatedAt: '2024-01-20T15:00:00Z',
    sentAt: '2024-01-20T15:00:00Z',
    customFields: {
      poNumber: 'PO-2024-001',
      department: 'IT',
      approvedBy: 'John Smith'
    }
  },
  {
    id: 'inv-002',
    clientId: 'tech-startup',
    projectId: 'proj-002',
    proposalId: 'prop-002',
    invoiceNumber: 'INV-2024-002',
    issueDate: '2024-01-25',
    dueDate: '2024-02-24',
    items: [
      {
        description: 'Mobile App Development - Milestone 1',
        quantity: 1,
        rate: 22500,
        total: 22500
      }
    ],
    subtotal: 22500,
    taxRate: 8,
    taxAmount: 1800,
    discountRate: 5,
    discountAmount: 1125,
    total: 23175,
    currency: 'USD',
    status: 'paid',
    paymentTerms: 'Net 30 days',
    notes: 'Initial payment for mobile app development project',
    attachments: ['invoice-002.pdf'],
    createdAt: '2024-01-25T14:30:00Z',
    updatedAt: '2024-02-05T09:15:00Z',
    sentAt: '2024-01-25T14:30:00Z',
    paidAt: '2024-02-05T09:15:00Z',
    paymentMethod: 'Bank Transfer',
    customFields: {
      poNumber: 'PO-2024-002',
      department: 'Product',
      approvedBy: 'Jane Doe'
    }
  },
  {
    id: 'inv-003',
    clientId: 'local-business',
    projectId: 'proj-003',
    proposalId: 'prop-003',
    invoiceNumber: 'INV-2024-003',
    issueDate: '2024-01-28',
    dueDate: '2024-02-27',
    items: [
      {
        description: 'Brand Identity & Website Redesign - Upfront Payment (50%)',
        quantity: 1,
        rate: 12500,
        total: 12500
      }
    ],
    subtotal: 12500,
    taxRate: 8.5,
    taxAmount: 1062.50,
    discountRate: 0,
    discountAmount: 0,
    total: 13562.50,
    currency: 'USD',
    status: 'viewed',
    paymentTerms: 'Net 30 days',
    notes: 'Upfront payment for brand identity and website redesign project',
    attachments: ['invoice-003.pdf'],
    createdAt: '2024-01-28T16:45:00Z',
    updatedAt: '2024-02-02T11:30:00Z',
    sentAt: '2024-01-28T16:45:00Z',
    viewedAt: '2024-02-02T11:30:00Z',
    customFields: {
      department: 'Marketing',
      approvedBy: 'Bob Wilson'
    }
  }
]

let proposals: Proposal[] = [
  {
    id: 'prop-001',
    title: 'E-commerce Website Development',
    clientId: 'acme-corp',
    projectType: 'web_development',
    description: 'Complete e-commerce website with payment integration, inventory management, and admin dashboard.',
    scope: [
      'Custom website design and development',
      'Payment gateway integration',
      'Inventory management system',
      'Admin dashboard',
      'Mobile responsive design',
      'SEO optimization',
      '3 months support and maintenance'
    ],
    timeline: {
      startDate: '2024-02-15',
      endDate: '2024-05-15',
      milestones: [
        {
          name: 'Design Phase',
          date: '2024-03-01',
          deliverables: ['Wireframes', 'UI/UX Design', 'Style Guide']
        },
        {
          name: 'Development Phase 1',
          date: '2024-04-01',
          deliverables: ['Frontend Development', 'Backend API', 'Database Setup']
        },
        {
          name: 'Development Phase 2',
          date: '2024-04-30',
          deliverables: ['Payment Integration', 'Admin Dashboard', 'Testing']
        },
        {
          name: 'Launch',
          date: '2024-05-15',
          deliverables: ['Deployment', 'Training', 'Documentation']
        }
      ]
    },
    budget: {
      amount: 45000,
      currency: 'USD',
      breakdown: [
        { item: 'UI/UX Design', quantity: 1, rate: 8000, total: 8000 },
        { item: 'Frontend Development', quantity: 1, rate: 15000, total: 15000 },
        { item: 'Backend Development', quantity: 1, rate: 12000, total: 12000 },
        { item: 'Payment Integration', quantity: 1, rate: 5000, total: 5000 },
        { item: 'Testing & QA', quantity: 1, rate: 3000, total: 3000 },
        { item: 'Support (3 months)', quantity: 1, rate: 2000, total: 2000 }
      ]
    },
    terms: {
      paymentTerms: '50% upfront, 25% at milestone 2, 25% on completion',
      deliveryTerms: 'All deliverables will be provided via secure client portal',
      revisions: 3,
      warranty: '90 days warranty on all development work',
      cancellation: '30 days notice required for project cancellation'
    },
    status: 'sent',
    validUntil: '2024-03-01',
    notes: 'Client requested additional SEO optimization features',
    attachments: ['wireframes.pdf', 'technical-specs.pdf'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    sentAt: '2024-01-20T14:30:00Z',
    customFields: {
      salesRep: 'Sarah Johnson',
      priority: 'high',
      source: 'referral'
    }
  },
  {
    id: 'prop-002',
    title: 'Mobile App Development',
    clientId: 'tech-startup',
    projectType: 'mobile_app',
    description: 'Cross-platform mobile application for iOS and Android with real-time features.',
    scope: [
      'Cross-platform mobile app development',
      'Real-time messaging',
      'Push notifications',
      'User authentication',
      'Cloud backend integration',
      'App store deployment',
      '6 months support'
    ],
    timeline: {
      startDate: '2024-03-01',
      endDate: '2024-07-01',
      milestones: [
        {
          name: 'Planning & Design',
          date: '2024-03-15',
          deliverables: ['App Architecture', 'UI/UX Design', 'Prototype']
        },
        {
          name: 'Core Development',
          date: '2024-05-01',
          deliverables: ['Core Features', 'Authentication', 'Backend API']
        },
        {
          name: 'Advanced Features',
          date: '2024-06-15',
          deliverables: ['Real-time Features', 'Push Notifications', 'Testing']
        },
        {
          name: 'Deployment',
          date: '2024-07-01',
          deliverables: ['App Store Submission', 'Documentation', 'Training']
        }
      ]
    },
    budget: {
      amount: 65000,
      currency: 'USD',
      breakdown: [
        { item: 'App Design', quantity: 1, rate: 10000, total: 10000 },
        { item: 'iOS Development', quantity: 1, rate: 20000, total: 20000 },
        { item: 'Android Development', quantity: 1, rate: 20000, total: 20000 },
        { item: 'Backend Development', quantity: 1, rate: 10000, total: 10000 },
        { item: 'Testing & QA', quantity: 1, rate: 3000, total: 3000 },
        { item: 'Support (6 months)', quantity: 1, rate: 2000, total: 2000 }
      ]
    },
    terms: {
      paymentTerms: '40% upfront, 30% at milestone 2, 30% on completion',
      deliveryTerms: 'Source code and documentation provided upon final payment',
      revisions: 5,
      warranty: '6 months warranty on all development work',
      cancellation: '45 days notice required for project cancellation'
    },
    status: 'viewed',
    validUntil: '2024-02-28',
    notes: 'Client interested in additional analytics features',
    attachments: ['app-mockups.pdf', 'technical-requirements.pdf'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T11:15:00Z',
    sentAt: '2024-01-22T10:00:00Z',
    viewedAt: '2024-01-25T11:15:00Z',
    customFields: {
      salesRep: 'Mike Wilson',
      priority: 'medium',
      source: 'website'
    }
  },
  {
    id: 'prop-003',
    title: 'Brand Identity & Website Redesign',
    clientId: 'local-business',
    projectType: 'design',
    description: 'Complete brand identity redesign with new website to reflect modern business values.',
    scope: [
      'Brand identity design',
      'Logo design and variations',
      'Website redesign',
      'Marketing materials',
      'Brand guidelines',
      'Social media templates'
    ],
    timeline: {
      startDate: '2024-02-01',
      endDate: '2024-04-01',
      milestones: [
        {
          name: 'Brand Discovery',
          date: '2024-02-10',
          deliverables: ['Brand Strategy', 'Mood Board', 'Concept Direction']
        },
        {
          name: 'Brand Design',
          date: '2024-02-25',
          deliverables: ['Logo Design', 'Color Palette', 'Typography']
        },
        {
          name: 'Website Design',
          date: '2024-03-15',
          deliverables: ['Website Mockups', 'Responsive Design', 'Style Guide']
        },
        {
          name: 'Final Delivery',
          date: '2024-04-01',
          deliverables: ['Brand Guidelines', 'Website Files', 'Marketing Templates']
        }
      ]
    },
    budget: {
      amount: 25000,
      currency: 'USD',
      breakdown: [
        { item: 'Brand Strategy & Research', quantity: 1, rate: 3000, total: 3000 },
        { item: 'Logo Design', quantity: 1, rate: 5000, total: 5000 },
        { item: 'Brand Identity System', quantity: 1, rate: 7000, total: 7000 },
        { item: 'Website Design', quantity: 1, rate: 8000, total: 8000 },
        { item: 'Marketing Materials', quantity: 1, rate: 2000, total: 2000 }
      ]
    },
    terms: {
      paymentTerms: '50% upfront, 50% on completion',
      deliveryTerms: 'All files provided in multiple formats',
      revisions: 4,
      warranty: '60 days warranty on design work',
      cancellation: '14 days notice required'
    },
    status: 'accepted',
    validUntil: '2024-02-15',
    notes: 'Client approved initial concepts, ready to proceed',
    attachments: ['brand-concepts.pdf'],
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-28T16:45:00Z',
    sentAt: '2024-01-18T09:30:00Z',
    viewedAt: '2024-01-20T10:15:00Z',
    acceptedAt: '2024-01-28T16:45:00Z',
    customFields: {
      salesRep: 'Lisa Chen',
      priority: 'high',
      source: 'cold_outreach'
    }
  }
]

// Duplicate invoices array removed - using the typed version above

// GET /api/proposals - Get all proposals with filtering and pagination
export const getProposals = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      clientId,
      projectType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let filteredProposals = [...proposals]

    // Apply filters
    if (status) {
      filteredProposals = filteredProposals.filter(proposal => proposal.status === status)
    }
    if (clientId) {
      filteredProposals = filteredProposals.filter(proposal => proposal.clientId === clientId)
    }
    if (projectType) {
      filteredProposals = filteredProposals.filter(proposal => proposal.projectType === projectType)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredProposals = filteredProposals.filter(proposal => 
        proposal.title.toLowerCase().includes(searchTerm) ||
        (proposal.description && proposal.description.toLowerCase().includes(searchTerm))
      )
    }

    // Apply sorting
    filteredProposals.sort((a, b) => {
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
    const paginatedProposals = filteredProposals.slice(startIndex, endIndex)

    res.json({
      proposals: paginatedProposals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredProposals.length,
        pages: Math.ceil(filteredProposals.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proposals' })
  }
}

// GET /api/proposals/:id - Get a specific proposal
export const getProposal = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const proposal = proposals.find(p => p.id === id)
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' })
    }
    
    res.json(proposal)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proposal' })
  }
}

// POST /api/proposals - Create a new proposal
export const createProposal = (req: Request, res: Response) => {
  try {
    const validatedData = proposalSchema.parse(req.body)
    
    const newProposal = {
      id: `prop-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {}
    }
    
    proposals.push(newProposal)
    res.status(201).json(newProposal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create proposal' })
  }
}

// PUT /api/proposals/:id - Update a proposal
export const updateProposal = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const proposalIndex = proposals.findIndex(p => p.id === id)
    
    if (proposalIndex === -1) {
      return res.status(404).json({ error: 'Proposal not found' })
    }
    
    const validatedData = updateProposalSchema.parse(req.body)
    
    proposals[proposalIndex] = {
      ...proposals[proposalIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(proposals[proposalIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update proposal' })
  }
}

// DELETE /api/proposals/:id - Delete a proposal
export const deleteProposal = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const proposalIndex = proposals.findIndex(p => p.id === id)
    
    if (proposalIndex === -1) {
      return res.status(404).json({ error: 'Proposal not found' })
    }
    
    proposals.splice(proposalIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete proposal' })
  }
}

// GET /api/invoices - Get all invoices with filtering and pagination
export const getInvoices = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      clientId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let filteredInvoices = [...invoices]

    // Apply filters
    if (status) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status)
    }
    if (clientId) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.clientId === clientId)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.items.some(item => item.description.toLowerCase().includes(searchTerm))
      )
    }

    // Apply sorting
    filteredInvoices.sort((a, b) => {
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
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

    res.json({
      invoices: paginatedInvoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredInvoices.length,
        pages: Math.ceil(filteredInvoices.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
}

// GET /api/invoices/:id - Get a specific invoice
export const getInvoice = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const invoice = invoices.find(i => i.id === id)
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    res.json(invoice)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' })
  }
}

// POST /api/invoices - Create a new invoice
export const createInvoice = (req: Request, res: Response) => {
  try {
    const validatedData = invoiceSchema.parse(req.body)
    
    const newInvoice = {
      id: `inv-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {}
    }
    
    invoices.push(newInvoice)
    res.status(201).json(newInvoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create invoice' })
  }
}

// PUT /api/invoices/:id - Update an invoice
export const updateInvoice = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const invoiceIndex = invoices.findIndex(i => i.id === id)
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    const validatedData = updateInvoiceSchema.parse(req.body)
    
    invoices[invoiceIndex] = {
      ...invoices[invoiceIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(invoices[invoiceIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update invoice' })
  }
}

// DELETE /api/invoices/:id - Delete an invoice
export const deleteInvoice = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const invoiceIndex = invoices.findIndex(i => i.id === id)
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    invoices.splice(invoiceIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
}

// GET /api/proposals/stats - Get proposal statistics
export const getProposalStats = (req: Request, res: Response) => {
  try {
    const stats = {
      total: proposals.length,
      byStatus: {
        draft: proposals.filter(p => p.status === 'draft').length,
        sent: proposals.filter(p => p.status === 'sent').length,
        viewed: proposals.filter(p => p.status === 'viewed').length,
        accepted: proposals.filter(p => p.status === 'accepted').length,
        rejected: proposals.filter(p => p.status === 'rejected').length,
        expired: proposals.filter(p => p.status === 'expired').length
      },
      totalValue: proposals.reduce((sum, p) => sum + (p.budget?.amount || 0), 0),
      averageValue: proposals.length > 0 ? proposals.reduce((sum, p) => sum + (p.budget?.amount || 0), 0) / proposals.length : 0,
      conversionRate: proposals.length > 0 ? (proposals.filter(p => p.status === 'accepted').length / proposals.length) * 100 : 0,
      pendingValue: proposals.filter(p => ['sent', 'viewed'].includes(p.status)).reduce((sum, p) => sum + (p.budget?.amount || 0), 0)
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proposal statistics' })
  }
}

// GET /api/invoices/stats - Get invoice statistics
export const getInvoiceStats = (req: Request, res: Response) => {
  try {
    const stats = {
      total: invoices.length,
      byStatus: {
        draft: invoices.filter(i => i.status === 'draft').length,
        sent: invoices.filter(i => i.status === 'sent').length,
        viewed: invoices.filter(i => i.status === 'viewed').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
        cancelled: invoices.filter(i => i.status === 'cancelled').length
      },
      totalValue: invoices.reduce((sum, i) => sum + i.total, 0),
      paidValue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
      pendingValue: invoices.filter(i => ['sent', 'viewed'].includes(i.status)).reduce((sum, i) => sum + i.total, 0),
      overdueValue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0),
      averageValue: invoices.length > 0 ? invoices.reduce((sum, i) => sum + i.total, 0) / invoices.length : 0,
      paymentRate: invoices.length > 0 ? (invoices.filter(i => i.status === 'paid').length / invoices.length) * 100 : 0
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice statistics' })
  }
}

// POST /api/proposals/:id/send - Send a proposal
export const sendProposal = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const proposalIndex = proposals.findIndex(p => p.id === id)
    
    if (proposalIndex === -1) {
      return res.status(404).json({ error: 'Proposal not found' })
    }
    
    proposals[proposalIndex].status = 'sent'
    proposals[proposalIndex].sentAt = new Date().toISOString()
    proposals[proposalIndex].updatedAt = new Date().toISOString()
    
    res.json({
      proposal: proposals[proposalIndex],
      message: 'Proposal sent successfully'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to send proposal' })
  }
}

// POST /api/invoices/:id/send - Send an invoice
export const sendInvoice = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const invoiceIndex = invoices.findIndex(i => i.id === id)
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    invoices[invoiceIndex].status = 'sent'
    invoices[invoiceIndex].sentAt = new Date().toISOString()
    invoices[invoiceIndex].updatedAt = new Date().toISOString()
    
    res.json({
      invoice: invoices[invoiceIndex],
      message: 'Invoice sent successfully'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to send invoice' })
  }
}

// POST /api/invoices/:id/mark-paid - Mark an invoice as paid
export const markInvoicePaid = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { paymentMethod, paymentDate, notes } = req.body
    
    const invoiceIndex = invoices.findIndex(i => i.id === id)
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ error: 'Invoice not found' })
    }
    
    invoices[invoiceIndex].status = 'paid'
    invoices[invoiceIndex].paidAt = paymentDate || new Date().toISOString()
    invoices[invoiceIndex].paymentMethod = paymentMethod
    if (notes) {
      invoices[invoiceIndex].notes = notes
    }
    invoices[invoiceIndex].updatedAt = new Date().toISOString()
    
    res.json({
      invoice: invoices[invoiceIndex],
      message: 'Invoice marked as paid'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark invoice as paid' })
  }
}