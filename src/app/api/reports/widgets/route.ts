import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for widget parameters
const widgetParamsSchema = z.object({
  widgetType: z.enum([
    'stat_card',
    'chart_line',
    'chart_bar',
    'chart_pie',
    'chart_area',
    'table_data',
    'progress_bar',
    'metric_comparison',
    'timeline',
    'heatmap',
    'gauge',
    'funnel',
    'activity_feed',
    'kpi_grid',
    'trend_indicator'
  ]),
  dataSource: z.enum([
    'revenues',
    'expenses',
    'projects',
    'tasks',
    'clients',
    'team',
    'budgets',
    'time_entries',
    'custom_query'
  ]),
  dateRange: z.enum(['7d', '30d', '90d', '6m', '1y', 'custom']).default('30d'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  filters: z.object({
    clientIds: z.array(z.string()).optional(),
    projectIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    priorities: z.array(z.string()).optional(),
  }).optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('sum'),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year', 'category', 'status', 'priority', 'user', 'client', 'project']).optional(),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  customQuery: z.object({
    table: z.string(),
    fields: z.array(z.string()),
    conditions: z.record(z.any()),
  }).optional(),
})

// GET /api/reports/widgets - Generate widget data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const widgetType = searchParams.get('widgetType')
    const dataSource = searchParams.get('dataSource')
    const dateRange = searchParams.get('dateRange') || '30d'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const filtersParam = searchParams.get('filters')
    const aggregation = searchParams.get('aggregation') || 'sum'
    const groupBy = searchParams.get('groupBy')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const customQueryParam = searchParams.get('customQuery')

    if (!widgetType || !dataSource) {
      return NextResponse.json(
        { error: 'Widget type and data source are required' },
        { status: 400 }
      )
    }

    const validatedParams = widgetParamsSchema.parse({
      widgetType,
      dataSource,
      dateRange,
      dateFrom,
      dateTo,
      filters: filtersParam ? JSON.parse(filtersParam) : undefined,
      aggregation,
      groupBy,
      limit,
      sortBy,
      sortOrder,
      customQuery: customQueryParam ? JSON.parse(customQueryParam) : undefined,
    })

    // Calculate date range
    let startDate: Date
    let endDate = new Date()

    if (validatedParams.dateRange === 'custom' && validatedParams.dateFrom && validatedParams.dateTo) {
      startDate = new Date(validatedParams.dateFrom)
      endDate = new Date(validatedParams.dateTo)
    } else {
      const daysMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '6m': 180,
        '1y': 365,
      }
      const days = daysMap[validatedParams.dateRange] || 30

      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    let widgetData: any

    // Generate widget data based on type and data source
    switch (validatedParams.dataSource) {
      case 'revenues':
        widgetData = await generateRevenueWidget(validatedParams, startDate, endDate)
        break
      case 'expenses':
        widgetData = await generateExpenseWidget(validatedParams, startDate, endDate)
        break
      case 'projects':
        widgetData = await generateProjectWidget(validatedParams, startDate, endDate)
        break
      case 'tasks':
        widgetData = await generateTaskWidget(validatedParams, startDate, endDate)
        break
      case 'clients':
        widgetData = await generateClientWidget(validatedParams, startDate, endDate)
        break
      case 'team':
        widgetData = await generateTeamWidget(validatedParams, startDate, endDate)
        break
      case 'budgets':
        widgetData = await generateBudgetWidget(validatedParams, startDate, endDate)
        break
      case 'time_entries':
        widgetData = await generateTimeEntryWidget(validatedParams, startDate, endDate)
        break
      case 'custom_query':
        if (!validatedParams.customQuery) {
          return NextResponse.json(
            { error: 'Custom query parameters required' },
            { status: 400 }
          )
        }
        widgetData = await generateCustomWidget(validatedParams, startDate, endDate)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid data source' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      widgetType: validatedParams.widgetType,
      dataSource: validatedParams.dataSource,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        period: validatedParams.dateRange,
      },
      filters: validatedParams.filters,
      generatedAt: new Date().toISOString(),
      data: widgetData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating widget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reports/widgets - Save custom widget configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const saveWidgetSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      widgetType: z.string(),
      dataSource: z.string(),
      configuration: z.record(z.any()),
      isPublic: z.boolean().default(false),
      dashboardId: z.string().optional(),
    })

    const validatedData = saveWidgetSchema.parse(body)

    // Note: This would require a saved_widgets table in the database
    // For now, we'll return a success response
    const savedWidget = {
      id: `widget_${Date.now()}`,
      name: validatedData.name,
      description: validatedData.description,
      widgetType: validatedData.widgetType,
      dataSource: validatedData.dataSource,
      configuration: validatedData.configuration,
      isPublic: validatedData.isPublic,
      dashboardId: validatedData.dashboardId,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(savedWidget, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving widget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate revenue widgets
async function generateRevenueWidget(params: any, startDate: Date, endDate: Date) {
  const baseWhere: any = {
    date: { gte: startDate, lte: endDate },
  }

  if (params.filters?.clientIds?.length) {
    baseWhere.clientId = { in: params.filters.clientIds }
  }

  if (params.filters?.projectIds?.length) {
    baseWhere.projectId = { in: params.filters.projectIds }
  }

  if (params.filters?.statuses?.length) {
    baseWhere.status = { in: params.filters.statuses }
  }

  const revenues = await prisma.revenue.findMany({
    where: baseWhere,
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { date: 'desc' },
    take: params.limit,
  })

  return formatWidgetData(params.widgetType, revenues, params, {
    valueField: (item: any) => item.amount + item.taxAmount,
    labelField: (item: any) => item.client?.name || 'Unknown Client',
    dateField: 'date',
    categoryField: 'category',
  })
}

// Helper function to generate expense widgets
async function generateExpenseWidget(params: any, startDate: Date, endDate: Date) {
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
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { date: 'desc' },
    take: params.limit,
  })

  return formatWidgetData(params.widgetType, expenses, params, {
    valueField: (item: any) => item.amount + item.taxAmount,
    labelField: (item: any) => item.user?.name || 'Unknown User',
    dateField: 'date',
    categoryField: 'category',
  })
}

// Helper function to generate project widgets
async function generateProjectWidget(params: any, startDate: Date, endDate: Date) {
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
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { createdAt: 'desc' },
    take: params.limit,
  })

  return formatWidgetData(params.widgetType, projects, params, {
    valueField: (item: any) => item._count.tasks,
    labelField: (item: any) => item.name,
    dateField: 'createdAt',
    categoryField: 'status',
  })
}

// Helper function to generate task widgets
async function generateTaskWidget(params: any, startDate: Date, endDate: Date) {
  const baseWhere: any = {
    createdAt: { gte: startDate, lte: endDate },
  }

  if (params.filters?.userIds?.length) {
    baseWhere.assigneeId = { in: params.filters.userIds }
  }

  if (params.filters?.projectIds?.length) {
    baseWhere.projectId = { in: params.filters.projectIds }
  }

  if (params.filters?.statuses?.length) {
    baseWhere.status = { in: params.filters.statuses }
  }

  if (params.filters?.priorities?.length) {
    baseWhere.priority = { in: params.filters.priorities }
  }

  const tasks = await prisma.task.findMany({
    where: baseWhere,
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      timeEntries: {
        select: { hours: true },
      },
    },
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { createdAt: 'desc' },
    take: params.limit,
  })

  return formatWidgetData(params.widgetType, tasks, params, {
    valueField: (item: any) => item.timeEntries.reduce((sum: number, entry: any) => sum + entry.hours, 0),
    labelField: (item: any) => item.title,
    dateField: 'createdAt',
    categoryField: 'status',
  })
}

// Helper function to generate client widgets
async function generateClientWidget(params: any, startDate: Date, endDate: Date) {
  const clients = await prisma.client.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(params.filters?.statuses?.length && { status: { in: params.filters.statuses } }),
    },
    include: {
      _count: {
        select: {
          projects: true,
          revenues: {
            where: {
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    },
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { createdAt: 'desc' },
    take: params.limit,
  })

  return formatWidgetData(params.widgetType, clients, params, {
    valueField: (item: any) => item._count.projects,
    labelField: (item: any) => item.name,
    dateField: 'createdAt',
    categoryField: 'status',
  })
}

// Helper function to generate team widgets
async function generateTeamWidget(params: any, startDate: Date, endDate: Date) {
  const users = await prisma.user.findMany({
    where: {
      role: { not: 'CLIENT' },
      isActive: true,
      ...(params.filters?.userIds?.length && { id: { in: params.filters.userIds } }),
    },
    include: {
      _count: {
        select: {
          assignedTasks: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
            },
          },
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
        select: { hours: true },
      },
    },
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { name: 'asc' },
    take: params.limit,
  })

  return formatWidgetData(params.widgetType, users, params, {
    valueField: (item: any) => item.timeEntries.reduce((sum: number, entry: any) => sum + entry.hours, 0),
    labelField: (item: any) => item.name,
    dateField: 'createdAt',
    categoryField: 'role',
  })
}

// Helper function to generate budget widgets
async function generateBudgetWidget(params: any, startDate: Date, endDate: Date) {
  const budgets = await prisma.budget.findMany({
    where: {
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
      ...(params.filters?.clientIds?.length && { clientId: { in: params.filters.clientIds } }),
      ...(params.filters?.projectIds?.length && { projectId: { in: params.filters.projectIds } }),
    },
    include: {
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { createdAt: 'desc' },
    take: params.limit,
  })

  // Calculate utilization for each budget
  const budgetsWithUtilization = await Promise.all(
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

      return {
        ...budget,
        utilization,
        spent: totalSpent,
      }
    })
  )

  return formatWidgetData(params.widgetType, budgetsWithUtilization, params, {
    valueField: (item: any) => item.utilization,
    labelField: (item: any) => item.name,
    dateField: 'createdAt',
    categoryField: 'status',
  })
}

// Helper function to generate time entry widgets
async function generateTimeEntryWidget(params: any, startDate: Date, endDate: Date) {
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
    orderBy: params.sortBy ? { [params.sortBy]: params.sortOrder } : { date: 'desc' },
    take: params.limit,
  })

  return formatWidgetData(params.widgetType, timeEntries, params, {
    valueField: (item: any) => item.hours,
    labelField: (item: any) => item.user?.name || 'Unknown User',
    dateField: 'date',
    categoryField: 'task.project.name',
  })
}

// Helper function to generate custom widgets
async function generateCustomWidget(params: any, startDate: Date, endDate: Date) {
  // This is a simplified implementation for custom queries
  // In a real application, you'd implement proper query building and validation
  
  return {
    message: 'Custom widget generation is not fully implemented in this demo',
    query: params.customQuery,
    data: [],
  }
}

// Helper function to format widget data based on widget type
function formatWidgetData(widgetType: string, data: any[], params: any, fieldConfig: any) {
  const { valueField, labelField, dateField, categoryField } = fieldConfig

  switch (widgetType) {
    case 'stat_card':
      const total = data.reduce((sum, item) => sum + (typeof valueField === 'function' ? valueField(item) : item[valueField] || 0), 0)
      const average = data.length > 0 ? total / data.length : 0
      const count = data.length
      
      return {
        value: params.aggregation === 'avg' ? average : params.aggregation === 'count' ? count : total,
        label: `Total ${params.dataSource}`,
        change: 0, // Would calculate from previous period
        trend: 'up', // Would calculate from previous period
      }

    case 'chart_line':
    case 'chart_area':
      const timeSeriesData = groupDataByTime(data, params.groupBy || 'day', dateField, valueField)
      return {
        labels: timeSeriesData.map((d: any) => d.period),
        datasets: [{
          label: params.dataSource,
          data: timeSeriesData.map((d: any) => d.value),
        }],
      }

    case 'chart_bar':
      const groupedData = groupDataByCategory(data, params.groupBy || categoryField, valueField)
      return {
        labels: Object.keys(groupedData),
        datasets: [{
          label: params.dataSource,
          data: Object.values(groupedData),
        }],
      }

    case 'chart_pie':
      const pieData = groupDataByCategory(data, params.groupBy || categoryField, valueField)
      return {
        labels: Object.keys(pieData),
        data: Object.values(pieData),
      }

    case 'table_data':
      return {
        columns: [
          { key: 'label', title: 'Name' },
          { key: 'value', title: 'Value' },
          { key: 'category', title: 'Category' },
        ],
        rows: data.slice(0, params.limit).map(item => ({
          label: typeof labelField === 'function' ? labelField(item) : item[labelField],
          value: typeof valueField === 'function' ? valueField(item) : item[valueField],
          category: typeof categoryField === 'function' ? categoryField(item) : item[categoryField],
        })),
      }

    case 'progress_bar':
      const progressValue = data.reduce((sum, item) => sum + (typeof valueField === 'function' ? valueField(item) : item[valueField] || 0), 0)
      const maxValue = Math.max(...data.map(item => typeof valueField === 'function' ? valueField(item) : item[valueField] || 0))
      return {
        value: progressValue,
        max: maxValue,
        percentage: maxValue > 0 ? (progressValue / maxValue) * 100 : 0,
        label: `${params.dataSource} Progress`,
      }

    case 'metric_comparison':
      const currentPeriod = data.reduce((sum, item) => sum + (typeof valueField === 'function' ? valueField(item) : item[valueField] || 0), 0)
      // Would compare with previous period in real implementation
      return {
        current: currentPeriod,
        previous: currentPeriod * 0.9, // Mock previous period
        change: 10, // Mock change percentage
        trend: 'up',
      }

    case 'activity_feed':
      return {
        activities: data.slice(0, params.limit).map(item => ({
          id: item.id,
          title: typeof labelField === 'function' ? labelField(item) : item[labelField],
          description: `${params.dataSource} activity`,
          timestamp: item[dateField],
          type: params.dataSource,
        })),
      }

    case 'kpi_grid':
      const kpis = [
        {
          label: 'Total',
          value: data.reduce((sum, item) => sum + (typeof valueField === 'function' ? valueField(item) : item[valueField] || 0), 0),
          change: 5.2,
          trend: 'up',
        },
        {
          label: 'Average',
          value: data.length > 0 ? data.reduce((sum, item) => sum + (typeof valueField === 'function' ? valueField(item) : item[valueField] || 0), 0) / data.length : 0,
          change: -2.1,
          trend: 'down',
        },
        {
          label: 'Count',
          value: data.length,
          change: 8.7,
          trend: 'up',
        },
      ]
      return { kpis }

    case 'trend_indicator':
      const trendValue = data.reduce((sum, item) => sum + (typeof valueField === 'function' ? valueField(item) : item[valueField] || 0), 0)
      return {
        value: trendValue,
        trend: 'up', // Would calculate from historical data
        change: 12.5, // Would calculate from previous period
        label: `${params.dataSource} Trend`,
      }

    case 'gauge':
      const gaugeValue = data.reduce((sum, item) => sum + (typeof valueField === 'function' ? valueField(item) : item[valueField] || 0), 0)
      const gaugeMax = Math.max(100, gaugeValue * 1.2) // Dynamic max or fixed
      return {
        value: gaugeValue,
        min: 0,
        max: gaugeMax,
        thresholds: [
          { value: gaugeMax * 0.3, color: 'red' },
          { value: gaugeMax * 0.7, color: 'yellow' },
          { value: gaugeMax, color: 'green' },
        ],
      }

    default:
      return {
        data: data.slice(0, params.limit),
        total: data.length,
      }
  }
}

// Helper function to group data by time period
function groupDataByTime(data: any[], groupBy: string, dateField: string, valueField: any) {
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

    const itemValue = typeof valueField === 'function' ? valueField(item) : item[valueField] || 0
    acc[periodKey].value += itemValue
    acc[periodKey].count++

    return acc
  }, {} as Record<string, any>)

  return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period))
}

// Helper function to group data by category
function groupDataByCategory(data: any[], categoryField: string | ((item: any) => string), valueField: any) {
  return data.reduce((acc, item) => {
    const category = typeof categoryField === 'function' ? categoryField(item) : item[categoryField] || 'Unknown'
    const value = typeof valueField === 'function' ? valueField(item) : item[valueField] || 0
    
    acc[category] = (acc[category] || 0) + value
    return acc
  }, {} as Record<string, number>)
}