import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for analytics parameters
const analyticsParamsSchema = z.object({
  reportType: z.enum([
    'revenue_analysis',
    'expense_analysis',
    'project_performance',
    'team_productivity',
    'client_profitability',
    'budget_variance',
    'time_tracking',
    'task_completion_rate',
    'financial_trends',
    'resource_utilization',
    'custom_query'
  ]),
  dateRange: z.enum(['7d', '30d', '90d', '6m', '1y', 'custom']).default('30d'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('day'),
  filters: z.object({
    clientIds: z.array(z.string()).optional(),
    projectIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    priorities: z.array(z.string()).optional(),
  }).optional(),
  metrics: z.array(z.string()).optional(),
  customQuery: z.object({
    table: z.string(),
    fields: z.array(z.string()),
    conditions: z.record(z.any()),
    aggregations: z.array(z.object({
      field: z.string(),
      operation: z.enum(['sum', 'avg', 'count', 'min', 'max']),
      alias: z.string().optional(),
    })).optional(),
  }).optional(),
})

// GET /api/reports/analytics - Generate analytics reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType')
    const dateRange = searchParams.get('dateRange') || '30d'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const groupBy = searchParams.get('groupBy') || 'day'
    const filtersParam = searchParams.get('filters')
    const metricsParam = searchParams.get('metrics')
    const customQueryParam = searchParams.get('customQuery')

    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      )
    }

    const validatedParams = analyticsParamsSchema.parse({
      reportType,
      dateRange,
      dateFrom,
      dateTo,
      groupBy,
      filters: filtersParam ? JSON.parse(filtersParam) : undefined,
      metrics: metricsParam ? JSON.parse(metricsParam) : undefined,
      customQuery: customQueryParam ? JSON.parse(customQueryParam) : undefined,
    })

    // Calculate date range
    let startDate: Date
    let endDate = new Date()

    if (validatedParams.dateRange === 'custom' && validatedParams.dateFrom && validatedParams.dateTo) {
      startDate = new Date(validatedParams.dateFrom)
      endDate = new Date(validatedParams.dateTo)
    } else {
      const days = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '6m': 180,
        '1y': 365,
        'custom': 30, // fallback for custom
      }[validatedParams.dateRange] || 30

      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    let analyticsData: any

    // Generate report based on type
    switch (validatedParams.reportType) {
      case 'revenue_analysis':
        analyticsData = await generateRevenueAnalysis(validatedParams, startDate, endDate)
        break
      case 'expense_analysis':
        analyticsData = await generateExpenseAnalysis(validatedParams, startDate, endDate)
        break
      case 'project_performance':
        analyticsData = await generateProjectPerformance(validatedParams, startDate, endDate)
        break
      case 'team_productivity':
        analyticsData = await generateTeamProductivity(validatedParams, startDate, endDate)
        break
      case 'client_profitability':
        analyticsData = await generateClientProfitability(validatedParams, startDate, endDate)
        break
      case 'budget_variance':
        analyticsData = await generateBudgetVariance(validatedParams, startDate, endDate)
        break
      case 'time_tracking':
        analyticsData = await generateTimeTracking(validatedParams, startDate, endDate)
        break
      case 'task_completion_rate':
        analyticsData = await generateTaskCompletionRate(validatedParams, startDate, endDate)
        break
      case 'financial_trends':
        analyticsData = await generateFinancialTrends(validatedParams, startDate, endDate)
        break
      case 'resource_utilization':
        analyticsData = await generateResourceUtilization(validatedParams, startDate, endDate)
        break
      case 'custom_query':
        if (!validatedParams.customQuery) {
          return NextResponse.json(
            { error: 'Custom query parameters required' },
            { status: 400 }
          )
        }
        analyticsData = await executeCustomQuery(validatedParams.customQuery, startDate, endDate)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      reportType: validatedParams.reportType,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        period: validatedParams.dateRange,
      },
      groupBy: validatedParams.groupBy,
      filters: validatedParams.filters,
      generatedAt: new Date().toISOString(),
      data: analyticsData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reports/analytics - Save custom analytics report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const saveReportSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      reportType: z.string(),
      parameters: z.record(z.any()),
      isPublic: z.boolean().default(false),
    })

    const validatedData = saveReportSchema.parse(body)

    // Note: This would require a saved_reports table in the database
    // For now, we'll return a success response
    const savedReport = {
      id: `report_${Date.now()}`,
      name: validatedData.name,
      description: validatedData.description,
      reportType: validatedData.reportType,
      parameters: validatedData.parameters,
      isPublic: validatedData.isPublic,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(savedReport, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving analytics report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate revenue analysis
async function generateRevenueAnalysis(params: any, startDate: Date, endDate: Date) {
  const baseWhere: any = {
    date: { gte: startDate, lte: endDate },
  }

  if (params.filters?.clientIds?.length) {
    baseWhere.clientId = { in: params.filters.clientIds }
  }

  if (params.filters?.projectIds?.length) {
    baseWhere.projectId = { in: params.filters.projectIds }
  }

  const revenues = await prisma.revenue.findMany({
    where: baseWhere,
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  })

  // Group by time period
  const groupedData = groupDataByPeriod(revenues, params.groupBy, 'date')
  
  // Calculate metrics
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0)
  const averageRevenue = revenues.length > 0 ? totalRevenue / revenues.length : 0
  const revenueByStatus = revenues.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + r.amount + r.taxAmount
    return acc
  }, {} as Record<string, number>)

  // Revenue by category
  const revenueByCategory = revenues.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount + r.taxAmount
    return acc
  }, {} as Record<string, number>)

  // Top clients by revenue
  const clientRevenue = revenues.reduce((acc, r) => {
    const clientKey = r.client?.name || 'Unknown'
    acc[clientKey] = (acc[clientKey] || 0) + r.amount + r.taxAmount
    return acc
  }, {} as Record<string, number>)

  const topClients = Object.entries(clientRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }))

  return {
    timeSeries: groupedData,
    summary: {
      total: totalRevenue,
      average: averageRevenue,
      count: revenues.length,
    },
    breakdown: {
      byStatus: revenueByStatus,
      byCategory: revenueByCategory,
    },
    topClients,
  }
}

// Helper function to generate expense analysis
async function generateExpenseAnalysis(params: any, startDate: Date, endDate: Date) {
  const baseWhere: any = {
    date: { gte: startDate, lte: endDate },
  }

  if (params.filters?.userIds?.length) {
    baseWhere.userId = { in: params.filters.userIds }
  }

  if (params.filters?.categories?.length) {
    baseWhere.category = { in: params.filters.categories }
  }

  if (params.filters?.statuses?.length) {
    baseWhere.status = { in: params.filters.statuses }
  }

  const expenses = await prisma.expense.findMany({
    where: baseWhere,
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  })

  // Group by time period
  const groupedData = groupDataByPeriod(expenses, params.groupBy, 'date')
  
  // Calculate metrics
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0)
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0
  
  // Expenses by category
  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount + e.taxAmount
    return acc
  }, {} as Record<string, number>)

  // Expenses by status
  const expensesByStatus = expenses.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + e.amount + e.taxAmount
    return acc
  }, {} as Record<string, number>)

  // Top spenders
  const userExpenses = expenses.reduce((acc, e) => {
    const userKey = e.user?.name || 'Unknown'
    acc[userKey] = (acc[userKey] || 0) + e.amount + e.taxAmount
    return acc
  }, {} as Record<string, number>)

  const topSpenders = Object.entries(userExpenses)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }))

  return {
    timeSeries: groupedData,
    summary: {
      total: totalExpenses,
      average: averageExpense,
      count: expenses.length,
    },
    breakdown: {
      byCategory: expensesByCategory,
      byStatus: expensesByStatus,
    },
    topSpenders,
  }
}

// Helper function to generate project performance analysis
async function generateProjectPerformance(params: any, startDate: Date, endDate: Date) {
  const baseWhere: any = {
    createdAt: { gte: startDate, lte: endDate },
  }

  if (params.filters?.clientIds?.length) {
    baseWhere.clientId = { in: params.filters.clientIds }
  }

  if (params.filters?.statuses?.length) {
    baseWhere.status = { in: params.filters.statuses }
  }

  const projects = await prisma.project.findMany({
    where: baseWhere,
    include: {
      client: { select: { id: true, name: true } },
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
          timeEntries: {
            select: { hours: true },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  })

  const projectMetrics = projects.map(project => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const totalHours = project.tasks.reduce(
      (sum, task) => sum + task.timeEntries.reduce((taskSum, entry) => taskSum + entry.hours, 0),
      0
    )

    // Calculate project duration
    const duration = project.endDate && project.startDate 
      ? Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      client: project.client,
      metrics: {
        totalTasks,
        completedTasks,
        completionRate,
        totalHours,
        duration,
      },
    }
  })

  // Overall statistics
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length
  const overallCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
  const averageProjectDuration = projectMetrics.reduce((sum, p) => sum + p.metrics.duration, 0) / totalProjects

  return {
    projects: projectMetrics,
    summary: {
      totalProjects,
      completedProjects,
      overallCompletionRate,
      averageProjectDuration,
    },
  }
}

// Helper function to generate team productivity analysis
async function generateTeamProductivity(params: any, startDate: Date, endDate: Date) {
  const baseWhere: any = {
    createdAt: { gte: startDate, lte: endDate },
  }

  if (params.filters?.userIds?.length) {
    baseWhere.assignedToId = { in: params.filters.userIds }
  }

  const tasks = await prisma.task.findMany({
    where: baseWhere,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      timeEntries: {
        select: { hours: true, date: true },
      },
    },
  })

  // Group by user
  const userProductivity = tasks.reduce((acc, task) => {
    const userId = task.assignee?.id || 'unassigned'
    const userName = task.assignee?.name || 'Unassigned'

    if (!acc[userId]) {
      acc[userId] = {
        user: task.assignee || { id: 'unassigned', name: 'Unassigned', email: '' },
        totalTasks: 0,
        completedTasks: 0,
        totalHours: 0,
        tasksByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
      }
    }

    acc[userId].totalTasks++
    if (task.status === 'DONE') {
      acc[userId].completedTasks++
    }
    acc[userId].totalHours += task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    acc[userId].tasksByPriority[task.priority]++

    return acc
  }, {} as Record<string, any>)

  const productivityMetrics = Object.values(userProductivity).map((user: any) => ({
    ...user,
    completionRate: user.totalTasks > 0 ? (user.completedTasks / user.totalTasks) * 100 : 0,
    averageHoursPerTask: user.totalTasks > 0 ? user.totalHours / user.totalTasks : 0,
  }))

  return {
    teamMetrics: productivityMetrics,
    summary: {
      totalTeamMembers: Object.keys(userProductivity).length,
      totalTasks: tasks.length,
      totalHours: tasks.reduce((sum, t) => sum + t.timeEntries.reduce((taskSum, e) => taskSum + e.hours, 0), 0),
    },
  }
}

// Helper function to generate client profitability analysis
async function generateClientProfitability(params: any, startDate: Date, endDate: Date) {
  const clients = await prisma.client.findMany({
    where: {
      status: 'ACTIVE',
      ...(params.filters?.clientIds?.length && { id: { in: params.filters.clientIds } }),
    },
    include: {
      revenues: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
        select: { amount: true, taxAmount: true },
      },
      expenses: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
        select: { amount: true, taxAmount: true },
      },
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  })

  const clientProfitability = clients.map(client => {
    const totalRevenue = client.revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0)
    const totalExpenses = client.expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0)
    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    return {
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
      },
      metrics: {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin,
        projectCount: client.projects.length,
        revenueCount: client.revenues.length,
      },
    }
  })

  // Sort by profitability
  const sortedClients = clientProfitability.sort((a, b) => b.metrics.profit - a.metrics.profit)

  return {
    clients: sortedClients,
    summary: {
      totalClients: clients.length,
      totalRevenue: sortedClients.reduce((sum, c) => sum + c.metrics.totalRevenue, 0),
      totalExpenses: sortedClients.reduce((sum, c) => sum + c.metrics.totalExpenses, 0),
      totalProfit: sortedClients.reduce((sum, c) => sum + c.metrics.profit, 0),
    },
  }
}

// Helper function to generate budget variance analysis
async function generateBudgetVariance(params: any, startDate: Date, endDate: Date) {
  const budgets = await prisma.budget.findMany({
    where: {
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
    include: {
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  })

  const budgetVariance = await Promise.all(
    budgets.map(async (budget) => {
      const expenses = await prisma.expense.aggregate({
        where: {
          date: { gte: budget.startDate, lte: budget.endDate },
          ...(budget.projectId && { projectId: budget.projectId }),
          ...(budget.clientId && { clientId: budget.clientId }),
        },
        _sum: { amount: true, taxAmount: true },
      })

      const actualSpent = (expenses._sum.amount || 0) + (expenses._sum.taxAmount || 0)
      const variance = budget.totalAmount - actualSpent
      const variancePercentage = budget.totalAmount > 0 ? (variance / budget.totalAmount) * 100 : 0

      return {
        budget: {
          id: budget.id,
          name: budget.name,
          totalAmount: budget.totalAmount,
          startDate: budget.startDate,
          endDate: budget.endDate,
        },
        project: budget.project,
        client: budget.client,
        metrics: {
          budgeted: budget.totalAmount,
          actualSpent,
          variance,
          variancePercentage,
          utilizationRate: budget.totalAmount > 0 ? (actualSpent / budget.totalAmount) * 100 : 0,
          isOverBudget: actualSpent > budget.totalAmount,
        },
      }
    })
  )

  return {
    budgets: budgetVariance,
    summary: {
      totalBudgets: budgets.length,
      totalBudgeted: budgetVariance.reduce((sum, b) => sum + b.metrics.budgeted, 0),
      totalSpent: budgetVariance.reduce((sum, b) => sum + b.metrics.actualSpent, 0),
      overBudgetCount: budgetVariance.filter(b => b.metrics.isOverBudget).length,
    },
  }
}

// Helper function to generate time tracking analysis
async function generateTimeTracking(params: any, startDate: Date, endDate: Date) {
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(params.filters?.userIds?.length && { userId: { in: params.filters.userIds } }),
      ...(params.filters?.projectIds?.length && { task: { projectId: { in: params.filters.projectIds } } }),
    },
    include: {
      user: { select: { id: true, name: true } },
      task: {
        select: {
          id: true,
          title: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  // Group by time period
  const groupedData = groupDataByPeriod(timeEntries, params.groupBy, 'date')
  
  // Time by user
  const timeByUser = timeEntries.reduce((acc, entry) => {
    const userId = entry.user?.id || 'unknown'
    const userName = entry.user?.name || 'Unknown'
    
    if (!acc[userId]) {
      acc[userId] = { user: { id: userId, name: userName }, totalHours: 0, entries: 0 }
    }
    
    acc[userId].totalHours += entry.hours
    acc[userId].entries++
    
    return acc
  }, {} as Record<string, any>)

  // Time by project
  const timeByProject = timeEntries.reduce((acc, entry) => {
    const projectId = entry.task?.project?.id || 'unknown'
    const projectName = entry.task?.project?.name || 'Unknown'
    
    if (!acc[projectId]) {
      acc[projectId] = { project: { id: projectId, name: projectName }, totalHours: 0, entries: 0 }
    }
    
    acc[projectId].totalHours += entry.hours
    acc[projectId].entries++
    
    return acc
  }, {} as Record<string, any>)

  return {
    timeSeries: groupedData,
    byUser: Object.values(timeByUser),
    byProject: Object.values(timeByProject),
    summary: {
      totalHours: timeEntries.reduce((sum, e) => sum + e.hours, 0),
      totalEntries: timeEntries.length,
      averageHoursPerEntry: timeEntries.length > 0 ? timeEntries.reduce((sum, e) => sum + e.hours, 0) / timeEntries.length : 0,
    },
  }
}

// Helper function to generate task completion rate analysis
async function generateTaskCompletionRate(params: any, startDate: Date, endDate: Date) {
  const tasks = await prisma.task.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(params.filters?.userIds?.length && { assignedToId: { in: params.filters.userIds } }),
      ...(params.filters?.projectIds?.length && { projectId: { in: params.filters.projectIds } }),
      ...(params.filters?.priorities?.length && { priority: { in: params.filters.priorities } }),
    },
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  })

  // Group by time period
  const groupedData = groupDataByPeriod(tasks, params.groupBy, 'createdAt')
  
  // Completion rate by priority
  const completionByPriority = tasks.reduce((acc, task) => {
    if (!acc[task.priority]) {
      acc[task.priority] = { total: 0, completed: 0 }
    }
    acc[task.priority].total++
    if (task.status === 'DONE') {
        acc[task.priority].completed++
    }
    return acc
  }, {} as Record<string, { total: number; completed: number }>)

  // Completion rate by user
  const completionByUser = tasks.reduce((acc, task) => {
    const userId = task.assignee?.id || 'unassigned'
    const userName = task.assignee?.name || 'Unassigned'
    
    if (!acc[userId]) {
      acc[userId] = { user: { id: userId, name: userName }, total: 0, completed: 0 }
    }
    acc[userId].total++
    if (task.status === 'DONE') {
        acc[userId].completed++
    }
    return acc
  }, {} as Record<string, any>)

  // Calculate completion rates
  const priorityRates = Object.entries(completionByPriority).map(([priority, data]) => ({
    priority,
    total: data.total,
    completed: data.completed,
    completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
  }))

  const userRates = Object.values(completionByUser).map((data: any) => ({
    ...data,
    completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
  }))

  return {
    timeSeries: groupedData,
    byPriority: priorityRates,
    byUser: userRates,
    summary: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'DONE').length,
    overallCompletionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100 : 0,
    },
  }
}

// Helper function to generate financial trends analysis
async function generateFinancialTrends(params: any, startDate: Date, endDate: Date) {
  const [revenues, expenses] = await Promise.all([
    prisma.revenue.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      select: { amount: true, taxAmount: true, date: true, category: true },
      orderBy: { date: 'asc' },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      select: { amount: true, taxAmount: true, date: true, category: true },
      orderBy: { date: 'asc' },
    }),
  ])

  // Group by time period
  const revenueTimeSeries = groupDataByPeriod(revenues, params.groupBy, 'date')
  const expenseTimeSeries = groupDataByPeriod(expenses, params.groupBy, 'date')
  
  // Calculate profit trends
  const profitTrends = revenueTimeSeries.map((revenuePoint: any, index) => {
    const expensePoint: any = expenseTimeSeries[index] || { period: revenuePoint.period, value: 0 }
    return {
      period: revenuePoint.period,
      revenue: revenuePoint.value,
      expenses: expensePoint.value,
      profit: revenuePoint.value - expensePoint.value,
      profitMargin: revenuePoint.value > 0 ? ((revenuePoint.value - expensePoint.value) / revenuePoint.value) * 100 : 0,
    }
  })

  return {
    revenue: revenueTimeSeries,
    expenses: expenseTimeSeries,
    profit: profitTrends,
    summary: {
      totalRevenue: revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0),
      netProfit: revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0) - expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0),
    },
  }
}

// Helper function to generate resource utilization analysis
async function generateResourceUtilization(params: any, startDate: Date, endDate: Date) {
  const users = await prisma.user.findMany({
    where: {
      role: { not: 'CLIENT' },
      isActive: true,
      ...(params.filters?.userIds?.length && { id: { in: params.filters.userIds } }),
    },
    include: {
      timeEntries: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
        select: { hours: true, date: true },
      },
      assignedTasks: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { id: true, status: true, priority: true },
      },
    },
  })

  const utilizationData = users.map(user => {
    const totalHours = user.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const workingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const expectedHours = workingDays * 8 // Assuming 8 hours per day
    const utilizationRate = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0
    
    const activeTasks = user.assignedTasks.filter(t => t.status !== 'DONE').length
    const completedTasks = user.assignedTasks.filter(t => t.status === 'DONE').length
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      metrics: {
        totalHours,
        expectedHours,
        utilizationRate,
        activeTasks,
        completedTasks,
        totalTasks: user.assignedTasks.length,
      },
    }
  })

  return {
    users: utilizationData,
    summary: {
      totalUsers: users.length,
      averageUtilization: utilizationData.reduce((sum, u) => sum + u.metrics.utilizationRate, 0) / users.length,
      totalHours: utilizationData.reduce((sum, u) => sum + u.metrics.totalHours, 0),
    },
  }
}

// Helper function to execute custom queries
async function executeCustomQuery(customQuery: any, startDate: Date, endDate: Date) {
  // This is a simplified implementation
  // In a real application, you'd want to implement proper query building and validation
  
  try {
    // For security, we'll only allow predefined tables and fields
    const allowedTables = ['client', 'project', 'task', 'user', 'revenue', 'expense', 'budget', 'timeEntry']
    
    if (!allowedTables.includes(customQuery.table)) {
      throw new Error('Invalid table name')
    }

    // This is a placeholder implementation
    // In practice, you'd build the query dynamically based on the parameters
    const result = {
      table: customQuery.table,
      fields: customQuery.fields,
      conditions: customQuery.conditions,
      data: [], // Placeholder for actual query results
      message: 'Custom query execution is not fully implemented in this demo',
    }

    return result
  } catch (error) {
    throw new Error(`Custom query execution failed: ${error}`)
  }
}

// Helper function to group data by time period
function groupDataByPeriod(data: any[], groupBy: string, dateField: string) {
  const grouped = data.reduce((acc, item) => {
    const date = new Date(item[dateField])
    let periodKey: string

    switch (groupBy) {
      case 'day':
        periodKey = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        periodKey = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        periodKey = `${date.getFullYear()}-Q${quarter}`
        break
      case 'year':
        periodKey = String(date.getFullYear())
        break
      default:
        periodKey = date.toISOString().split('T')[0]
    }

    if (!acc[periodKey]) {
      acc[periodKey] = { period: periodKey, value: 0, count: 0 }
    }

    // Calculate value based on item type
    let itemValue = 0
    if ('amount' in item) {
      itemValue = item.amount + (item.taxAmount || 0)
    } else if ('hours' in item) {
      itemValue = item.hours
    } else {
      itemValue = 1 // Count items that don't have amount or hours
    }

    acc[periodKey].value += itemValue
    acc[periodKey].count++

    return acc
  }, {} as Record<string, any>)

  return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period))
}