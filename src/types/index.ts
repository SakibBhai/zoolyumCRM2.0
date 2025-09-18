import { Prisma } from '@prisma/client'

// User types
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    assignedLeads: true
    clients: true
    projects: true
    tasks: true
  }
}>

// Lead types
export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    assigned: true
    createdBy: true
    client: true
    activities: {
      include: {
        user: true
      }
    }
  }
}>

// Client types
export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: {
    lead: true
    assigned: true
    projects: true
    proposals: true
    invoices: true
    activities: {
      include: {
        user: true
      }
    }
  }
}>

// Project types
export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    client: true
    manager: true
    tasks: {
      include: {
        assigned: true
        timeEntries: true
      }
    }
    proposals: true
    invoices: true
    activities: {
      include: {
        user: true
      }
    }
  }
}>

// Task types
export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    project: {
      include: {
        client: true
      }
    }
    assigned: true
    createdBy: true
    timeEntries: true
    activities: {
      include: {
        user: true
      }
    }
  }
}>

// Proposal types
export type ProposalWithRelations = Prisma.ProposalGetPayload<{
  include: {
    client: true
    project: true
    createdBy: true
    items: true
    invoice: true
  }
}>

// Invoice types
export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    client: true
    project: true
    proposal: true
    createdBy: true
    items: true
  }
}>

// Activity types
export type ActivityWithRelations = Prisma.ActivityGetPayload<{
  include: {
    user: true
    lead: true
    client: true
    project: true
    task: true
  }
}>

// Dashboard types
export interface DashboardMetrics {
  totalLeads: number
  totalClients: number
  totalProjects: number
  totalRevenue: number
  monthlyRevenue: number
  conversionRate: number
  activeProjects: number
  overdueTasks: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  user: {
    name: string
    avatar?: string
  }
  createdAt: Date
}

// Form types
export interface LeadFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: string
  notes?: string
  assignedId?: string
}

export interface ClientFormData {
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  website?: string
  industry?: string
  size?: string
  assignedId?: string
}

export interface ProjectFormData {
  name: string
  description?: string
  status: string
  priority: string
  budget?: number
  startDate?: Date
  endDate?: Date
  clientId: string
  managerId: string
}

export interface TaskFormData {
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: Date
  estimatedHours?: number
  projectId?: string
  assignedId?: string
}

export interface ProposalFormData {
  title: string
  description?: string
  amount: number
  validUntil?: Date
  clientId: string
  projectId?: string
  items: ProposalItemFormData[]
}

export interface ProposalItemFormData {
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceFormData {
  title: string
  amount: number
  tax: number
  dueDate: Date
  clientId: string
  projectId?: string
  proposalId?: string
  items: InvoiceItemFormData[]
}

export interface InvoiceItemFormData {
  description: string
  quantity: number
  unitPrice: number
}

// Filter and search types
export interface LeadFilters {
  status?: string
  source?: string
  assignedId?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface ClientFilters {
  status?: string
  industry?: string
  size?: string
  assignedId?: string
}

export interface ProjectFilters {
  status?: string
  priority?: string
  managerId?: string
  clientId?: string
}

export interface TaskFilters {
  status?: string
  priority?: string
  assignedId?: string
  projectId?: string
  dueDate?: {
    from: Date
    to: Date
  }
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Navigation types
export interface NavItem {
  title: string
  href: string
  icon?: string
  badge?: string
  children?: NavItem[]
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Notification types
export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: Date
}