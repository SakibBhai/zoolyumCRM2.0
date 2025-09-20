import { Prisma } from '@prisma/client'

// User types
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    assignedLeads: true
    managedClients: true
    managedProjects: true
    assignedTasks: true
    createdTasks: true
    timeEntries: true
    taskComments: true
    leadInteractions: true
    projectResources: true
    notifications: true
  }
}>

// Lead types
export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    assigned: true
    client: true
    interactions: {
      include: {
        user: true
      }
    }
  }
}>

export type LeadInteractionWithRelations = Prisma.LeadInteractionGetPayload<{
  include: {
    lead: true
    user: true
  }
}>

// Client types
export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: {
    lead: true
    accountManager: true
    contacts: true
    projects: true
    proposals: true
    invoices: true
  }
}>

export type ClientContactWithRelations = Prisma.ClientContactGetPayload<{
  include: {
    client: true
  }
}>

// Project types
export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    client: true
    manager: true
    tasks: {
      include: {
        assignee: true
        creator: true
        comments: true
        timeEntries: true
      }
    }
    resources: {
      include: {
        creator: true
      }
    }
    proposals: true
    invoices: true
  }
}>

export type ProjectResourceWithRelations = Prisma.ProjectResourceGetPayload<{
  include: {
    project: true
    creator: true
  }
}>

// Task types
export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    project: {
      include: {
        client: true
        manager: true
      }
    }
    assignee: true
    creator: true
    comments: {
      include: {
        user: true
      }
    }
    timeEntries: {
      include: {
        user: true
      }
    }
  }
}>

export type TaskCommentWithRelations = Prisma.TaskCommentGetPayload<{
  include: {
    task: true
    user: true
  }
}>

export type TimeEntryWithRelations = Prisma.TimeEntryGetPayload<{
  include: {
    task: {
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    }
    user: true
  }
}>

// Proposal types
export type ProposalWithRelations = Prisma.ProposalGetPayload<{
  include: {
    client: true
    project: true
    creator: true
    invoice: true
  }
}>

// Invoice types
export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    client: true
    project: true
    proposal: true
    creator: true
    items: true
    payments: true
  }
}>

export type InvoiceItemWithRelations = Prisma.InvoiceItemGetPayload<{
  include: {
    invoice: true
  }
}>

export type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    invoice: {
      include: {
        client: true
      }
    }
  }
}>

// Notification types
export type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: {
    user: true
  }
}>

// System types
export type SystemSettingWithRelations = Prisma.SystemSettingGetPayload<{}>

// Dashboard types
export interface DashboardMetrics {
  totalLeads: number
  totalClients: number
  totalProjects: number
  totalTasks: number
  totalRevenue: number
  monthlyRevenue: number
  conversionRate: number
  activeProjects: number
  overdueTasks: number
  completedTasksThisMonth: number
  newLeadsThisMonth: number
  clientHealthScore: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  user: {
    name: string
    avatarUrl?: string
  }
  createdAt: Date
  actionUrl?: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
    borderWidth?: number
  }[]
}

// Form types
export interface LeadFormData {
  name: string
  email: string
  phone?: string
  company?: string
  source: 'WEBSITE' | 'SOCIAL' | 'REFERRAL' | 'EMAIL' | 'COLD_CALL'
  score: 'HOT' | 'WARM' | 'COLD'
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'CONVERTED' | 'LOST'
  notes?: string
  assignedTo?: string
}

export interface LeadInteractionFormData {
  leadId: string
  interactionType: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'
  subject?: string
  content?: string
  scheduledAt?: Date
  completedAt?: Date
}

export interface ClientFormData {
  name: string
  email: string
  company: string
  industry?: string
  phone?: string
  address?: string
  website?: string
  healthScore?: number
  accountManagerId?: string
}

export interface ClientContactFormData {
  clientId: string
  name: string
  email?: string
  phone?: string
  position?: string
  isPrimary?: boolean
}

export interface ProjectFormData {
  name: string
  description?: string
  clientId: string
  managerId: string
  budget?: number
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: Date
  endDate?: Date
}

export interface ProjectResourceFormData {
  projectId: string
  name: string
  type: 'LINK' | 'FILE' | 'DOCUMENT' | 'RESEARCH'
  url?: string
  filePath?: string
  description?: string
}

export interface TaskFormData {
  title: string
  description?: string
  projectId: string
  assigneeId?: string
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date
  estimatedHours?: number
}

export interface TaskCommentFormData {
  taskId: string
  content: string
}

export interface TimeEntryFormData {
  taskId: string
  hours: number
  description?: string
  date?: Date
}

export interface ProposalFormData {
  clientId: string
  projectId?: string
  title: string
  content?: string
  totalAmount: number
  validUntil?: Date
}

export interface InvoiceFormData {
  clientId: string
  projectId?: string
  proposalId?: string
  invoiceNumber: string
  amount: number
  taxAmount?: number
  issueDate: Date
  dueDate: Date
  notes?: string
  items: InvoiceItemFormData[]
}

export interface InvoiceItemFormData {
  description: string
  quantity: number
  unitPrice: number
}

export interface PaymentFormData {
  invoiceId: string
  amount: number
  paymentMethod?: string
  transactionId?: string
  paymentDate: Date
  notes?: string
}

export interface NotificationFormData {
  userId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  actionUrl?: string
}

// Filter and search types
export interface LeadFilters {
  status?: string[]
  source?: string[]
  score?: string[]
  assignedTo?: string
  dateRange?: {
    from: Date
    to: Date
  }
  search?: string
}

export interface ClientFilters {
  industry?: string[]
  healthScore?: {
    min: number
    max: number
  }
  accountManagerId?: string
  search?: string
}

export interface ProjectFilters {
  status?: string[]
  priority?: string[]
  managerId?: string
  clientId?: string
  dateRange?: {
    from: Date
    to: Date
  }
  search?: string
}

export interface TaskFilters {
  status?: string[]
  priority?: string[]
  assigneeId?: string
  projectId?: string
  dueDate?: {
    from: Date
    to: Date
  }
  search?: string
}

export interface ProposalFilters {
  status?: string[]
  clientId?: string
  projectId?: string
  dateRange?: {
    from: Date
    to: Date
  }
  search?: string
}

export interface InvoiceFilters {
  status?: string[]
  clientId?: string
  projectId?: string
  dateRange?: {
    from: Date
    to: Date
  }
  search?: string
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
    hasNext: boolean
    hasPrev: boolean
  }
}

// Navigation types
export interface NavItem {
  title: string
  href: string
  icon?: string
  badge?: string
  children?: NavItem[]
  isActive?: boolean
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Kanban types
export interface KanbanColumn {
  id: string
  title: string
  items: KanbanItem[]
  color?: string
}

export interface KanbanItem {
  id: string
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignee?: {
    id: string
    name: string
    avatarUrl?: string
  }
  dueDate?: Date
  tags?: string[]
  progress?: number
}

// Report types
export interface ReportData {
  title: string
  description?: string
  data: any[]
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
  dateRange: {
    from: Date
    to: Date
  }
}

export interface FinancialReport {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  outstandingInvoices: number
  paidInvoices: number
  overdueInvoices: number
  monthlyRevenue: ChartData
  revenueByClient: ChartData
  invoiceStatus: ChartData
}

// Export Prisma enums for use in components
export {
  UserRole,
  LeadSource,
  LeadScore,
  LeadStatus,
  InteractionType,
  ProjectStatus,
  TaskStatus,
  Priority,
  ResourceType,
  ProposalStatus,
  InvoiceStatus,
  NotificationType
} from '@prisma/client'