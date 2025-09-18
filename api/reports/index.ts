import { Request, Response } from 'express'
import { z } from 'zod'

// Report validation schema
const reportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  type: z.enum(['sales', 'financial', 'project', 'team', 'client', 'custom']),
  category: z.enum(['performance', 'analytics', 'summary', 'detailed', 'comparison']),
  parameters: z.object({
    dateRange: z.object({
      startDate: z.string(),
      endDate: z.string()
    }),
    filters: z.record(z.any()).optional(),
    groupBy: z.array(z.string()).optional(),
    metrics: z.array(z.string()).optional(),
    format: z.enum(['table', 'chart', 'graph', 'summary']).default('table')
  }),
  schedule: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
    recipients: z.array(z.string()).optional(),
    nextRun: z.string().optional()
  }).optional(),
  visibility: z.enum(['private', 'team', 'organization']).default('private'),
  ownerId: z.string(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateReportSchema = reportSchema.partial()

// Dashboard validation schema
const dashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().optional(),
  layout: z.array(z.object({
    id: z.string(),
    type: z.enum(['chart', 'table', 'metric', 'text', 'image']),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number()
    }),
    config: z.record(z.any()),
    dataSource: z.string().optional()
  })),
  filters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['date', 'select', 'multiselect', 'text', 'number']),
    options: z.array(z.any()).optional(),
    defaultValue: z.any().optional()
  })).optional(),
  refreshInterval: z.number().min(0).optional(),
  isPublic: z.boolean().default(false),
  ownerId: z.string(),
  sharedWith: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
})

const updateDashboardSchema = dashboardSchema.partial()

// Analytics validation schema
const analyticsQuerySchema = z.object({
  metric: z.string(),
  dimensions: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string()
  }),
  groupBy: z.string().optional(),
  orderBy: z.string().optional(),
  limit: z.number().min(1).max(1000).optional()
})

// Mock data
let reports = [
  {
    id: 'report-001',
    name: 'Monthly Sales Performance',
    description: 'Comprehensive analysis of monthly sales metrics and trends',
    type: 'sales',
    category: 'performance',
    parameters: {
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      filters: {
        status: ['won', 'closed'],
        source: ['website', 'referral', 'cold_call']
      },
      groupBy: ['source', 'assignedTo'],
      metrics: ['revenue', 'conversion_rate', 'deal_count', 'average_deal_size'],
      format: 'chart'
    },
    schedule: {
      enabled: true,
      frequency: 'monthly',
      recipients: ['sarah.johnson@agency.com', 'mike.wilson@agency.com'],
      nextRun: '2024-03-01T09:00:00Z'
    },
    visibility: 'team',
    ownerId: 'sarah-johnson',
    tags: ['sales', 'monthly', 'performance'],
    status: 'active',
    lastGenerated: '2024-02-01T09:00:00Z',
    generationCount: 12,
    createdAt: '2023-02-01T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    customFields: {
      department: 'Sales',
      priority: 'high',
      automatedDelivery: true
    }
  },
  {
    id: 'report-002',
    name: 'Project Profitability Analysis',
    description: 'Detailed analysis of project costs, revenue, and profitability margins',
    type: 'financial',
    category: 'detailed',
    parameters: {
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      filters: {
        status: ['active', 'completed'],
        clientType: ['enterprise', 'mid_market']
      },
      groupBy: ['client', 'projectManager'],
      metrics: ['revenue', 'costs', 'profit_margin', 'hours_logged'],
      format: 'table'
    },
    schedule: {
      enabled: false
    },
    visibility: 'organization',
    ownerId: 'sarah-johnson',
    tags: ['financial', 'projects', 'profitability'],
    status: 'active',
    lastGenerated: '2024-01-30T16:00:00Z',
    generationCount: 8,
    createdAt: '2023-06-15T11:00:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    customFields: {
      department: 'Finance',
      priority: 'medium',
      includeForecasting: true
    }
  },
  {
    id: 'report-003',
    name: 'Team Productivity Report',
    description: 'Analysis of team member productivity, task completion, and time allocation',
    type: 'team',
    category: 'performance',
    parameters: {
      dateRange: {
        startDate: '2024-02-01',
        endDate: '2024-02-29'
      },
      filters: {
        department: ['development', 'design', 'marketing'],
        employmentType: ['full_time']
      },
      groupBy: ['department', 'role'],
      metrics: ['tasks_completed', 'hours_logged', 'efficiency_score', 'project_count'],
      format: 'chart'
    },
    schedule: {
      enabled: true,
      frequency: 'weekly',
      recipients: ['sarah.johnson@agency.com', 'hr@agency.com'],
      nextRun: '2024-02-12T08:00:00Z'
    },
    visibility: 'team',
    ownerId: 'sarah-johnson',
    tags: ['team', 'productivity', 'weekly'],
    status: 'active',
    lastGenerated: '2024-02-05T08:00:00Z',
    generationCount: 24,
    createdAt: '2023-08-01T09:00:00Z',
    updatedAt: '2024-02-01T12:00:00Z',
    customFields: {
      department: 'HR',
      priority: 'high',
      includeGoals: true
    }
  },
  {
    id: 'report-004',
    name: 'Client Satisfaction Survey Results',
    description: 'Compilation and analysis of client feedback and satisfaction scores',
    type: 'client',
    category: 'summary',
    parameters: {
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      filters: {
        surveyType: ['project_completion', 'quarterly_review'],
        clientTier: ['premium', 'enterprise']
      },
      groupBy: ['clientTier', 'projectType'],
      metrics: ['satisfaction_score', 'nps_score', 'response_rate', 'feedback_count'],
      format: 'summary'
    },
    schedule: {
      enabled: true,
      frequency: 'monthly',
      recipients: ['sarah.johnson@agency.com', 'client-success@agency.com'],
      nextRun: '2024-03-01T10:00:00Z'
    },
    visibility: 'organization',
    ownerId: 'sarah-johnson',
    tags: ['client', 'satisfaction', 'survey'],
    status: 'active',
    lastGenerated: '2024-02-01T10:00:00Z',
    generationCount: 6,
    createdAt: '2023-08-15T14:00:00Z',
    updatedAt: '2024-01-25T11:30:00Z',
    customFields: {
      department: 'Client Success',
      priority: 'high',
      includeComments: true
    }
  },
  {
    id: 'report-005',
    name: 'Custom Marketing ROI Analysis',
    description: 'Custom report analyzing return on investment for marketing campaigns',
    type: 'custom',
    category: 'analytics',
    parameters: {
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-02-29'
      },
      filters: {
        campaignType: ['digital', 'social_media', 'email'],
        budget: { min: 1000, max: 50000 }
      },
      groupBy: ['campaignType', 'channel'],
      metrics: ['roi', 'leads_generated', 'cost_per_lead', 'conversion_rate'],
      format: 'chart'
    },
    schedule: {
      enabled: false
    },
    visibility: 'private',
    ownerId: 'sarah-johnson',
    tags: ['marketing', 'roi', 'custom'],
    status: 'draft',
    lastGenerated: null,
    generationCount: 0,
    createdAt: '2024-02-01T15:00:00Z',
    updatedAt: '2024-02-01T15:00:00Z',
    customFields: {
      department: 'Marketing',
      priority: 'medium',
      experimental: true
    }
  }
]

let dashboards = [
  {
    id: 'dashboard-001',
    name: 'Executive Overview',
    description: 'High-level metrics and KPIs for executive team',
    layout: [
      {
        id: 'widget-001',
        type: 'metric',
        position: { x: 0, y: 0, width: 3, height: 2 },
        config: {
          title: 'Total Revenue',
          value: 125000,
          format: 'currency',
          trend: { direction: 'up', percentage: 12.5 },
          color: 'green'
        },
        dataSource: 'revenue_api'
      },
      {
        id: 'widget-002',
        type: 'metric',
        position: { x: 3, y: 0, width: 3, height: 2 },
        config: {
          title: 'Active Projects',
          value: 24,
          format: 'number',
          trend: { direction: 'up', percentage: 8.3 },
          color: 'blue'
        },
        dataSource: 'projects_api'
      },
      {
        id: 'widget-003',
        type: 'chart',
        position: { x: 0, y: 2, width: 6, height: 4 },
        config: {
          title: 'Revenue Trend',
          chartType: 'line',
          xAxis: 'month',
          yAxis: 'revenue',
          color: 'blue'
        },
        dataSource: 'revenue_trend_api'
      },
      {
        id: 'widget-004',
        type: 'table',
        position: { x: 6, y: 0, width: 6, height: 6 },
        config: {
          title: 'Top Clients',
          columns: ['name', 'revenue', 'projects', 'status'],
          sortBy: 'revenue',
          sortOrder: 'desc',
          limit: 10
        },
        dataSource: 'top_clients_api'
      }
    ],
    filters: [
      {
        id: 'date_filter',
        name: 'Date Range',
        type: 'date',
        defaultValue: { startDate: '2024-01-01', endDate: '2024-12-31' }
      },
      {
        id: 'department_filter',
        name: 'Department',
        type: 'multiselect',
        options: ['Sales', 'Marketing', 'Development', 'Design'],
        defaultValue: ['Sales', 'Marketing']
      }
    ],
    refreshInterval: 300000, // 5 minutes
    isPublic: false,
    ownerId: 'sarah-johnson',
    sharedWith: ['mike-wilson', 'lisa-chen'],
    tags: ['executive', 'overview', 'kpi'],
    status: 'active',
    lastViewed: '2024-02-05T14:30:00Z',
    viewCount: 156,
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: '2024-01-15T16:45:00Z',
    customFields: {
      department: 'Executive',
      priority: 'critical',
      autoRefresh: true
    }
  },
  {
    id: 'dashboard-002',
    name: 'Sales Performance Dashboard',
    description: 'Comprehensive sales metrics and pipeline analysis',
    layout: [
      {
        id: 'widget-005',
        type: 'metric',
        position: { x: 0, y: 0, width: 2, height: 2 },
        config: {
          title: 'Monthly Sales',
          value: 45000,
          format: 'currency',
          trend: { direction: 'up', percentage: 15.2 },
          color: 'green'
        },
        dataSource: 'monthly_sales_api'
      },
      {
        id: 'widget-006',
        type: 'metric',
        position: { x: 2, y: 0, width: 2, height: 2 },
        config: {
          title: 'Conversion Rate',
          value: 23.5,
          format: 'percentage',
          trend: { direction: 'down', percentage: 2.1 },
          color: 'orange'
        },
        dataSource: 'conversion_rate_api'
      },
      {
        id: 'widget-007',
        type: 'chart',
        position: { x: 0, y: 2, width: 8, height: 4 },
        config: {
          title: 'Sales Pipeline',
          chartType: 'funnel',
          stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'],
          color: 'blue'
        },
        dataSource: 'sales_pipeline_api'
      },
      {
        id: 'widget-008',
        type: 'chart',
        position: { x: 8, y: 0, width: 4, height: 6 },
        config: {
          title: 'Sales by Source',
          chartType: 'pie',
          color: 'multicolor'
        },
        dataSource: 'sales_by_source_api'
      }
    ],
    filters: [
      {
        id: 'sales_rep_filter',
        name: 'Sales Representative',
        type: 'select',
        options: ['All', 'Sarah Johnson', 'Mike Wilson', 'Lisa Chen'],
        defaultValue: 'All'
      },
      {
        id: 'period_filter',
        name: 'Period',
        type: 'select',
        options: ['This Month', 'Last Month', 'This Quarter', 'Last Quarter'],
        defaultValue: 'This Month'
      }
    ],
    refreshInterval: 600000, // 10 minutes
    isPublic: false,
    ownerId: 'sarah-johnson',
    sharedWith: ['sales-team'],
    tags: ['sales', 'performance', 'pipeline'],
    status: 'active',
    lastViewed: '2024-02-05T11:15:00Z',
    viewCount: 89,
    createdAt: '2023-07-15T09:00:00Z',
    updatedAt: '2024-01-20T13:20:00Z',
    customFields: {
      department: 'Sales',
      priority: 'high',
      teamDashboard: true
    }
  },
  {
    id: 'dashboard-003',
    name: 'Project Management Overview',
    description: 'Real-time project status, resource allocation, and timeline tracking',
    layout: [
      {
        id: 'widget-009',
        type: 'metric',
        position: { x: 0, y: 0, width: 3, height: 2 },
        config: {
          title: 'Active Projects',
          value: 18,
          format: 'number',
          trend: { direction: 'up', percentage: 5.9 },
          color: 'blue'
        },
        dataSource: 'active_projects_api'
      },
      {
        id: 'widget-010',
        type: 'metric',
        position: { x: 3, y: 0, width: 3, height: 2 },
        config: {
          title: 'On-Time Delivery',
          value: 87.5,
          format: 'percentage',
          trend: { direction: 'up', percentage: 3.2 },
          color: 'green'
        },
        dataSource: 'delivery_rate_api'
      },
      {
        id: 'widget-011',
        type: 'table',
        position: { x: 0, y: 2, width: 12, height: 4 },
        config: {
          title: 'Project Status Overview',
          columns: ['name', 'client', 'progress', 'deadline', 'status', 'manager'],
          sortBy: 'deadline',
          sortOrder: 'asc',
          limit: 15
        },
        dataSource: 'project_status_api'
      }
    ],
    filters: [
      {
        id: 'project_status_filter',
        name: 'Status',
        type: 'multiselect',
        options: ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold'],
        defaultValue: ['Planning', 'In Progress', 'Review']
      },
      {
        id: 'project_manager_filter',
        name: 'Project Manager',
        type: 'select',
        options: ['All', 'Sarah Johnson', 'Mike Wilson', 'David Kim'],
        defaultValue: 'All'
      }
    ],
    refreshInterval: 180000, // 3 minutes
    isPublic: false,
    ownerId: 'sarah-johnson',
    sharedWith: ['project-managers', 'development-team'],
    tags: ['projects', 'management', 'overview'],
    status: 'active',
    lastViewed: '2024-02-05T16:20:00Z',
    viewCount: 234,
    createdAt: '2023-09-01T11:00:00Z',
    updatedAt: '2024-02-01T10:30:00Z',
    customFields: {
      department: 'Project Management',
      priority: 'high',
      realTimeUpdates: true
    }
  }
]

let analyticsData = {
  metrics: {
    revenue: {
      total: 125000,
      monthly: 45000,
      growth: 12.5,
      trend: 'up'
    },
    clients: {
      total: 48,
      active: 42,
      new: 6,
      churn: 2
    },
    projects: {
      total: 24,
      active: 18,
      completed: 6,
      onTime: 87.5
    },
    team: {
      members: 12,
      utilization: 78.5,
      productivity: 92.3,
      satisfaction: 4.2
    }
  },
  trends: {
    revenue: [
      { period: '2024-01', value: 38000 },
      { period: '2024-02', value: 45000 },
      { period: '2024-03', value: 42000 }
    ],
    clients: [
      { period: '2024-01', value: 44 },
      { period: '2024-02', value: 48 },
      { period: '2024-03', value: 46 }
    ],
    projects: [
      { period: '2024-01', value: 22 },
      { period: '2024-02', value: 24 },
      { period: '2024-03', value: 26 }
    ]
  }
}

// GET /api/reports - Get all reports with filtering and pagination
export const getReports = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      type,
      category,
      status,
      ownerId,
      visibility,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query

    let filteredReports = [...reports]

    // Apply filters
    if (type) {
      filteredReports = filteredReports.filter(report => report.type === type)
    }
    if (category) {
      filteredReports = filteredReports.filter(report => report.category === category)
    }
    if (status) {
      filteredReports = filteredReports.filter(report => report.status === status)
    }
    if (ownerId) {
      filteredReports = filteredReports.filter(report => report.ownerId === ownerId)
    }
    if (visibility) {
      filteredReports = filteredReports.filter(report => report.visibility === visibility)
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredReports = filteredReports.filter(report => 
        report.name.toLowerCase().includes(searchTerm) ||
        report.description?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredReports.sort((a, b) => {
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
    const paginatedReports = filteredReports.slice(startIndex, endIndex)

    res.json({
      reports: paginatedReports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredReports.length,
        pages: Math.ceil(filteredReports.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
}

// GET /api/reports/:id - Get a specific report
export const getReport = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const report = reports.find(r => r.id === id)
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }
    
    res.json(report)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' })
  }
}

// POST /api/reports - Create a new report
export const createReport = (req: Request, res: Response) => {
  try {
    const validatedData = reportSchema.parse(req.body)
    
    const newReport = {
      id: `report-${Date.now()}`,
      ...validatedData,
      status: 'draft',
      lastGenerated: null,
      generationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {},
      tags: validatedData.tags || []
    }
    
    reports.push(newReport)
    res.status(201).json(newReport)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create report' })
  }
}

// PUT /api/reports/:id - Update a report
export const updateReport = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const reportIndex = reports.findIndex(r => r.id === id)
    
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' })
    }
    
    const validatedData = updateReportSchema.parse(req.body)
    
    reports[reportIndex] = {
      ...reports[reportIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(reports[reportIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update report' })
  }
}

// DELETE /api/reports/:id - Delete a report
export const deleteReport = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const reportIndex = reports.findIndex(r => r.id === id)
    
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' })
    }
    
    reports.splice(reportIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' })
  }
}

// POST /api/reports/:id/generate - Generate a report
export const generateReport = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const reportIndex = reports.findIndex(r => r.id === id)
    
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' })
    }
    
    // Simulate report generation
    const report = reports[reportIndex]
    const generatedData = {
      id: `generated-${Date.now()}`,
      reportId: id,
      generatedAt: new Date().toISOString(),
      parameters: report.parameters,
      data: generateMockReportData(report.type, report.parameters),
      format: report.parameters.format,
      size: Math.floor(Math.random() * 1000) + 100, // KB
      downloadUrl: `https://api.agency.com/reports/${id}/download/${Date.now()}`
    }
    
    // Update report metadata
    reports[reportIndex].lastGenerated = new Date().toISOString()
    reports[reportIndex].generationCount += 1
    reports[reportIndex].status = 'active'
    reports[reportIndex].updatedAt = new Date().toISOString()
    
    res.json({
      report: reports[reportIndex],
      generated: generatedData,
      message: 'Report generated successfully'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' })
  }
}

// GET /api/dashboards - Get all dashboards with filtering and pagination
export const getDashboards = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      ownerId,
      isPublic,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query

    let filteredDashboards = [...dashboards]

    // Apply filters
    if (ownerId) {
      filteredDashboards = filteredDashboards.filter(dashboard => dashboard.ownerId === ownerId)
    }
    if (isPublic !== undefined) {
      filteredDashboards = filteredDashboards.filter(dashboard => dashboard.isPublic === (isPublic === 'true'))
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredDashboards = filteredDashboards.filter(dashboard => 
        dashboard.name.toLowerCase().includes(searchTerm) ||
        dashboard.description?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredDashboards.sort((a, b) => {
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
    const paginatedDashboards = filteredDashboards.slice(startIndex, endIndex)

    res.json({
      dashboards: paginatedDashboards,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredDashboards.length,
        pages: Math.ceil(filteredDashboards.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboards' })
  }
}

// GET /api/dashboards/:id - Get a specific dashboard
export const getDashboard = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const dashboard = dashboards.find(d => d.id === id)
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' })
    }
    
    // Update view count and last viewed
    const dashboardIndex = dashboards.findIndex(d => d.id === id)
    dashboards[dashboardIndex].lastViewed = new Date().toISOString()
    dashboards[dashboardIndex].viewCount += 1
    
    res.json(dashboards[dashboardIndex])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' })
  }
}

// POST /api/dashboards - Create a new dashboard
export const createDashboard = (req: Request, res: Response) => {
  try {
    const validatedData = dashboardSchema.parse(req.body)
    
    const newDashboard = {
      id: `dashboard-${Date.now()}`,
      ...validatedData,
      status: 'active',
      lastViewed: null,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: validatedData.customFields || {},
      tags: validatedData.tags || [],
      sharedWith: validatedData.sharedWith || []
    }
    
    dashboards.push(newDashboard)
    res.status(201).json(newDashboard)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create dashboard' })
  }
}

// PUT /api/dashboards/:id - Update a dashboard
export const updateDashboard = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const dashboardIndex = dashboards.findIndex(d => d.id === id)
    
    if (dashboardIndex === -1) {
      return res.status(404).json({ error: 'Dashboard not found' })
    }
    
    const validatedData = updateDashboardSchema.parse(req.body)
    
    dashboards[dashboardIndex] = {
      ...dashboards[dashboardIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(dashboards[dashboardIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update dashboard' })
  }
}

// DELETE /api/dashboards/:id - Delete a dashboard
export const deleteDashboard = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const dashboardIndex = dashboards.findIndex(d => d.id === id)
    
    if (dashboardIndex === -1) {
      return res.status(404).json({ error: 'Dashboard not found' })
    }
    
    dashboards.splice(dashboardIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dashboard' })
  }
}

// POST /api/analytics/query - Execute analytics query
export const executeAnalyticsQuery = (req: Request, res: Response) => {
  try {
    const validatedQuery = analyticsQuerySchema.parse(req.body)
    
    // Simulate analytics query execution
    const result = {
      query: validatedQuery,
      executedAt: new Date().toISOString(),
      executionTime: Math.floor(Math.random() * 1000) + 100, // ms
      data: generateAnalyticsData(validatedQuery),
      metadata: {
        totalRows: Math.floor(Math.random() * 1000) + 50,
        columns: getColumnsForMetric(validatedQuery.metric),
        cached: Math.random() > 0.7
      }
    }
    
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to execute analytics query' })
  }
}

// GET /api/analytics/metrics - Get available metrics
export const getAvailableMetrics = (req: Request, res: Response) => {
  try {
    const metrics = {
      sales: [
        { id: 'revenue', name: 'Revenue', description: 'Total revenue amount', type: 'currency' },
        { id: 'deals_count', name: 'Deals Count', description: 'Number of deals', type: 'number' },
        { id: 'conversion_rate', name: 'Conversion Rate', description: 'Lead to deal conversion rate', type: 'percentage' },
        { id: 'average_deal_size', name: 'Average Deal Size', description: 'Average revenue per deal', type: 'currency' }
      ],
      projects: [
        { id: 'project_count', name: 'Project Count', description: 'Number of projects', type: 'number' },
        { id: 'completion_rate', name: 'Completion Rate', description: 'Project completion rate', type: 'percentage' },
        { id: 'hours_logged', name: 'Hours Logged', description: 'Total hours logged', type: 'number' },
        { id: 'budget_utilization', name: 'Budget Utilization', description: 'Budget utilization rate', type: 'percentage' }
      ],
      team: [
        { id: 'productivity_score', name: 'Productivity Score', description: 'Team productivity score', type: 'number' },
        { id: 'utilization_rate', name: 'Utilization Rate', description: 'Resource utilization rate', type: 'percentage' },
        { id: 'task_completion', name: 'Task Completion', description: 'Task completion rate', type: 'percentage' },
        { id: 'satisfaction_score', name: 'Satisfaction Score', description: 'Team satisfaction score', type: 'rating' }
      ],
      financial: [
        { id: 'profit_margin', name: 'Profit Margin', description: 'Profit margin percentage', type: 'percentage' },
        { id: 'expenses', name: 'Expenses', description: 'Total expenses', type: 'currency' },
        { id: 'cash_flow', name: 'Cash Flow', description: 'Net cash flow', type: 'currency' },
        { id: 'roi', name: 'Return on Investment', description: 'ROI percentage', type: 'percentage' }
      ]
    }
    
    res.json(metrics)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available metrics' })
  }
}

// GET /api/analytics/overview - Get analytics overview
export const getAnalyticsOverview = (req: Request, res: Response) => {
  try {
    res.json(analyticsData)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics overview' })
  }
}

// Helper functions
function generateMockReportData(type: string, parameters: any) {
  const baseData = {
    summary: {
      totalRecords: Math.floor(Math.random() * 1000) + 100,
      dateRange: parameters.dateRange,
      generatedAt: new Date().toISOString()
    },
    data: []
  }
  
  switch (type) {
    case 'sales':
      baseData.data = generateSalesData()
      break
    case 'financial':
      baseData.data = generateFinancialData()
      break
    case 'project':
      baseData.data = generateProjectData()
      break
    case 'team':
      baseData.data = generateTeamData()
      break
    case 'client':
      baseData.data = generateClientData()
      break
    default:
      baseData.data = generateGenericData()
  }
  
  return baseData
}

function generateSalesData() {
  return [
    { metric: 'Total Revenue', value: 125000, change: 12.5 },
    { metric: 'Deals Closed', value: 24, change: 8.3 },
    { metric: 'Conversion Rate', value: 23.5, change: -2.1 },
    { metric: 'Average Deal Size', value: 5208, change: 15.7 }
  ]
}

function generateFinancialData() {
  return [
    { metric: 'Revenue', value: 125000, change: 12.5 },
    { metric: 'Expenses', value: 78000, change: 8.2 },
    { metric: 'Profit', value: 47000, change: 18.9 },
    { metric: 'Margin', value: 37.6, change: 4.2 }
  ]
}

function generateProjectData() {
  return [
    { metric: 'Active Projects', value: 18, change: 5.9 },
    { metric: 'Completed Projects', value: 6, change: 20.0 },
    { metric: 'On-Time Delivery', value: 87.5, change: 3.2 },
    { metric: 'Budget Utilization', value: 92.3, change: -1.8 }
  ]
}

function generateTeamData() {
  return [
    { metric: 'Team Members', value: 12, change: 0 },
    { metric: 'Utilization Rate', value: 78.5, change: 2.3 },
    { metric: 'Productivity Score', value: 92.3, change: 5.1 },
    { metric: 'Satisfaction Score', value: 4.2, change: 0.3 }
  ]
}

function generateClientData() {
  return [
    { metric: 'Total Clients', value: 48, change: 14.3 },
    { metric: 'Active Clients', value: 42, change: 10.5 },
    { metric: 'Satisfaction Score', value: 4.3, change: 0.2 },
    { metric: 'Retention Rate', value: 94.2, change: 1.8 }
  ]
}

function generateGenericData() {
  return [
    { metric: 'Total Records', value: Math.floor(Math.random() * 1000) + 100, change: Math.random() * 20 - 10 },
    { metric: 'Active Records', value: Math.floor(Math.random() * 800) + 80, change: Math.random() * 15 - 7.5 },
    { metric: 'Success Rate', value: Math.random() * 30 + 70, change: Math.random() * 10 - 5 },
    { metric: 'Performance Score', value: Math.random() * 20 + 80, change: Math.random() * 8 - 4 }
  ]
}

function generateAnalyticsData(query: any) {
  const rows = []
  const rowCount = Math.min(query.limit || 100, 100)
  
  for (let i = 0; i < rowCount; i++) {
    const row: any = {}
    
    // Add metric value
    row[query.metric] = Math.floor(Math.random() * 10000) + 1000
    
    // Add dimensions
    if (query.dimensions) {
      query.dimensions.forEach((dim: string) => {
        row[dim] = `${dim}_${Math.floor(Math.random() * 10) + 1}`
      })
    }
    
    // Add date if groupBy includes date
    if (query.groupBy === 'date' || query.groupBy === 'month') {
      row.date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
    }
    
    rows.push(row)
  }
  
  return rows
}

function getColumnsForMetric(metric: string) {
  const baseColumns = [metric]
  
  switch (metric) {
    case 'revenue':
      return [...baseColumns, 'date', 'source', 'client']
    case 'deals_count':
      return [...baseColumns, 'date', 'status', 'sales_rep']
    case 'project_count':
      return [...baseColumns, 'date', 'status', 'manager']
    case 'productivity_score':
      return [...baseColumns, 'date', 'team_member', 'department']
    default:
      return [...baseColumns, 'date', 'category']
  }
}