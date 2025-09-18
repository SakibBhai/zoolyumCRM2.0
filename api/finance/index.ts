import { Request, Response } from 'express'
import { z } from 'zod'

// Expense validation schema
const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().default('USD'),
  category: z.enum(['office_supplies', 'software', 'hardware', 'travel', 'meals', 'marketing', 'utilities', 'rent', 'insurance', 'legal', 'consulting', 'other']),
  subcategory: z.string().optional(),
  date: z.string(),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']),
  vendor: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  employeeId: z.string().optional(),
  receiptUrl: z.string().optional(),
  taxAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  billable: z.boolean().default(false),
  reimbursable: z.boolean().default(false),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']).default('pending'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateExpenseSchema = expenseSchema.partial()

// Budget validation schema
const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  description: z.string().optional(),
  category: z.enum(['project', 'department', 'annual', 'quarterly', 'monthly', 'campaign', 'other']),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  currency: z.string().default('USD'),
  period: z.object({
    startDate: z.string(),
    endDate: z.string()
  }),
  allocations: z.array(z.object({
    category: z.string(),
    amount: z.number().min(0),
    percentage: z.number().min(0).max(100)
  })).optional(),
  projectId: z.string().optional(),
  departmentId: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
  alerts: z.object({
    enabled: z.boolean().default(true),
    thresholds: z.array(z.number().min(0).max(100)).default([75, 90, 100])
  }).optional(),
  customFields: z.record(z.any()).optional()
})

const updateBudgetSchema = budgetSchema.partial()

// Revenue validation schema
const revenueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().default('USD'),
  source: z.enum(['project', 'retainer', 'consulting', 'product_sales', 'subscription', 'licensing', 'other']),
  date: z.string(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  invoiceId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']),
  status: z.enum(['pending', 'received', 'cancelled']).default('pending'),
  taxAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateRevenueSchema = revenueSchema.partial()

// Mock data
let expenses = [
  {
    id: 'exp-001',
    title: 'Adobe Creative Suite License',
    description: 'Annual subscription for design team',
    amount: 2400,
    currency: 'USD',
    category: 'software',
    subcategory: 'design_tools',
    date: '2024-01-15',
    paymentMethod: 'credit_card',
    vendor: 'Adobe Inc.',
    employeeId: 'lisa-chen',
    receiptUrl: 'https://example.com/receipts/adobe-2024.pdf',
    taxAmount: 192,
    taxRate: 8,
    billable: false,
    reimbursable: false,
    status: 'approved',
    notes: 'Annual renewal for design team productivity',
    tags: ['software', 'design', 'annual'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
    approvedAt: '2024-01-16T14:30:00Z',
    approvedBy: 'sarah-johnson',
    customFields: {
      department: 'Design',
      costCenter: 'CC-001',
      purchaseOrder: 'PO-2024-001'
    }
  },
  {
    id: 'exp-002',
    title: 'Client Meeting Lunch',
    description: 'Business lunch with Acme Corp executives',
    amount: 180,
    currency: 'USD',
    category: 'meals',
    subcategory: 'client_entertainment',
    date: '2024-01-20',
    paymentMethod: 'credit_card',
    vendor: 'The Business Bistro',
    clientId: 'acme-corp',
    projectId: 'proj-001',
    employeeId: 'sarah-johnson',
    receiptUrl: 'https://example.com/receipts/lunch-2024-001.pdf',
    taxAmount: 14.4,
    taxRate: 8,
    billable: true,
    reimbursable: false,
    status: 'paid',
    notes: 'Discussed project requirements and timeline',
    tags: ['client', 'meals', 'billable'],
    createdAt: '2024-01-20T15:30:00Z',
    updatedAt: '2024-01-22T09:15:00Z',
    approvedAt: '2024-01-21T11:00:00Z',
    approvedBy: 'sarah-johnson',
    paidAt: '2024-01-22T09:15:00Z',
    customFields: {
      department: 'Sales',
      attendees: 'Sarah Johnson, John Smith (Acme Corp), Jane Doe (Acme Corp)'
    }
  },
  {
    id: 'exp-003',
    title: 'MacBook Pro for Developer',
    description: 'New laptop for mobile development team',
    amount: 2800,
    currency: 'USD',
    category: 'hardware',
    subcategory: 'computers',
    date: '2024-01-25',
    paymentMethod: 'bank_transfer',
    vendor: 'Apple Inc.',
    employeeId: 'david-kim',
    receiptUrl: 'https://example.com/receipts/macbook-2024.pdf',
    taxAmount: 224,
    taxRate: 8,
    billable: false,
    reimbursable: false,
    status: 'approved',
    notes: 'Required for React Native development work',
    tags: ['hardware', 'development', 'equipment'],
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-01-26T16:45:00Z',
    approvedAt: '2024-01-26T16:45:00Z',
    approvedBy: 'sarah-johnson',
    customFields: {
      department: 'Development',
      assetTag: 'ASSET-2024-003',
      warranty: '3 years'
    }
  },
  {
    id: 'exp-004',
    title: 'Office Rent - February 2024',
    description: 'Monthly office space rental',
    amount: 4500,
    currency: 'USD',
    category: 'rent',
    subcategory: 'office_space',
    date: '2024-02-01',
    paymentMethod: 'bank_transfer',
    vendor: 'Downtown Properties LLC',
    receiptUrl: 'https://example.com/receipts/rent-feb-2024.pdf',
    taxAmount: 0,
    taxRate: 0,
    billable: false,
    reimbursable: false,
    status: 'paid',
    notes: 'Monthly rent for main office location',
    tags: ['rent', 'office', 'monthly'],
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
    approvedAt: '2024-02-01T08:00:00Z',
    approvedBy: 'sarah-johnson',
    paidAt: '2024-02-01T08:00:00Z',
    customFields: {
      department: 'Operations',
      leaseNumber: 'LEASE-2023-001',
      squareFootage: '2500'
    }
  },
  {
    id: 'exp-005',
    title: 'Conference Travel Expenses',
    description: 'Travel to Web Development Conference 2024',
    amount: 1200,
    currency: 'USD',
    category: 'travel',
    subcategory: 'conference',
    date: '2024-01-28',
    paymentMethod: 'credit_card',
    vendor: 'Various (Flight, Hotel, Meals)',
    employeeId: 'mike-wilson',
    receiptUrl: 'https://example.com/receipts/conference-travel-2024.pdf',
    taxAmount: 96,
    taxRate: 8,
    billable: false,
    reimbursable: true,
    status: 'pending',
    notes: 'Professional development - latest web technologies',
    tags: ['travel', 'conference', 'professional_development'],
    createdAt: '2024-01-28T18:30:00Z',
    updatedAt: '2024-01-28T18:30:00Z',
    customFields: {
      department: 'Development',
      conference: 'Web Dev Conf 2024',
      location: 'San Francisco, CA'
    }
  }
]

let budgets = [
  {
    id: 'budget-001',
    name: 'Q1 2024 Operations Budget',
    description: 'Quarterly budget for operational expenses',
    category: 'quarterly',
    totalAmount: 150000,
    currency: 'USD',
    period: {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    },
    allocations: [
      { category: 'software', amount: 15000, percentage: 10 },
      { category: 'hardware', amount: 22500, percentage: 15 },
      { category: 'rent', amount: 45000, percentage: 30 },
      { category: 'utilities', amount: 7500, percentage: 5 },
      { category: 'marketing', amount: 30000, percentage: 20 },
      { category: 'travel', amount: 15000, percentage: 10 },
      { category: 'other', amount: 15000, percentage: 10 }
    ],
    ownerId: 'sarah-johnson',
    status: 'active',
    alerts: {
      enabled: true,
      thresholds: [75, 90, 100]
    },
    spent: 28680, // Sum of related expenses
    remaining: 121320,
    utilizationRate: 19.12,
    createdAt: '2023-12-15T10:00:00Z',
    updatedAt: '2024-01-30T14:30:00Z',
    customFields: {
      department: 'Operations',
      approvedBy: 'CEO',
      budgetCode: 'OP-Q1-2024'
    }
  },
  {
    id: 'budget-002',
    name: 'Acme Corp Project Budget',
    description: 'Budget allocation for Acme Corp e-commerce project',
    category: 'project',
    totalAmount: 50000,
    currency: 'USD',
    period: {
      startDate: '2024-02-15',
      endDate: '2024-05-15'
    },
    allocations: [
      { category: 'development', amount: 30000, percentage: 60 },
      { category: 'design', amount: 10000, percentage: 20 },
      { category: 'testing', amount: 5000, percentage: 10 },
      { category: 'project_management', amount: 5000, percentage: 10 }
    ],
    projectId: 'proj-001',
    ownerId: 'sarah-johnson',
    status: 'active',
    alerts: {
      enabled: true,
      thresholds: [80, 95, 100]
    },
    spent: 0,
    remaining: 50000,
    utilizationRate: 0,
    createdAt: '2024-01-30T09:00:00Z',
    updatedAt: '2024-01-30T09:00:00Z',
    customFields: {
      clientId: 'acme-corp',
      projectManager: 'sarah-johnson',
      budgetCode: 'PROJ-ACME-2024'
    }
  },
  {
    id: 'budget-003',
    name: 'Annual Marketing Budget 2024',
    description: 'Annual budget for marketing and advertising activities',
    category: 'annual',
    totalAmount: 200000,
    currency: 'USD',
    period: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    allocations: [
      { category: 'digital_advertising', amount: 80000, percentage: 40 },
      { category: 'content_creation', amount: 40000, percentage: 20 },
      { category: 'events_conferences', amount: 30000, percentage: 15 },
      { category: 'tools_software', amount: 20000, percentage: 10 },
      { category: 'print_materials', amount: 15000, percentage: 7.5 },
      { category: 'other', amount: 15000, percentage: 7.5 }
    ],
    departmentId: 'marketing',
    ownerId: 'sarah-johnson',
    status: 'active',
    alerts: {
      enabled: true,
      thresholds: [70, 85, 95]
    },
    spent: 12500,
    remaining: 187500,
    utilizationRate: 6.25,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-30T16:00:00Z',
    customFields: {
      department: 'Marketing',
      approvedBy: 'CMO',
      budgetCode: 'MKT-2024'
    }
  }
]

let revenues = [
  {
    id: 'rev-001',
    title: 'Acme Corp - E-commerce Project Payment 1',
    description: 'First milestone payment for e-commerce website development',
    amount: 22500,
    currency: 'USD',
    source: 'project',
    date: '2024-02-05',
    clientId: 'acme-corp',
    projectId: 'proj-001',
    invoiceId: 'inv-001',
    paymentMethod: 'bank_transfer',
    status: 'received',
    taxAmount: 1912.50,
    taxRate: 8.5,
    notes: 'Payment received on time, project proceeding as planned',
    tags: ['project', 'milestone', 'web_development'],
    createdAt: '2024-02-05T09:15:00Z',
    updatedAt: '2024-02-05T09:15:00Z',
    receivedAt: '2024-02-05T09:15:00Z',
    customFields: {
      paymentReference: 'ACM-2024-001',
      bankReference: 'TXN-789456123',
      projectPhase: 'Phase 1'
    }
  },
  {
    id: 'rev-002',
    title: 'Tech Startup - Mobile App Development Payment 1',
    description: 'Initial payment for cross-platform mobile app development',
    amount: 26000,
    currency: 'USD',
    source: 'project',
    date: '2024-02-05',
    clientId: 'tech-startup',
    projectId: 'proj-002',
    invoiceId: 'inv-002',
    paymentMethod: 'bank_transfer',
    status: 'received',
    taxAmount: 2210,
    taxRate: 8.5,
    notes: 'Payment received with early payment discount applied',
    tags: ['project', 'mobile_app', 'startup'],
    createdAt: '2024-02-05T11:30:00Z',
    updatedAt: '2024-02-05T11:30:00Z',
    receivedAt: '2024-02-05T11:30:00Z',
    customFields: {
      paymentReference: 'TS-2024-001',
      bankReference: 'TXN-789456124',
      discountApplied: 1300
    }
  },
  {
    id: 'rev-003',
    title: 'Monthly Retainer - Local Business',
    description: 'Monthly retainer for ongoing website maintenance and support',
    amount: 2500,
    currency: 'USD',
    source: 'retainer',
    date: '2024-02-01',
    clientId: 'local-business',
    paymentMethod: 'credit_card',
    status: 'received',
    taxAmount: 212.50,
    taxRate: 8.5,
    notes: 'Recurring monthly retainer payment',
    tags: ['retainer', 'maintenance', 'recurring'],
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
    receivedAt: '2024-02-01T08:00:00Z',
    customFields: {
      paymentReference: 'LB-RET-2024-02',
      retainerPeriod: '2024-02-01 to 2024-02-29',
      autoRenewal: true
    }
  },
  {
    id: 'rev-004',
    title: 'Consulting Services - Strategy Session',
    description: 'Digital transformation consulting for enterprise client',
    amount: 5000,
    currency: 'USD',
    source: 'consulting',
    date: '2024-01-30',
    clientId: 'enterprise-client',
    paymentMethod: 'check',
    status: 'pending',
    taxAmount: 425,
    taxRate: 8.5,
    notes: 'Payment expected within 30 days',
    tags: ['consulting', 'strategy', 'enterprise'],
    createdAt: '2024-01-30T16:00:00Z',
    updatedAt: '2024-01-30T16:00:00Z',
    customFields: {
      consultingHours: 20,
      hourlyRate: 250,
      sessionDate: '2024-01-25'
    }
  },
  {
    id: 'rev-005',
    title: 'License Fee - Custom Plugin',
    description: 'Licensing fee for custom WordPress plugin development',
    amount: 1500,
    currency: 'USD',
    source: 'licensing',
    date: '2024-01-28',
    paymentMethod: 'credit_card',
    status: 'received',
    taxAmount: 127.50,
    taxRate: 8.5,
    notes: 'One-time licensing fee for plugin usage rights',
    tags: ['licensing', 'plugin', 'wordpress'],
    createdAt: '2024-01-28T14:30:00Z',
    updatedAt: '2024-01-28T14:30:00Z',
    receivedAt: '2024-01-28T14:30:00Z',
    customFields: {
      licenseType: 'Commercial',
      licenseTerms: 'Perpetual',
      pluginName: 'Advanced Analytics Pro'
    }
  }
]

// GET /api/finance/expenses - Get all expenses with filtering and pagination
export const getExpenses = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      category,
      status,
      employeeId,
      projectId,
      clientId,
      billable,
      reimbursable,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query

    let filteredExpenses = [...expenses]

    // Apply filters
    if (category) {
      filteredExpenses = filteredExpenses.filter(expense => expense.category === category)
    }
    if (status) {
      filteredExpenses = filteredExpenses.filter(expense => expense.status === status)
    }
    if (employeeId) {
      filteredExpenses = filteredExpenses.filter(expense => expense.employeeId === employeeId)
    }
    if (projectId) {
      filteredExpenses = filteredExpenses.filter(expense => expense.projectId === projectId)
    }
    if (clientId) {
      filteredExpenses = filteredExpenses.filter(expense => expense.clientId === clientId)
    }
    if (billable !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => expense.billable === (billable === 'true'))
    }
    if (reimbursable !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => expense.reimbursable === (reimbursable === 'true'))
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.title.toLowerCase().includes(searchTerm) ||
        expense.description?.toLowerCase().includes(searchTerm) ||
        expense.vendor?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredExpenses.sort((a, b) => {
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
    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)

    res.json({
      expenses: paginatedExpenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredExpenses.length,
        pages: Math.ceil(filteredExpenses.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
}

// GET /api/finance/expenses/:id - Get a specific expense
export const getExpense = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const expense = expenses.find(e => e.id === id)
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    
    res.json(expense)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense' })
  }
}

// POST /api/finance/expenses - Create a new expense
export const createExpense = (req: Request, res: Response) => {
  try {
    const validatedData = expenseSchema.parse(req.body)
    
    const newExpense = {
      id: `exp-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {},
      tags: validatedData.tags || []
    }
    
    expenses.push(newExpense)
    res.status(201).json(newExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create expense' })
  }
}

// PUT /api/finance/expenses/:id - Update an expense
export const updateExpense = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const expenseIndex = expenses.findIndex(e => e.id === id)
    
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    
    const validatedData = updateExpenseSchema.parse(req.body)
    
    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(expenses[expenseIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update expense' })
  }
}

// DELETE /api/finance/expenses/:id - Delete an expense
export const deleteExpense = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const expenseIndex = expenses.findIndex(e => e.id === id)
    
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    
    expenses.splice(expenseIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' })
  }
}

// GET /api/finance/budgets - Get all budgets with filtering and pagination
export const getBudgets = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      category,
      status,
      ownerId,
      projectId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let filteredBudgets = [...budgets]

    // Apply filters
    if (category) {
      filteredBudgets = filteredBudgets.filter(budget => budget.category === category)
    }
    if (status) {
      filteredBudgets = filteredBudgets.filter(budget => budget.status === status)
    }
    if (ownerId) {
      filteredBudgets = filteredBudgets.filter(budget => budget.ownerId === ownerId)
    }
    if (projectId) {
      filteredBudgets = filteredBudgets.filter(budget => budget.projectId === projectId)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredBudgets = filteredBudgets.filter(budget => 
        budget.name.toLowerCase().includes(searchTerm) ||
        budget.description?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredBudgets.sort((a, b) => {
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
    const paginatedBudgets = filteredBudgets.slice(startIndex, endIndex)

    res.json({
      budgets: paginatedBudgets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredBudgets.length,
        pages: Math.ceil(filteredBudgets.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets' })
  }
}

// GET /api/finance/budgets/:id - Get a specific budget
export const getBudget = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const budget = budgets.find(b => b.id === id)
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' })
    }
    
    res.json(budget)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget' })
  }
}

// POST /api/finance/budgets - Create a new budget
export const createBudget = (req: Request, res: Response) => {
  try {
    const validatedData = budgetSchema.parse(req.body)
    
    const newBudget = {
      id: `budget-${Date.now()}`,
      ...validatedData,
      spent: 0,
      remaining: validatedData.totalAmount,
      utilizationRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {}
    }
    
    budgets.push(newBudget)
    res.status(201).json(newBudget)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create budget' })
  }
}

// PUT /api/finance/budgets/:id - Update a budget
export const updateBudget = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const budgetIndex = budgets.findIndex(b => b.id === id)
    
    if (budgetIndex === -1) {
      return res.status(404).json({ error: 'Budget not found' })
    }
    
    const validatedData = updateBudgetSchema.parse(req.body)
    
    budgets[budgetIndex] = {
      ...budgets[budgetIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    // Recalculate remaining and utilization rate if totalAmount changed
    if (validatedData.totalAmount) {
      budgets[budgetIndex].remaining = validatedData.totalAmount - budgets[budgetIndex].spent
      budgets[budgetIndex].utilizationRate = (budgets[budgetIndex].spent / validatedData.totalAmount) * 100
    }
    
    res.json(budgets[budgetIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update budget' })
  }
}

// DELETE /api/finance/budgets/:id - Delete a budget
export const deleteBudget = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const budgetIndex = budgets.findIndex(b => b.id === id)
    
    if (budgetIndex === -1) {
      return res.status(404).json({ error: 'Budget not found' })
    }
    
    budgets.splice(budgetIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' })
  }
}

// GET /api/finance/revenues - Get all revenues with filtering and pagination
export const getRevenues = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      source,
      status,
      clientId,
      projectId,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query

    let filteredRevenues = [...revenues]

    // Apply filters
    if (source) {
      filteredRevenues = filteredRevenues.filter(revenue => revenue.source === source)
    }
    if (status) {
      filteredRevenues = filteredRevenues.filter(revenue => revenue.status === status)
    }
    if (clientId) {
      filteredRevenues = filteredRevenues.filter(revenue => revenue.clientId === clientId)
    }
    if (projectId) {
      filteredRevenues = filteredRevenues.filter(revenue => revenue.projectId === projectId)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredRevenues = filteredRevenues.filter(revenue => 
        revenue.title.toLowerCase().includes(searchTerm) ||
        revenue.description?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredRevenues.sort((a, b) => {
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
    const paginatedRevenues = filteredRevenues.slice(startIndex, endIndex)

    res.json({
      revenues: paginatedRevenues,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredRevenues.length,
        pages: Math.ceil(filteredRevenues.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenues' })
  }
}

// GET /api/finance/revenues/:id - Get a specific revenue
export const getRevenue = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const revenue = revenues.find(r => r.id === id)
    
    if (!revenue) {
      return res.status(404).json({ error: 'Revenue not found' })
    }
    
    res.json(revenue)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue' })
  }
}

// POST /api/finance/revenues - Create a new revenue
export const createRevenue = (req: Request, res: Response) => {
  try {
    const validatedData = revenueSchema.parse(req.body)
    
    const newRevenue = {
      id: `rev-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {},
      tags: validatedData.tags || []
    }
    
    revenues.push(newRevenue)
    res.status(201).json(newRevenue)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create revenue' })
  }
}

// PUT /api/finance/revenues/:id - Update a revenue
export const updateRevenue = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const revenueIndex = revenues.findIndex(r => r.id === id)
    
    if (revenueIndex === -1) {
      return res.status(404).json({ error: 'Revenue not found' })
    }
    
    const validatedData = updateRevenueSchema.parse(req.body)
    
    revenues[revenueIndex] = {
      ...revenues[revenueIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(revenues[revenueIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update revenue' })
  }
}

// DELETE /api/finance/revenues/:id - Delete a revenue
export const deleteRevenue = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const revenueIndex = revenues.findIndex(r => r.id === id)
    
    if (revenueIndex === -1) {
      return res.status(404).json({ error: 'Revenue not found' })
    }
    
    revenues.splice(revenueIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete revenue' })
  }
}

// GET /api/finance/stats - Get financial statistics
export const getFinanceStats = (req: Request, res: Response) => {
  try {
    const stats = {
      expenses: {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        count: expenses.length,
        byCategory: getExpensesByCategory(),
        byStatus: {
          pending: expenses.filter(e => e.status === 'pending').length,
          approved: expenses.filter(e => e.status === 'approved').length,
          rejected: expenses.filter(e => e.status === 'rejected').length,
          paid: expenses.filter(e => e.status === 'paid').length
        },
        billable: expenses.filter(e => e.billable).reduce((sum, e) => sum + e.amount, 0),
        reimbursable: expenses.filter(e => e.reimbursable).reduce((sum, e) => sum + e.amount, 0)
      },
      revenues: {
        total: revenues.reduce((sum, r) => sum + r.amount, 0),
        count: revenues.length,
        bySource: getRevenuesBySource(),
        byStatus: {
          pending: revenues.filter(r => r.status === 'pending').length,
          received: revenues.filter(r => r.status === 'received').length,
          cancelled: revenues.filter(r => r.status === 'cancelled').length
        },
        received: revenues.filter(r => r.status === 'received').reduce((sum, r) => sum + r.amount, 0),
        pending: revenues.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0)
      },
      budgets: {
        total: budgets.reduce((sum, b) => sum + b.totalAmount, 0),
        count: budgets.length,
        spent: budgets.reduce((sum, b) => sum + b.spent, 0),
        remaining: budgets.reduce((sum, b) => sum + b.remaining, 0),
        averageUtilization: budgets.length > 0 ? budgets.reduce((sum, b) => sum + b.utilizationRate, 0) / budgets.length : 0,
        byStatus: {
          draft: budgets.filter(b => b.status === 'draft').length,
          active: budgets.filter(b => b.status === 'active').length,
          completed: budgets.filter(b => b.status === 'completed').length,
          cancelled: budgets.filter(b => b.status === 'cancelled').length
        }
      },
      profitLoss: {
        revenue: revenues.filter(r => r.status === 'received').reduce((sum, r) => sum + r.amount, 0),
        expenses: expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
        profit: revenues.filter(r => r.status === 'received').reduce((sum, r) => sum + r.amount, 0) - expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
        margin: 0 // Will be calculated below
      }
    }
    
    // Calculate profit margin
    if (stats.profitLoss.revenue > 0) {
      stats.profitLoss.margin = (stats.profitLoss.profit / stats.profitLoss.revenue) * 100
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial statistics' })
  }
}

// Helper functions
function getExpensesByCategory() {
  const categories: { [key: string]: number } = {}
  expenses.forEach(expense => {
    categories[expense.category] = (categories[expense.category] || 0) + expense.amount
  })
  return categories
}

function getRevenuesBySource() {
  const sources: { [key: string]: number } = {}
  revenues.forEach(revenue => {
    sources[revenue.source] = (sources[revenue.source] || 0) + revenue.amount
  })
  return sources
}

// GET /api/finance/reports/profit-loss - Get profit & loss report
export const getProfitLossReport = (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    let filteredRevenues = revenues
    let filteredExpenses = expenses
    
    if (startDate && endDate) {
      filteredRevenues = revenues.filter(r => r.date >= startDate && r.date <= endDate)
      filteredExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate)
    }
    
    const report = {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      },
      revenue: {
        total: filteredRevenues.filter(r => r.status === 'received').reduce((sum, r) => sum + r.amount, 0),
        bySource: getRevenuesBySourceFiltered(filteredRevenues),
        count: filteredRevenues.filter(r => r.status === 'received').length
      },
      expenses: {
        total: filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
        byCategory: getExpensesByCategoryFiltered(filteredExpenses),
        count: filteredExpenses.filter(e => e.status === 'paid').length
      },
      netIncome: 0,
      margin: 0
    }
    
    report.netIncome = report.revenue.total - report.expenses.total
    report.margin = report.revenue.total > 0 ? (report.netIncome / report.revenue.total) * 100 : 0
    
    res.json(report)
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate profit & loss report' })
  }
}

function getRevenuesBySourceFiltered(filteredRevenues: any[]) {
  const sources: { [key: string]: number } = {}
  filteredRevenues.filter(r => r.status === 'received').forEach(revenue => {
    sources[revenue.source] = (sources[revenue.source] || 0) + revenue.amount
  })
  return sources
}

function getExpensesByCategoryFiltered(filteredExpenses: any[]) {
  const categories: { [key: string]: number } = {}
  filteredExpenses.filter(e => e.status === 'paid').forEach(expense => {
    categories[expense.category] = (categories[expense.category] || 0) + expense.amount
  })
  return categories
}

// POST /api/finance/expenses/:id/approve - Approve an expense
export const approveExpense = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { approvedBy, notes } = req.body
    
    const expenseIndex = expenses.findIndex(e => e.id === id)
    
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    
    expenses[expenseIndex].status = 'approved'
    expenses[expenseIndex].approvedAt = new Date().toISOString()
    expenses[expenseIndex].approvedBy = approvedBy
    expenses[expenseIndex].approvalNotes = notes
    expenses[expenseIndex].updatedAt = new Date().toISOString()
    
    res.json({
      expense: expenses[expenseIndex],
      message: 'Expense approved successfully'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve expense' })
  }
}

// POST /api/finance/expenses/:id/reject - Reject an expense
export const rejectExpense = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { rejectedBy, reason } = req.body
    
    const expenseIndex = expenses.findIndex(e => e.id === id)
    
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    
    expenses[expenseIndex].status = 'rejected'
    expenses[expenseIndex].rejectedAt = new Date().toISOString()
    expenses[expenseIndex].rejectedBy = rejectedBy
    expenses[expenseIndex].rejectionReason = reason
    expenses[expenseIndex].updatedAt = new Date().toISOString()
    
    res.json({
      expense: expenses[expenseIndex],
      message: 'Expense rejected'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject expense' })
  }
}