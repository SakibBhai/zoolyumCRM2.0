import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import morgan from 'morgan'
import { Request, Response, NextFunction } from 'express'

// Import authentication middleware
import {
  authenticate,
  authorize,
  authorizeRoles,
  optionalAuth,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from './auth/middleware'

// Import API route handlers
// Leads
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  addLeadActivity,
  convertLead
} from './leads/index'

// Clients
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  getClientProjects,
  addClientNote,
  updateHealthScore
} from './clients/index.js'

// Projects
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectTasks,
  addProjectResource,
  addTimeEntry,
  updateProjectProgress
} from './projects/index'

// Tasks
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  updateTaskProgress,
  addTimeEntry,
  addTaskComment,
  getTasksKanban,
  assignTask
} from './tasks/index.js'

// Team
import {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamStats,
  getTeamDirectory,
  getTeamMemberWorkload,
  getPerformanceMetrics,
  requestTimeOff,
  updatePermissions
} from './team/index.js'

// Proposals
import {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  sendProposal,
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  markInvoicePaid,
  getProposalStats
} from './proposals/index'

// Finance
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getRevenues,
  getRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getFinanceStats,
  getProfitLossReport
} from './finance/index'

// Reports
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  getDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  executeAnalyticsQuery,
  getAvailableMetrics,
  getAnalyticsOverview
} from './reports/index'

const app = express()
const PORT = process.env.PORT || 3003

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined'))

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API Documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'AgencyCRM API',
    version: '1.0.0',
    description: 'Comprehensive CRM API for agency management',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'POST /api/auth/refresh': 'Refresh access token',
        'GET /api/auth/profile': 'Get current user profile',
        'PUT /api/auth/profile': 'Update current user profile',
        'GET /api/auth/users': 'Get all users (admin only)',
        'POST /api/auth/users': 'Create new user (admin only)',
        'PUT /api/auth/users/:id': 'Update user (admin only)',
        'DELETE /api/auth/users/:id': 'Delete user (admin only)'
      },
      leads: {
        'GET /api/leads': 'Get all leads',
        'GET /api/leads/:id': 'Get specific lead',
        'POST /api/leads': 'Create new lead',
        'PUT /api/leads/:id': 'Update lead',
        'DELETE /api/leads/:id': 'Delete lead',
        'GET /api/leads/stats': 'Get lead statistics',
        'POST /api/leads/:id/activities': 'Add lead activity',
        'POST /api/leads/:id/convert': 'Convert lead to client'
      },
      clients: {
        'GET /api/clients': 'Get all clients',
        'GET /api/clients/:id': 'Get specific client',
        'POST /api/clients': 'Create new client',
        'PUT /api/clients/:id': 'Update client',
        'DELETE /api/clients/:id': 'Delete client',
        'GET /api/clients/stats': 'Get client statistics',
        'GET /api/clients/:id/projects': 'Get client projects',
        'POST /api/clients/:id/notes': 'Add client note',
        'PUT /api/clients/:id/health': 'Update client health score'
      },
      projects: {
        'GET /api/projects': 'Get all projects',
        'GET /api/projects/:id': 'Get specific project',
        'POST /api/projects': 'Create new project',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project',
        'GET /api/projects/stats': 'Get project statistics',
        'GET /api/projects/:id/tasks': 'Get project tasks',
        'POST /api/projects/:id/resources': 'Add project resource',
        'POST /api/projects/:id/time': 'Add time entry',
        'PUT /api/projects/:id/progress': 'Update project progress'
      },
      tasks: {
        'GET /api/tasks': 'Get all tasks',
        'GET /api/tasks/:id': 'Get specific task',
        'POST /api/tasks': 'Create new task',
        'PUT /api/tasks/:id': 'Update task',
        'DELETE /api/tasks/:id': 'Delete task',
        'GET /api/tasks/stats': 'Get task statistics',
        'GET /api/tasks/kanban': 'Get Kanban board view',
        'POST /api/tasks/:id/time': 'Add task time entry',
        'POST /api/tasks/:id/comments': 'Add task comment',
        'PUT /api/tasks/:id/progress': 'Update task progress',
        'PUT /api/tasks/:id/assign': 'Assign task to user'
      },
      team: {
        'GET /api/team': 'Get all team members',
        'GET /api/team/:id': 'Get specific team member',
        'POST /api/team': 'Create new team member',
        'PUT /api/team/:id': 'Update team member',
        'DELETE /api/team/:id': 'Delete team member',
        'GET /api/team/stats': 'Get team statistics',
        'GET /api/team/directory': 'Get team directory',
        'GET /api/team/workload': 'Get workload analysis',
        'GET /api/team/performance': 'Get performance metrics',
        'POST /api/team/:id/time-off': 'Request time off',
        'PUT /api/team/:id/permissions': 'Update member permissions'
      },
      proposals: {
        'GET /api/proposals': 'Get all proposals',
        'GET /api/proposals/:id': 'Get specific proposal',
        'POST /api/proposals': 'Create new proposal',
        'PUT /api/proposals/:id': 'Update proposal',
        'DELETE /api/proposals/:id': 'Delete proposal',
        'POST /api/proposals/:id/send': 'Send proposal to client',
        'GET /api/proposals/stats': 'Get proposal statistics'
      },
      invoices: {
        'GET /api/invoices': 'Get all invoices',
        'GET /api/invoices/:id': 'Get specific invoice',
        'POST /api/invoices': 'Create new invoice',
        'PUT /api/invoices/:id': 'Update invoice',
        'DELETE /api/invoices/:id': 'Delete invoice',
        'POST /api/invoices/:id/send': 'Send invoice to client',
        'PUT /api/invoices/:id/paid': 'Mark invoice as paid'
      },
      finance: {
        'GET /api/finance/expenses': 'Get all expenses',
        'GET /api/finance/expenses/:id': 'Get specific expense',
        'POST /api/finance/expenses': 'Create new expense',
        'PUT /api/finance/expenses/:id': 'Update expense',
        'DELETE /api/finance/expenses/:id': 'Delete expense',
        'PUT /api/finance/expenses/:id/approve': 'Approve expense',
        'PUT /api/finance/expenses/:id/reject': 'Reject expense',
        'GET /api/finance/budgets': 'Get all budgets',
        'GET /api/finance/budgets/:id': 'Get specific budget',
        'POST /api/finance/budgets': 'Create new budget',
        'PUT /api/finance/budgets/:id': 'Update budget',
        'DELETE /api/finance/budgets/:id': 'Delete budget',
        'GET /api/finance/revenues': 'Get all revenues',
        'GET /api/finance/revenues/:id': 'Get specific revenue',
        'POST /api/finance/revenues': 'Create new revenue',
        'PUT /api/finance/revenues/:id': 'Update revenue',
        'DELETE /api/finance/revenues/:id': 'Delete revenue',
        'GET /api/finance/stats': 'Get finance statistics',
        'GET /api/finance/reports': 'Get finance reports'
      },
      reports: {
        'GET /api/reports': 'Get all reports',
        'GET /api/reports/:id': 'Get specific report',
        'POST /api/reports': 'Create new report',
        'PUT /api/reports/:id': 'Update report',
        'DELETE /api/reports/:id': 'Delete report',
        'POST /api/reports/:id/generate': 'Generate report',
        'GET /api/dashboards': 'Get all dashboards',
        'GET /api/dashboards/:id': 'Get specific dashboard',
        'POST /api/dashboards': 'Create new dashboard',
        'PUT /api/dashboards/:id': 'Update dashboard',
        'DELETE /api/dashboards/:id': 'Delete dashboard',
        'POST /api/analytics/query': 'Execute analytics query',
        'GET /api/analytics/metrics': 'Get available metrics',
        'GET /api/analytics/overview': 'Get analytics overview'
      }
    }
  })
})

// Authentication routes (public)
app.post('/api/auth/login', login)
app.post('/api/auth/logout', authenticate, logout)
app.post('/api/auth/refresh', authenticate, refreshToken)
app.get('/api/auth/profile', authenticate, getProfile)
app.put('/api/auth/profile', authenticate, updateProfile)

// User management routes (admin only)
app.get('/api/auth/users', authenticate, authorizeRoles('admin'), getUsers)
app.post('/api/auth/users', authenticate, authorizeRoles('admin'), createUser)
app.put('/api/auth/users/:id', authenticate, authorizeRoles('admin'), updateUser)
app.delete('/api/auth/users/:id', authenticate, authorizeRoles('admin'), deleteUser)

// Leads routes
app.get('/api/leads', authenticate, authorize('leads:read'), getLeads)
app.get('/api/leads/stats', authenticate, authorize('leads:read'), getLeadStats)
app.get('/api/leads/:id', authenticate, authorize('leads:read'), getLead)
app.post('/api/leads', authenticate, authorize('leads:write'), createLead)
app.put('/api/leads/:id', authenticate, authorize('leads:write'), updateLead)
app.delete('/api/leads/:id', authenticate, authorize('leads:delete'), deleteLead)
app.post('/api/leads/:id/activities', authenticate, authorize('leads:write'), addLeadActivity)
app.post('/api/leads/:id/convert', authenticate, authorize('leads:write'), convertLead)

// Clients routes
app.get('/api/clients', authenticate, authorize('clients:read'), getClients)
app.get('/api/clients/stats', authenticate, authorize('clients:read'), getClientStats)
app.get('/api/clients/:id', authenticate, authorize('clients:read'), getClient)
app.get('/api/clients/:id/projects', authenticate, authorize('clients:read'), getClientProjects)
app.post('/api/clients', authenticate, authorize('clients:write'), createClient)
app.put('/api/clients/:id', authenticate, authorize('clients:write'), updateClient)
app.delete('/api/clients/:id', authenticate, authorize('clients:delete'), deleteClient)
app.post('/api/clients/:id/notes', authenticate, authorize('clients:write'), addClientNote)
app.put('/api/clients/:id/health', authenticate, authorize('clients:write'), updateHealthScore)

// Projects routes
app.get('/api/projects', authenticate, authorize('projects:read'), getProjects)
app.get('/api/projects/stats', authenticate, authorize('projects:read'), getProjectStats)
app.get('/api/projects/:id', authenticate, authorize('projects:read'), getProject)
app.get('/api/projects/:id/tasks', authenticate, authorize('projects:read'), getProjectTasks)
app.post('/api/projects', authenticate, authorize('projects:write'), createProject)
app.put('/api/projects/:id', authenticate, authorize('projects:write'), updateProject)
app.delete('/api/projects/:id', authenticate, authorize('projects:delete'), deleteProject)
app.post('/api/projects/:id/resources', authenticate, authorize('projects:write'), addProjectResource)
app.post('/api/projects/:id/time', authenticate, authorize('projects:write'), addTimeEntry)
app.put('/api/projects/:id/progress', authenticate, authorize('projects:write'), updateProjectProgress)

// Tasks routes
app.get('/api/tasks', authenticate, authorize('tasks:read'), getTasks)
app.get('/api/tasks/stats', authenticate, authorize('tasks:read'), getTaskStats)
app.get('/api/tasks/kanban', authenticate, authorize('tasks:read'), getTasksKanban)
app.get('/api/tasks/:id', authenticate, authorize('tasks:read'), getTask)
app.post('/api/tasks', authenticate, authorize('tasks:write'), createTask)
app.put('/api/tasks/:id', authenticate, authorize('tasks:write'), updateTask)
app.delete('/api/tasks/:id', authenticate, authorize('tasks:delete'), deleteTask)
app.post('/api/tasks/:id/time', authenticate, authorize('tasks:write'), addTimeEntry)
app.post('/api/tasks/:id/comments', authenticate, authorize('tasks:write'), addTaskComment)
app.put('/api/tasks/:id/progress', authenticate, authorize('tasks:write'), updateTaskProgress)
app.put('/api/tasks/:id/assign', authenticate, authorize('tasks:write'), assignTask)

// Team routes
app.get('/api/team', authenticate, authorize('team:read'), getTeamMembers)
app.get('/api/team/stats', authenticate, authorize('team:read'), getTeamStats)
app.get('/api/team/directory', authenticate, authorize('team:read'), getTeamDirectory)
app.get('/api/team/workload', authenticate, authorize('team:read'), getTeamMemberWorkload)
app.get('/api/team/performance', authenticate, authorize('team:read'), getPerformanceMetrics)
app.get('/api/team/:id', authenticate, authorize('team:read'), getTeamMember)
app.post('/api/team', authenticate, authorize('team:write'), createTeamMember)
app.put('/api/team/:id', authenticate, authorize('team:write'), updateTeamMember)
app.delete('/api/team/:id', authenticate, authorize('team:delete'), deleteTeamMember)
app.post('/api/team/:id/time-off', authenticate, authorize('team:write'), requestTimeOff)
app.put('/api/team/:id/permissions', authenticate, authorizeRoles('admin', 'manager'), updatePermissions)

// Proposals routes
app.get('/api/proposals', authenticate, authorize('proposals:read'), getProposals)
app.get('/api/proposals/stats', authenticate, authorize('proposals:read'), getProposalStats)
app.get('/api/proposals/:id', authenticate, authorize('proposals:read'), getProposal)
app.post('/api/proposals', authenticate, authorize('proposals:write'), createProposal)
app.put('/api/proposals/:id', authenticate, authorize('proposals:write'), updateProposal)
app.delete('/api/proposals/:id', authenticate, authorize('proposals:delete'), deleteProposal)
app.post('/api/proposals/:id/send', authenticate, authorize('proposals:write'), sendProposal)

// Invoices routes
app.get('/api/invoices', authenticate, authorize('proposals:read'), getInvoices)
app.get('/api/invoices/:id', authenticate, authorize('proposals:read'), getInvoice)
app.post('/api/invoices', authenticate, authorize('proposals:write'), createInvoice)
app.put('/api/invoices/:id', authenticate, authorize('proposals:write'), updateInvoice)
app.delete('/api/invoices/:id', authenticate, authorize('proposals:delete'), deleteInvoice)
app.post('/api/invoices/:id/send', authenticate, authorize('proposals:write'), sendInvoice)
app.put('/api/invoices/:id/paid', authenticate, authorize('proposals:write'), markInvoicePaid)

// Finance routes
app.get('/api/finance/expenses', authenticate, authorize('finance:read'), getExpenses)
app.get('/api/finance/expenses/:id', authenticate, authorize('finance:read'), getExpense)
app.post('/api/finance/expenses', authenticate, authorize('finance:write'), createExpense)
app.put('/api/finance/expenses/:id', authenticate, authorize('finance:write'), updateExpense)
app.delete('/api/finance/expenses/:id', authenticate, authorize('finance:delete'), deleteExpense)
app.put('/api/finance/expenses/:id/approve', authenticate, authorizeRoles('admin', 'manager'), approveExpense)
app.put('/api/finance/expenses/:id/reject', authenticate, authorizeRoles('admin', 'manager'), rejectExpense)

app.get('/api/finance/budgets', authenticate, authorize('finance:read'), getBudgets)
app.get('/api/finance/budgets/:id', authenticate, authorize('finance:read'), getBudget)
app.post('/api/finance/budgets', authenticate, authorize('finance:write'), createBudget)
app.put('/api/finance/budgets/:id', authenticate, authorize('finance:write'), updateBudget)
app.delete('/api/finance/budgets/:id', authenticate, authorize('finance:delete'), deleteBudget)

app.get('/api/finance/revenues', authenticate, authorize('finance:read'), getRevenues)
app.get('/api/finance/revenues/:id', authenticate, authorize('finance:read'), getRevenue)
app.post('/api/finance/revenues', authenticate, authorize('finance:write'), createRevenue)
app.put('/api/finance/revenues/:id', authenticate, authorize('finance:write'), updateRevenue)
app.delete('/api/finance/revenues/:id', authenticate, authorize('finance:delete'), deleteRevenue)

app.get('/api/finance/stats', authenticate, authorize('finance:read'), getFinanceStats)
app.get('/api/finance/reports/profit-loss', authenticate, authorize('finance:read'), getProfitLossReport)

// Reports routes
app.get('/api/reports', authenticate, authorize('reports:read'), getReports)
app.get('/api/reports/:id', authenticate, authorize('reports:read'), getReport)
app.post('/api/reports', authenticate, authorize('reports:write'), createReport)
app.put('/api/reports/:id', authenticate, authorize('reports:write'), updateReport)
app.delete('/api/reports/:id', authenticate, authorize('reports:delete'), deleteReport)
app.post('/api/reports/:id/generate', authenticate, authorize('reports:write'), generateReport)

app.get('/api/dashboards', authenticate, authorize('reports:read'), getDashboards)
app.get('/api/dashboards/:id', authenticate, authorize('reports:read'), getDashboard)
app.post('/api/dashboards', authenticate, authorize('reports:write'), createDashboard)
app.put('/api/dashboards/:id', authenticate, authorize('reports:write'), updateDashboard)
app.delete('/api/dashboards/:id', authenticate, authorize('reports:delete'), deleteDashboard)

app.post('/api/analytics/query', authenticate, authorize('reports:read'), executeAnalyticsQuery)
app.get('/api/analytics/metrics', authenticate, authorize('reports:read'), getAvailableMetrics)
app.get('/api/analytics/overview', authenticate, authorize('reports:read'), getAnalyticsOverview)

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized access' })
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: 'Forbidden access' })
  }
  
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AgencyCRM API Server running on port ${PORT}`)
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api`)
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`)
})

export default app