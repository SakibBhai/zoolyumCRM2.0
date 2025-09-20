import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for custom report parameters
const customReportSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  reportType: z.enum([
    'financial_summary',
    'project_performance',
    'team_productivity',
    'client_analysis',
    'time_tracking',
    'budget_analysis',
    'revenue_forecast',
    'expense_breakdown',
    'task_completion',
    'custom_query'
  ]),
  parameters: z.object({
    dateRange: z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }),
    filters: z.object({
      clientIds: z.array(z.string()).optional(),
      projectIds: z.array(z.string()).optional(),
      userIds: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      statuses: z.array(z.string()).optional(),
      priorities: z.array(z.string()).optional(),
      departments: z.array(z.string()).optional(),
    }).optional(),
    groupBy: z.array(z.enum([
      'client',
      'project',
      'user',
      'category',
      'status',
      'priority',
      'department',
      'date',
      'week',
      'month',
      'quarter',
      'year'
    ])).optional(),
    metrics: z.array(z.enum([
      'revenue',
      'expenses',
      'profit',
      'hours',
      'tasks_completed',
      'budget_utilization',
      'client_satisfaction',
      'team_efficiency',
      'project_progress',
      'cost_per_hour'
    ])).optional(),
    aggregations: z.array(z.enum(['sum', 'avg', 'count', 'min', 'max'])).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().min(1).max(1000).optional(),
    includeSubtotals: z.boolean().default(false),
    includeCharts: z.boolean().default(true),
    customQuery: z.object({
      tables: z.array(z.string()),
      fields: z.array(z.string()),
      joins: z.array(z.object({
        table: z.string(),
        on: z.string(),
        type: z.enum(['INNER', 'LEFT', 'RIGHT', 'FULL']).default('LEFT'),
      })).optional(),
      conditions: z.record(z.any()),
      having: z.record(z.any()).optional(),
    }).optional(),
  }),
  format: z.enum(['json', 'csv', 'pdf', 'excel']).default('json'),
  isPublic: z.boolean().default(false),
  scheduleConfig: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
    recipients: z.array(z.string().email()).optional(),
    nextRun: z.string().datetime().optional(),
  }).optional(),
})

const reportQuerySchema = z.object({
  reportId: z.string().optional(),
  reportType: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  format: z.enum(['json', 'csv', 'pdf', 'excel']).default('json'),
})

// GET /api/reports/custom - Get saved custom reports or generate new ones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    if (action === 'list') {
      // Return list of saved custom reports
      // Note: This would require a custom_reports table in the database
      const mockReports = [
        {
          id: 'report_1',
          name: 'Monthly Financial Summary',
          description: 'Comprehensive financial overview for the month',
          reportType: 'financial_summary',
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          lastRun: new Date().toISOString(),
          isPublic: false,
        },
        {
          id: 'report_2',
          name: 'Team Productivity Report',
          description: 'Analysis of team performance and productivity metrics',
          reportType: 'team_productivity',
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          lastRun: new Date().toISOString(),
          isPublic: true,
        },
      ]

      return NextResponse.json({
        reports: mockReports,
        total: mockReports.length,
      })
    }

    if (action === 'generate') {
      const reportType = searchParams.get('reportType')
      const parametersParam = searchParams.get('parameters')
      const format = searchParams.get('format') || 'json'

      if (!reportType) {
        return NextResponse.json(
          { error: 'Report type is required' },
          { status: 400 }
        )
      }

      const validatedQuery = reportQuerySchema.parse({
        reportType,
        parameters: parametersParam ? JSON.parse(parametersParam) : {},
        format,
      })

      const reportData = await generateCustomReport(validatedQuery, session.user.id)

      if (validatedQuery.format === 'json') {
        return NextResponse.json(reportData)
      } else {
        // For other formats, you would implement export functionality
        return NextResponse.json(
          { error: 'Export formats not implemented in this demo' },
          { status: 501 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error handling custom reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reports/custom - Save a new custom report configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = customReportSchema.parse(body)

    // Note: This would save to a custom_reports table in the database
    const savedReport = {
      id: `report_${Date.now()}`,
      ...validatedData,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRun: null,
      runCount: 0,
    }

    return NextResponse.json(savedReport, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving custom report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/reports/custom - Update an existing custom report
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    const validatedData = customReportSchema.partial().parse(updateData)

    // Note: This would update the custom_reports table in the database
    const updatedReport = {
      id,
      ...validatedData,
      updatedBy: session.user.id,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(updatedReport)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating custom report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/custom - Delete a custom report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Note: This would delete from the custom_reports table in the database
    // Also check if user has permission to delete this report

    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting custom report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate custom reports
async function generateCustomReport(query: any, userId: string) {
  const { reportType, parameters, format } = query
  const { dateRange, filters, groupBy, metrics, aggregations, sortBy, sortOrder, limit } = parameters

  const startDate = new Date(dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const endDate = new Date(dateRange?.to || new Date())

  let reportData: any = {
    reportType,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
    parameters,
  }

  switch (reportType) {
    case 'financial_summary':
      reportData.data = await generateFinancialSummaryReport(startDate, endDate, filters, groupBy)
      break

    case 'project_performance':
      reportData.data = await generateProjectPerformanceReport(startDate, endDate, filters, groupBy)
      break

    case 'team_productivity':
      reportData.data = await generateTeamProductivityReport(startDate, endDate, filters, groupBy)
      break

    case 'client_analysis':
      reportData.data = await generateClientAnalysisReport(startDate, endDate, filters, groupBy)
      break

    case 'time_tracking':
      reportData.data = await generateTimeTrackingReport(startDate, endDate, filters, groupBy)
      break

    case 'budget_analysis':
      reportData.data = await generateBudgetAnalysisReport(startDate, endDate, filters, groupBy)
      break

    case 'revenue_forecast':
      reportData.data = await generateRevenueForecastReport(startDate, endDate, filters, groupBy)
      break

    case 'expense_breakdown':
      reportData.data = await generateExpenseBreakdownReport(startDate, endDate, filters, groupBy)
      break

    case 'task_completion':
      reportData.data = await generateTaskCompletionReport(startDate, endDate, filters, groupBy)
      break

    case 'custom_query':
      if (parameters.customQuery) {
        reportData.data = await generateCustomQueryReport(parameters.customQuery, startDate, endDate)
      } else {
        throw new Error('Custom query parameters required')
      }
      break

    default:
      throw new Error('Invalid report type')
  }

  // Apply sorting and limiting
  if (reportData.data?.rows && Array.isArray(reportData.data.rows)) {
    if (sortBy) {
      reportData.data.rows.sort((a: any, b: any) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortOrder === 'desc' ? -comparison : comparison
      })
    }

    if (limit) {
      reportData.data.rows = reportData.data.rows.slice(0, limit)
    }
  }

  return reportData
}

// Financial Summary Report
async function generateFinancialSummaryReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const [revenues, expenses, budgets] = await Promise.all([
    prisma.revenue.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters?.clientIds?.length && { clientId: { in: filters.clientIds } }),
        ...(filters?.projectIds?.length && { projectId: { in: filters.projectIds } }),
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters?.userIds?.length && { userId: { in: filters.userIds } }),
        ...(filters?.categories?.length && { category: { in: filters.categories } }),
      },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.budget.findMany({
      where: {
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
        ...(filters?.clientIds?.length && { clientId: { in: filters.clientIds } }),
        ...(filters?.projectIds?.length && { projectId: { in: filters.projectIds } }),
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    }),
  ])

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0)
  const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0)
  const profit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

  return {
    summary: {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin,
      totalBudget,
      budgetUtilization: totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0,
    },
    revenueByClient: groupDataByField(revenues, 'client.name', 'amount'),
    expensesByCategory: groupDataByField(expenses, 'category', 'amount'),
    monthlyTrends: groupDataByMonth(revenues, expenses, startDate, endDate),
  }
}

// Project Performance Report
async function generateProjectPerformanceReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const projects = await prisma.project.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(filters?.clientIds?.length && { clientId: { in: filters.clientIds } }),
      ...(filters?.statuses?.length && { status: { in: filters.statuses } }),
    },
    include: {
      client: { select: { id: true, name: true } },
      tasks: {
        include: {
          timeEntries: { select: { hours: true } },
        },
      },
      revenues: {
        where: { date: { gte: startDate, lte: endDate } },
      },
      expenses: {
        where: { date: { gte: startDate, lte: endDate } },
      },
      budgets: true,
    },
  })

  const projectMetrics = projects.map(project => {
    const totalHours = project.tasks.reduce((sum, task) => 
      sum + task.timeEntries.reduce((taskSum, entry) => taskSum + entry.hours, 0), 0
    )
    const totalRevenue = project.revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0)
    const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0)
    const totalBudget = project.budgets.reduce((sum, b) => sum + b.totalAmount, 0)
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
    const totalTasks = project.tasks.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return {
      id: project.id,
      name: project.name,
      client: project.client?.name,
      status: project.status,
      totalHours,
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      totalBudget,
      budgetUtilization: totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0,
      completionRate,
      totalTasks,
      completedTasks,
      efficiency: totalHours > 0 ? totalRevenue / totalHours : 0,
    }
  })

  return {
    projects: projectMetrics,
    summary: {
      totalProjects: projects.length,
      averageCompletionRate: projectMetrics.reduce((sum, p) => sum + p.completionRate, 0) / projects.length,
      totalRevenue: projectMetrics.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalExpenses: projectMetrics.reduce((sum, p) => sum + p.totalExpenses, 0),
      totalHours: projectMetrics.reduce((sum, p) => sum + p.totalHours, 0),
    },
  }
}

// Team Productivity Report
async function generateTeamProductivityReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const users = await prisma.user.findMany({
    where: {
      role: { not: 'CLIENT' },
      isActive: true,
      ...(filters?.userIds?.length && { id: { in: filters.userIds } }),
    },
    include: {
      assignedTasks: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          timeEntries: {
            where: {
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      },
      timeEntries: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
      },
      expenses: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
      },
    },
  })

  const teamMetrics = users.map(user => {
    const totalHours = user.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const completedTasks = user.assignedTasks.filter(task => task.status === 'DONE').length
    const totalTasks = user.assignedTasks.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const totalExpenses = user.expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0)
    const averageTaskTime = completedTasks > 0 ? totalHours / completedTasks : 0

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      totalHours,
      totalTasks,
      completedTasks,
      completionRate,
      totalExpenses,
      averageTaskTime,
      productivity: totalHours > 0 ? completedTasks / totalHours : 0,
    }
  })

  return {
    teamMembers: teamMetrics,
    summary: {
      totalMembers: users.length,
      totalHours: teamMetrics.reduce((sum, m) => sum + m.totalHours, 0),
      totalTasks: teamMetrics.reduce((sum, m) => sum + m.totalTasks, 0),
      totalCompletedTasks: teamMetrics.reduce((sum, m) => sum + m.completedTasks, 0),
      averageCompletionRate: teamMetrics.reduce((sum, m) => sum + m.completionRate, 0) / users.length,
      totalExpenses: teamMetrics.reduce((sum, m) => sum + m.totalExpenses, 0),
    },
  }
}

// Client Analysis Report
async function generateClientAnalysisReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const clients = await prisma.client.findMany({
    where: {
      ...(filters?.clientIds?.length && { id: { in: filters.clientIds } }),
      ...(filters?.statuses?.length && { status: { in: filters.statuses } }),
    },
    include: {
      projects: {
        include: {
          tasks: {
            include: {
              timeEntries: {
                where: { date: { gte: startDate, lte: endDate } },
              },
            },
          },
        },
      },
      revenues: {
        where: { date: { gte: startDate, lte: endDate } },
      },
      expenses: {
        where: { date: { gte: startDate, lte: endDate } },
      },
      budgets: true,
    },
  })

  const clientMetrics = clients.map(client => {
    const totalRevenue = client.revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0)
    const totalExpenses = client.expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0)
    const totalBudget = client.budgets.reduce((sum, b) => sum + b.totalAmount, 0)
    const totalProjects = client.projects.length
    const activeProjects = client.projects.filter(p => p.status === 'ACTIVE').length
    const completedProjects = client.projects.filter(p => p.status === 'COMPLETED').length
    const totalHours = client.projects.reduce((sum, project) => 
      sum + project.tasks.reduce((taskSum, task) => 
        taskSum + task.timeEntries.reduce((entrySum, entry) => entrySum + entry.hours, 0), 0
      ), 0
    )

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      totalBudget,
      totalProjects,
      activeProjects,
      completedProjects,
      totalHours,
      revenuePerHour: totalHours > 0 ? totalRevenue / totalHours : 0,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    }
  })

  return {
    clients: clientMetrics,
    summary: {
      totalClients: clients.length,
      totalRevenue: clientMetrics.reduce((sum, c) => sum + c.totalRevenue, 0),
      totalExpenses: clientMetrics.reduce((sum, c) => sum + c.totalExpenses, 0),
      totalProjects: clientMetrics.reduce((sum, c) => sum + c.totalProjects, 0),
      averageProfitMargin: clientMetrics.reduce((sum, c) => sum + c.profitMargin, 0) / clients.length,
    },
  }
}

// Time Tracking Report
async function generateTimeTrackingReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(filters?.userIds?.length && { userId: { in: filters.userIds } }),
      ...(filters?.projectIds?.length && { task: { projectId: { in: filters.projectIds } } }),
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  })

  const dailyHours = groupDataByDate(timeEntries, 'date', 'hours')
  const userHours = groupDataByField(timeEntries, 'user.name', 'hours')
  const projectHours = groupDataByField(timeEntries, 'task.project.name', 'hours')

  return {
    timeEntries: timeEntries.map(entry => ({
      id: entry.id,
      date: entry.date,
      hours: entry.hours,
      description: entry.description,
      user: entry.user?.name,
      task: entry.task?.title,
      project: entry.task?.project?.name,
    })),
    summary: {
      totalHours: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
      totalEntries: timeEntries.length,
      averageHoursPerDay: Object.values(dailyHours).reduce((sum: number, hours: any) => sum + hours, 0) / Object.keys(dailyHours).length,
      topUser: Object.entries(userHours).sort(([,a], [,b]) => (b as number) - (a as number))[0],
      topProject: Object.entries(projectHours).sort(([,a], [,b]) => (b as number) - (a as number))[0],
    },
    charts: {
      dailyHours,
      userHours,
      projectHours,
    },
  }
}

// Budget Analysis Report
async function generateBudgetAnalysisReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const budgets = await prisma.budget.findMany({
    where: {
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
      ...(filters?.clientIds?.length && { clientId: { in: filters.clientIds } }),
      ...(filters?.projectIds?.length && { projectId: { in: filters.projectIds } }),
    },
    include: {
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  })

  const budgetAnalysis = await Promise.all(
    budgets.map(async (budget) => {
      const expenses = await prisma.expense.aggregate({
        where: {
          date: { gte: budget.startDate, lte: budget.endDate },
          ...(budget.projectId && { projectId: budget.projectId }),
          ...(budget.clientId && { clientId: budget.clientId }),
        },
        _sum: { amount: true, taxAmount: true },
      })

      const totalSpent = (expenses._sum.amount || 0) + (expenses._sum.taxAmount || 0)
      const utilization = budget.totalAmount > 0 ? (totalSpent / budget.totalAmount) * 100 : 0
      const remaining = budget.totalAmount - totalSpent
      const daysRemaining = Math.max(0, Math.ceil((budget.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      const dailyBurnRate = totalSpent > 0 ? totalSpent / Math.max(1, Math.ceil((new Date().getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24))) : 0
      const projectedSpend = dailyBurnRate * daysRemaining
      const projectedOverrun = Math.max(0, (totalSpent + projectedSpend) - budget.totalAmount)

      return {
        id: budget.id,
        name: budget.name,
        project: budget.project?.name,
        client: budget.client?.name,
        totalAmount: budget.totalAmount,
        spent: totalSpent,
        remaining,
        utilization,
        status: utilization > 100 ? 'OVER_BUDGET' : utilization > 80 ? 'AT_RISK' : 'ON_TRACK',
        daysRemaining,
        dailyBurnRate,
        projectedSpend,
        projectedOverrun,
        categories: budget.categories,
      }
    })
  )

  return {
    budgets: budgetAnalysis,
    summary: {
      totalBudgets: budgets.length,
      totalAllocated: budgetAnalysis.reduce((sum, b) => sum + b.totalAmount, 0),
      totalSpent: budgetAnalysis.reduce((sum, b) => sum + b.spent, 0),
      averageUtilization: budgetAnalysis.reduce((sum, b) => sum + b.utilization, 0) / budgets.length,
      overBudgetCount: budgetAnalysis.filter(b => b.status === 'OVER_BUDGET').length,
      atRiskCount: budgetAnalysis.filter(b => b.status === 'AT_RISK').length,
    },
  }
}

// Revenue Forecast Report
async function generateRevenueForecastReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  // This is a simplified forecast based on historical data
  const historicalRevenues = await prisma.revenue.findMany({
    where: {
      date: { gte: new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000), lte: startDate },
      ...(filters?.clientIds?.length && { clientId: { in: filters.clientIds } }),
      ...(filters?.projectIds?.length && { projectId: { in: filters.projectIds } }),
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  })

  const currentRevenues = await prisma.revenue.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(filters?.clientIds?.length && { clientId: { in: filters.clientIds } }),
      ...(filters?.projectIds?.length && { projectId: { in: filters.projectIds } }),
    },
  })

  const monthlyHistorical = groupDataByMonth(historicalRevenues, [], new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000), startDate)
  const monthlyCurrent = groupDataByMonth(currentRevenues, [], startDate, endDate)

  // Simple linear regression for forecast
  const historicalValues = Object.values(monthlyHistorical.revenues || {})
  const averageGrowth = historicalValues.length > 1 ? 
    (historicalValues[historicalValues.length - 1] - historicalValues[0]) / (historicalValues.length - 1) : 0

  const forecastMonths = 6
  const forecast = []
  let lastValue = Object.values(monthlyCurrent.revenues || {})[0] || 0

  for (let i = 1; i <= forecastMonths; i++) {
    const forecastDate = new Date(endDate)
    forecastDate.setMonth(forecastDate.getMonth() + i)
    const forecastValue = Math.max(0, lastValue + (averageGrowth * i))
    
    forecast.push({
      month: forecastDate.toISOString().substring(0, 7),
      projected: forecastValue,
      confidence: Math.max(0.3, 1 - (i * 0.1)), // Decreasing confidence over time
    })
  }

  return {
    historical: monthlyHistorical,
    current: monthlyCurrent,
    forecast,
    summary: {
      averageMonthlyGrowth: averageGrowth,
      projectedTotal: forecast.reduce((sum, f) => sum + f.projected, 0),
      confidenceLevel: forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length,
    },
  }
}

// Expense Breakdown Report
async function generateExpenseBreakdownReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(filters?.userIds?.length && { userId: { in: filters.userIds } }),
      ...(filters?.categories?.length && { category: { in: filters.categories } }),
      ...(filters?.statuses?.length && { status: { in: filters.statuses } }),
    },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  })

  const categoryBreakdown = groupDataByField(expenses, 'category', 'amount')
  const userBreakdown = groupDataByField(expenses, 'user.name', 'amount')
  const projectBreakdown = groupDataByField(expenses, 'project.name', 'amount')
  const statusBreakdown = groupDataByField(expenses, 'status', 'amount')
  const monthlyBreakdown = groupDataByMonth([], expenses, startDate, endDate)

  return {
    expenses: expenses.map(expense => ({
      id: expense.id,
      date: expense.date,
      amount: expense.amount + expense.taxAmount,
      category: expense.category,
      description: expense.description,
      user: expense.user?.name,
      project: expense.project?.name,
      client: expense.client?.name,
      status: expense.status,
    })),
    breakdown: {
      byCategory: categoryBreakdown,
      byUser: userBreakdown,
      byProject: projectBreakdown,
      byStatus: statusBreakdown,
      byMonth: monthlyBreakdown.expenses,
    },
    summary: {
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0),
      totalEntries: expenses.length,
      averageExpense: expenses.length > 0 ? expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0) / expenses.length : 0,
      topCategory: Object.entries(categoryBreakdown).sort(([,a], [,b]) => (b as number) - (a as number))[0],
      topUser: Object.entries(userBreakdown).sort(([,a], [,b]) => (b as number) - (a as number))[0],
    },
  }
}

// Task Completion Report
async function generateTaskCompletionReport(startDate: Date, endDate: Date, filters: any, groupBy: string[]) {
  const tasks = await prisma.task.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(filters?.userIds?.length && { assigneeId: { in: filters.userIds } }),
      ...(filters?.projectIds?.length && { projectId: { in: filters.projectIds } }),
      ...(filters?.statuses?.length && { status: { in: filters.statuses } }),
      ...(filters?.priorities?.length && { priority: { in: filters.priorities } }),
    },
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      timeEntries: { select: { hours: true } },
    },
  })

  const statusBreakdown = groupDataByField(tasks, 'status', 'id')
  const priorityBreakdown = groupDataByField(tasks, 'priority', 'id')
  const userBreakdown = groupDataByField(tasks, 'assignee.name', 'id')
  const projectBreakdown = groupDataByField(tasks, 'project.name', 'id')

  const completedTasks = tasks.filter(task => task.status === 'DONE')
  const overdueTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE')

  return {
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignee?.name,
      project: task.project?.name,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      completedAt: task.updatedAt,
      totalHours: task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
      isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE',
    })),
    breakdown: {
      byStatus: statusBreakdown,
      byPriority: priorityBreakdown,
      byUser: userBreakdown,
      byProject: projectBreakdown,
    },
    summary: {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      overdueTasks: overdueTasks.length,
      averageCompletionTime: completedTasks.length > 0 ?
      completedTasks.reduce((sum, task) => {
        if (task.updatedAt && task.createdAt) {
          return sum + (new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime())
        }
        return sum
      }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) : 0, // in days
    },
  }
}

// Custom Query Report
async function generateCustomQueryReport(customQuery: any, startDate: Date, endDate: Date) {
  // This is a simplified implementation
  // In a real application, you'd implement proper query building with security measures
  return {
    message: 'Custom query execution is not fully implemented in this demo',
    query: customQuery,
    data: [],
  }
}

// Helper functions
function groupDataByField(data: any[], fieldPath: string, valueField: string) {
  return data.reduce((acc, item) => {
    const fieldValue = getNestedValue(item, fieldPath) || 'Unknown'
    const value = valueField === 'id' ? 1 : (getNestedValue(item, valueField) || 0)
    acc[fieldValue] = (acc[fieldValue] || 0) + value
    return acc
  }, {} as Record<string, number>)
}

function groupDataByDate(data: any[], dateField: string, valueField: string) {
  return data.reduce((acc, item) => {
    const date = new Date(item[dateField]).toISOString().split('T')[0]
    const value = item[valueField] || 0
    acc[date] = (acc[date] || 0) + value
    return acc
  }, {} as Record<string, number>)
}

function groupDataByMonth(revenues: any[], expenses: any[], startDate: Date, endDate: Date) {
  const months: Record<string, { revenues: number; expenses: number }> = {}
  
  // Initialize months
  const current = new Date(startDate)
  while (current <= endDate) {
    const monthKey = current.toISOString().substring(0, 7)
    months[monthKey] = { revenues: 0, expenses: 0 }
    current.setMonth(current.getMonth() + 1)
  }

  // Group revenues
  revenues.forEach(revenue => {
    const monthKey = new Date(revenue.date).toISOString().substring(0, 7)
    if (months[monthKey]) {
      months[monthKey].revenues += revenue.amount + revenue.taxAmount
    }
  })

  // Group expenses
  expenses.forEach(expense => {
    const monthKey = new Date(expense.date).toISOString().substring(0, 7)
    if (months[monthKey]) {
      months[monthKey].expenses += expense.amount + expense.taxAmount
    }
  })

  return {
    revenues: Object.fromEntries(Object.entries(months).map(([key, value]) => [key, value.revenues])),
    expenses: Object.fromEntries(Object.entries(months).map(([key, value]) => [key, value.expenses])),
    profit: Object.fromEntries(Object.entries(months).map(([key, value]) => [key, value.revenues - value.expenses])),
  }
}

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}