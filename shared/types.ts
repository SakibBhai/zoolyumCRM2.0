// Shared types for AgencyCRM - used by both frontend and backend

// Base types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// User and Authentication types
export interface User extends BaseEntity {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions: Permission[]
  avatar?: string
  phone?: string
  department?: string
  isActive: boolean
  lastLogin?: string
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'client'

export interface Permission {
  resource: string
  actions: string[]
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Lead types
export interface Lead extends BaseEntity {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: LeadSource
  status: LeadStatus
  score: number
  assignedTo?: string
  notes?: string
  tags: string[]
  customFields: Record<string, any>
  activities: LeadActivity[]
  estimatedValue?: number
  expectedCloseDate?: string
}

export type LeadSource = 'website' | 'referral' | 'social_media' | 'email_campaign' | 'cold_call' | 'event' | 'other'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'

export interface LeadActivity extends BaseEntity {
  leadId: string
  type: ActivityType
  description: string
  performedBy: string
  scheduledFor?: string
  completed: boolean
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'proposal' | 'follow_up'

// Client types
export interface Client extends BaseEntity {
  name: string
  email: string
  phone?: string
  website?: string
  industry?: string
  size?: CompanySize
  address?: Address
  contactPerson: ContactPerson
  healthScore: number
  totalValue: number
  status: ClientStatus
  tags: string[]
  notes: ClientNote[]
  customFields: Record<string, any>
  projects: string[] // Project IDs
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'churned'

export interface ContactPerson {
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface ClientNote extends BaseEntity {
  clientId: string
  content: string
  author: string
  isPrivate: boolean
}

// Project types
export interface Project extends BaseEntity {
  name: string
  description: string
  clientId: string
  status: ProjectStatus
  priority: Priority
  startDate: string
  endDate?: string
  budget: number
  spent: number
  progress: number
  teamMembers: string[] // User IDs
  tags: string[]
  resources: ProjectResource[]
  timeEntries: TimeEntry[]
  customFields: Record<string, any>
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface ProjectResource {
  id: string
  name: string
  type: ResourceType
  url?: string
  uploadedBy: string
  uploadedAt: string
  size?: number
}

export type ResourceType = 'document' | 'image' | 'video' | 'link' | 'other'

// Task types
export interface Task extends BaseEntity {
  title: string
  description?: string
  projectId?: string
  assignedTo?: string
  status: TaskStatus
  priority: Priority
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  comments: TaskComment[]
  timeEntries: TimeEntry[]
  dependencies: string[] // Task IDs
  customFields: Record<string, any>
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'

export interface TaskComment extends BaseEntity {
  taskId: string
  content: string
  author: string
  mentions: string[] // User IDs
}

export interface TimeEntry extends BaseEntity {
  userId: string
  projectId?: string
  taskId?: string
  description: string
  hours: number
  date: string
  billable: boolean
  hourlyRate?: number
}

// Team types
export interface TeamMember extends BaseEntity {
  userId: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  department: string
  position: string
  hireDate: string
  salary?: number
  hourlyRate?: number
  skills: string[]
  availability: Availability
  performance: PerformanceMetrics
  timeOff: TimeOffRequest[]
}

export interface Availability {
  hoursPerWeek: number
  workingDays: string[]
  timezone: string
}

export interface PerformanceMetrics {
  tasksCompleted: number
  averageTaskTime: number
  clientSatisfaction: number
  billableHours: number
  efficiency: number
}

export interface TimeOffRequest extends BaseEntity {
  userId: string
  type: TimeOffType
  startDate: string
  endDate: string
  reason?: string
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
}

export type TimeOffType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

// Proposal and Invoice types
export interface Proposal extends BaseEntity {
  number: string
  title: string
  clientId: string
  projectId?: string
  status: ProposalStatus
  validUntil: string
  items: ProposalItem[]
  subtotal: number
  tax: number
  total: number
  terms?: string
  notes?: string
  sentAt?: string
  viewedAt?: string
  acceptedAt?: string
  rejectedAt?: string
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'

export interface ProposalItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice extends BaseEntity {
  number: string
  clientId: string
  projectId?: string
  proposalId?: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  paidAmount: number
  terms?: string
  notes?: string
  sentAt?: string
  paidAt?: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

// Finance types
export interface Expense extends BaseEntity {
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  receipt?: string
  submittedBy: string
  approvedBy?: string
  status: ApprovalStatus
  projectId?: string
  clientId?: string
  reimbursable: boolean
  notes?: string
}

export type ExpenseCategory = 'travel' | 'meals' | 'office_supplies' | 'software' | 'marketing' | 'training' | 'other'

export interface Budget extends BaseEntity {
  name: string
  description?: string
  category: BudgetCategory
  amount: number
  spent: number
  period: BudgetPeriod
  startDate: string
  endDate: string
  ownerId: string
  alerts: BudgetAlert[]
}

export type BudgetCategory = 'project' | 'department' | 'marketing' | 'operations' | 'hr' | 'other'
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly'

export interface BudgetAlert {
  threshold: number
  triggered: boolean
  triggeredAt?: string
}

export interface Revenue extends BaseEntity {
  description: string
  amount: number
  source: RevenueSource
  date: string
  clientId?: string
  projectId?: string
  invoiceId?: string
  recurring: boolean
  notes?: string
}

export type RevenueSource = 'project' | 'retainer' | 'subscription' | 'one_time' | 'other'

// Report types
export interface Report extends BaseEntity {
  name: string
  description?: string
  type: ReportType
  parameters: ReportParameters
  schedule?: ReportSchedule
  recipients: string[] // User IDs
  lastGenerated?: string
  isPublic: boolean
  createdBy: string
}

export type ReportType = 'financial' | 'project' | 'team' | 'client' | 'sales' | 'custom'

export interface ReportParameters {
  dateRange: DateRange
  filters: Record<string, any>
  groupBy?: string[]
  metrics: string[]
}

export interface DateRange {
  start: string
  end: string
}

export interface ReportSchedule {
  frequency: ScheduleFrequency
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  timezone: string
}

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface Dashboard extends BaseEntity {
  name: string
  description?: string
  widgets: DashboardWidget[]
  layout: DashboardLayout
  isPublic: boolean
  createdBy: string
  sharedWith: string[] // User IDs
}

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  config: WidgetConfig
  position: WidgetPosition
}

export type WidgetType = 'chart' | 'metric' | 'table' | 'progress' | 'list' | 'calendar'

export interface WidgetConfig {
  dataSource: string
  parameters: Record<string, any>
  visualization?: VisualizationConfig
}

export interface VisualizationConfig {
  chartType?: ChartType
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
}

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter'

export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface DashboardLayout {
  columns: number
  rowHeight: number
  margin: [number, number]
  containerPadding: [number, number]
}

// Analytics types
export interface AnalyticsQuery {
  metric: string
  dimensions: string[]
  filters: AnalyticsFilter[]
  dateRange: DateRange
  groupBy?: string
  orderBy?: string
  limit?: number
}

export interface AnalyticsFilter {
  field: string
  operator: FilterOperator
  value: any
}

export type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in'

export interface AnalyticsResult {
  data: Record<string, any>[]
  total: number
  aggregations?: Record<string, number>
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Search and Filter types
export interface SearchParams {
  query?: string
  filters?: Record<string, any>
  sort?: SortParams
  pagination?: PaginationParams
}

export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationParams {
  page: number
  limit: number
}

// Notification types
export interface Notification extends BaseEntity {
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'reminder'

// Webhook types
export interface Webhook extends BaseEntity {
  name: string
  url: string
  events: WebhookEvent[]
  secret?: string
  isActive: boolean
  lastTriggered?: string
  failureCount: number
}

export type WebhookEvent = 'lead.created' | 'lead.updated' | 'client.created' | 'project.completed' | 'invoice.paid'

// Integration types
export interface Integration extends BaseEntity {
  name: string
  type: IntegrationType
  config: Record<string, any>
  isActive: boolean
  lastSync?: string
  syncStatus: SyncStatus
}

export type IntegrationType = 'email' | 'calendar' | 'accounting' | 'payment' | 'storage' | 'communication'
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

// Audit types
export interface AuditLog extends BaseEntity {
  userId: string
  action: string
  resource: string
  resourceId: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// File types
export interface FileUpload {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  uploadedBy: string
  uploadedAt: string
}

// Settings types
export interface SystemSettings {
  companyName: string
  companyLogo?: string
  timezone: string
  currency: string
  dateFormat: string
  timeFormat: string
  fiscalYearStart: string
  features: FeatureFlags
}

export interface FeatureFlags {
  timeTracking: boolean
  invoicing: boolean
  projectManagement: boolean
  teamManagement: boolean
  reporting: boolean
  integrations: boolean
}

// Statistics types
export interface DashboardStats {
  leads: LeadStats
  clients: ClientStats
  projects: ProjectStats
  tasks: TaskStats
  team: TeamStats
  finance: FinanceStats
}

export interface LeadStats {
  total: number
  new: number
  qualified: number
  converted: number
  conversionRate: number
}

export interface ClientStats {
  total: number
  active: number
  inactive: number
  averageHealthScore: number
  totalValue: number
}

export interface ProjectStats {
  total: number
  active: number
  completed: number
  onHold: number
  totalBudget: number
  totalSpent: number
}

export interface TaskStats {
  total: number
  todo: number
  inProgress: number
  completed: number
  overdue: number
}

export interface TeamStats {
  total: number
  active: number
  departments: Record<string, number>
  averagePerformance: number
}

export interface FinanceStats {
  totalRevenue: number
  totalExpenses: number
  profit: number
  profitMargin: number
  outstandingInvoices: number
  overdueInvoices: number
}