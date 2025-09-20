import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for dashboard parameters
const dashboardParamsSchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d', '1y', 'custom']).default('30d'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  widgets: z.array(z.enum([
    'overview_stats',
    'revenue_chart',
    'expense_chart',
    'project_status',
    'team_performance',
    'client_activity',
    'task_completion',
    'budget_utilization',
    'recent_activities',
    'top_clients',
    'upcoming_deadlines',
    'financial_summary'
  ])).default([
    'overview_stats',
    'revenue_chart',
    'expense_chart',
    'project_status',
    'recent_activities'
  ]),
  userId: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
})

// GET /api/reports/dashboard - Get dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30d'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const widgets = searchParams.get('widgets')?.split(',') || [
      'overview_stats',
      'revenue_chart',
      'expense_chart',
      'project_status',
      'recent_activities'
    ]
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')

    const validatedParams = dashboardParamsSchema.parse({
      dateRange,
      dateFrom,
      dateTo,
      widgets,
      userId,
      clientId,
      projectId,
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
        '1y': 365,
      }
      const days = daysMap[validatedParams.dateRange] || 30

      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    const dashboardData: any = {
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        period: validatedParams.dateRange,
      },
      widgets: {},
    }

    // Build base filters
    const baseFilters: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (validatedParams.userId) {
      baseFilters.userId = validatedParams.userId
    }

    if (validatedParams.clientId) {
      baseFilters.clientId = validatedParams.clientId
    }

    if (validatedParams.projectId) {
      baseFilters.projectId = validatedParams.projectId
    }

    // Generate requested widgets
    for (const widget of validatedParams.widgets) {
      switch (widget) {
        case 'overview_stats':
          dashboardData.widgets.overview_stats = await generateOverviewStats(baseFilters, startDate, endDate)
          break
        case 'revenue_chart':
          dashboardData.widgets.revenue_chart = await generateRevenueChart(baseFilters, startDate, endDate)
          break
        case 'expense_chart':
          dashboardData.widgets.expense_chart = await generateExpenseChart(baseFilters, startDate, endDate)
          break
        case 'project_status':
          dashboardData.widgets.project_status = await generateProjectStatus(baseFilters)
          break
        case 'team_performance':
          dashboardData.widgets.team_performance = await generateTeamPerformance(baseFilters, startDate, endDate)
          break
        case 'client_activity':
          dashboardData.widgets.client_activity = await generateClientActivity(baseFilters, startDate, endDate)
          break
        case 'task_completion':
          dashboardData.widgets.task_completion = await generateTaskCompletion(baseFilters, startDate, endDate)
          break
        case 'budget_utilization':
          dashboardData.widgets.budget_utilization = await generateBudgetUtilization(baseFilters, startDate, endDate)
          break
        case 'recent_activities':
          dashboardData.widgets.recent_activities = await generateRecentActivities(baseFilters)
          break
        case 'top_clients':
          dashboardData.widgets.top_clients = await generateTopClients(baseFilters, startDate, endDate)
          break
        case 'upcoming_deadlines':
          dashboardData.widgets.upcoming_deadlines = await generateUpcomingDeadlines()
          break
        case 'financial_summary':
          dashboardData.widgets.financial_summary = await generateFinancialSummary(baseFilters, startDate, endDate)
          break
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate overview statistics
async function generateOverviewStats(baseFilters: any, startDate: Date, endDate: Date) {
  const [clients, projects, tasks, revenues, expenses] = await Promise.all([
    prisma.client.count({
      where: {
        ...baseFilters,
      },
    }),
    prisma.project.count({
      where: baseFilters,
    }),
    prisma.task.count({
      where: baseFilters,
    }),
    prisma.revenue.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        status: 'RECEIVED',
      },
      _sum: { amount: true, taxAmount: true },
    }),
    prisma.expense.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        status: 'APPROVED',
      },
      _sum: { amount: true, taxAmount: true },
    }),
  ])

  const totalRevenue = (revenues._sum.amount || 0) + (revenues._sum.taxAmount || 0)
  const totalExpenses = (expenses._sum.amount || 0) + (expenses._sum.taxAmount || 0)
  const profit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

  return {
    clients: {
      total: clients,
      label: 'Active Clients',
    },
    projects: {
      total: projects,
      label: 'Total Projects',
    },
    tasks: {
      total: tasks,
      label: 'Total Tasks',
    },
    revenue: {
      total: totalRevenue,
      label: 'Total Revenue',
      currency: 'USD',
    },
    expenses: {
      total: totalExpenses,
      label: 'Total Expenses',
      currency: 'USD',
    },
    profit: {
      total: profit,
      margin: profitMargin,
      label: 'Net Profit',
      currency: 'USD',
    },
  }
}

// Helper function to generate revenue chart data
async function generateRevenueChart(baseFilters: any, startDate: Date, endDate: Date) {
  const revenues = await prisma.revenue.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'RECEIVED',
    },
    select: {
      amount: true,
      taxAmount: true,
      date: true,
      category: true,
    },
    orderBy: { date: 'asc' },
  })

  // Group by day
  const dailyRevenue = revenues.reduce((acc, revenue) => {
    const dateKey = revenue.date.toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = 0
    }
    acc[dateKey] += revenue.amount + revenue.taxAmount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(dailyRevenue)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    data: chartData,
    total: revenues.reduce((sum, r) => sum + r.amount + r.taxAmount, 0),
    count: revenues.length,
  }
}

// Helper function to generate expense chart data
async function generateExpenseChart(baseFilters: any, startDate: Date, endDate: Date) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    select: {
      amount: true,
      taxAmount: true,
      date: true,
      category: true,
      status: true,
    },
    orderBy: { date: 'asc' },
  })

  // Group by day
  const dailyExpenses = expenses.reduce((acc, expense) => {
    const dateKey = expense.date.toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = 0
    }
    acc[dateKey] += expense.amount + expense.taxAmount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(dailyExpenses)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0
    }
    acc[expense.category] += expense.amount + expense.taxAmount
    return acc
  }, {} as Record<string, number>)

  return {
    data: chartData,
    categoryBreakdown,
    total: expenses.reduce((sum, e) => sum + e.amount + e.taxAmount, 0),
    count: expenses.length,
  }
}

// Helper function to generate project status data
async function generateProjectStatus(baseFilters: any) {
  const projects = await prisma.project.groupBy({
    by: ['status'],
    _count: true,
    where: baseFilters,
  })

  const statusData = projects.map(project => ({
    status: project.status,
    count: project._count,
  }))

  const totalProjects = projects.reduce((sum, p) => sum + p._count, 0)

  return {
    data: statusData,
    total: totalProjects,
  }
}

// Helper function to generate team performance data
async function generateTeamPerformance(baseFilters: any, startDate: Date, endDate: Date) {
  const teamStats = await prisma.user.findMany({
    where: {
      role: { not: 'CLIENT' },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          assignedTasks: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
            },
          },
          createdTasks: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    },
    take: 10,
  })

  return {
    data: teamStats.map(user => ({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      assignedTasks: user._count.assignedTasks,
      createdTasks: user._count.createdTasks,
      totalTasks: user._count.assignedTasks + user._count.createdTasks,
    })),
  }
}

// Helper function to generate client activity data
async function generateClientActivity(baseFilters: any, startDate: Date, endDate: Date) {
  const clientActivity = await prisma.client.findMany({
    where: {
      // Remove status filter as Client model doesn't have status field
    },
    select: {
      id: true,
      name: true,
      company: true,
      _count: {
        select: {
          projects: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
            },
          },
          revenues: {
            where: {
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    },
    orderBy: {
      projects: {
        _count: 'desc',
      },
    },
    take: 10,
  })

  return {
    data: clientActivity.map(client => ({
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
      },
      projectCount: client._count.projects,
      revenueCount: client._count.revenues,
    })),
  }
}

// Helper function to generate task completion data
async function generateTaskCompletion(baseFilters: any, startDate: Date, endDate: Date) {
  const tasks = await prisma.task.groupBy({
    by: ['status'],
    _count: true,
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  const completionData = tasks.map(task => ({
    status: task.status,
    count: task._count,
  }))

  const totalTasks = tasks.reduce((sum, t) => sum + t._count, 0)
  const completedTasks = tasks.find(t => t.status === 'DONE')?._count || 0
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return {
    data: completionData,
    total: totalTasks,
    completed: completedTasks,
    completionRate,
  }
}

// Helper function to generate budget utilization data
async function generateBudgetUtilization(baseFilters: any, startDate: Date, endDate: Date) {
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
    take: 10,
  })

  const utilizationData = await Promise.all(
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
        budget: {
          id: budget.id,
          name: budget.name,
          totalAmount: budget.totalAmount,
        },
        project: budget.project,
        client: budget.client,
        spent: totalSpent,
        remaining: budget.totalAmount - totalSpent,
        utilization,
        isOverBudget: totalSpent > budget.totalAmount,
      }
    })
  )

  return {
    data: utilizationData,
  }
}

// Helper function to generate recent activities
async function generateRecentActivities(baseFilters: any) {
  // This would typically come from an activity log table
  // For now, we'll simulate with recent records
  const [recentProjects, recentTasks, recentExpenses] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        client: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        project: { select: { name: true } },
      },
    }),
    prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        description: true,
        amount: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ])

  const activities = [
    ...recentProjects.map(p => ({
      type: 'project',
      id: p.id,
      title: `New project: ${p.name}`,
      subtitle: `Client: ${p.client?.name}`,
      timestamp: p.createdAt,
    })),
    ...recentTasks.map(t => ({
      type: 'task',
      id: t.id,
      title: `Task ${t.status.toLowerCase()}: ${t.title}`,
      subtitle: `Project: ${t.project?.name}`,
      timestamp: t.updatedAt,
    })),
    ...recentExpenses.map(e => ({
      type: 'expense',
      id: e.id,
      title: `New expense: ${e.description}`,
      subtitle: `$${e.amount} by ${e.user?.name}`,
      timestamp: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return {
    data: activities,
  }
}

// Helper function to generate top clients data
async function generateTopClients(baseFilters: any, startDate: Date, endDate: Date) {
  const topClients = await prisma.client.findMany({
    where: {
      // Remove status filter as Client model doesn't have status field
    },
    select: {
      id: true,
      name: true,
      company: true,
      revenues: {
        where: {
          date: { gte: startDate, lte: endDate },
          status: 'RECEIVED',
        },
        select: {
          amount: true,
          taxAmount: true,
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
  })

  const clientsWithRevenue = topClients
    .map(client => {
      const totalRevenue = client.revenues.reduce(
        (sum, r) => sum + r.amount + r.taxAmount,
        0
      )
      return {
        client: {
          id: client.id,
          name: client.name,
          company: client.company,
        },
        totalRevenue,
        projectCount: client._count.projects,
        revenueCount: client.revenues.length,
      }
    })
    .filter(c => c.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)

  return {
    data: clientsWithRevenue,
  }
}

// Helper function to generate upcoming deadlines
async function generateUpcomingDeadlines() {
  const now = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(now.getDate() + 7)

  const [upcomingTasks, upcomingProjects] = await Promise.all([
    prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: nextWeek,
        },
        status: { not: 'DONE' },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    prisma.project.findMany({
      where: {
        endDate: {
          gte: now,
          lte: nextWeek,
        },
        status: { not: 'COMPLETED' },
      },
      select: {
        id: true,
        name: true,
        endDate: true,
        status: true,
        client: { select: { name: true } },
      },
      orderBy: { endDate: 'asc' },
      take: 5,
    }),
  ])

  const deadlines = [
    ...upcomingTasks.map(t => ({
      type: 'task',
      id: t.id,
      title: t.title,
      subtitle: `Project: ${t.project?.name} | Assigned to: ${t.assignee?.name}`,
      dueDate: t.dueDate,
      priority: t.priority,
    })),
    ...upcomingProjects.map(p => ({
      type: 'project',
      id: p.id,
      title: p.name,
      subtitle: `Client: ${p.client?.name}`,
      dueDate: p.endDate,
      priority: 'MEDIUM',
    })),
  ].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  return {
    data: deadlines,
  }
}

// Helper function to generate financial summary
async function generateFinancialSummary(baseFilters: any, startDate: Date, endDate: Date) {
  const [revenues, expenses, budgets] = await Promise.all([
    prisma.revenue.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true, taxAmount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true, taxAmount: true },
      _count: true,
    }),
    prisma.budget.aggregate({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ])

  const totalRevenue = (revenues._sum.amount || 0) + (revenues._sum.taxAmount || 0)
  const totalExpenses = (expenses._sum.amount || 0) + (expenses._sum.taxAmount || 0)
  const totalBudget = budgets._sum.totalAmount || 0
  const profit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
  const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

  return {
    revenue: {
      total: totalRevenue,
      count: revenues._count,
    },
    expenses: {
      total: totalExpenses,
      count: expenses._count,
    },
    budget: {
      total: totalBudget,
      count: budgets._count,
      utilization: budgetUtilization,
    },
    profit: {
      total: profit,
      margin: profitMargin,
    },
  }
}