import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for report parameters
const reportParamsSchema = z.object({
  reportType: z.enum([
    'expense_summary',
    'budget_utilization',
    'client_spending',
    'project_costs',
    'category_breakdown',
    'monthly_trends',
    'quarterly_analysis',
    'yearly_overview',
    'cost_center_analysis',
    'roi_analysis'
  ]),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  categories: z.array(z.string()).optional(),
  includeProjections: z.boolean().default(false),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  currency: z.string().default('USD'),
}).refine(
  (data) => new Date(data.dateTo) > new Date(data.dateFrom),
  {
    message: 'End date must be after start date',
    path: ['dateTo'],
  }
)

// GET /api/finance/reports - Generate financial reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') || 'expense_summary'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const categories = searchParams.get('categories')?.split(',').filter(Boolean)
    const includeProjections = searchParams.get('includeProjections') === 'true'
    const groupBy = searchParams.get('groupBy') || 'month'
    const currency = searchParams.get('currency') || 'USD'

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'dateFrom and dateTo parameters are required' },
        { status: 400 }
      )
    }

    const validatedParams = reportParamsSchema.parse({
      reportType,
      dateFrom,
      dateTo,
      clientId,
      projectId,
      userId,
      categories,
      includeProjections,
      groupBy,
      currency,
    })

    const startDate = new Date(validatedParams.dateFrom)
    const endDate = new Date(validatedParams.dateTo)

    // Build base where clause for expenses
    const baseWhere: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (validatedParams.clientId) {
      baseWhere.clientId = validatedParams.clientId
    }

    if (validatedParams.projectId) {
      baseWhere.projectId = validatedParams.projectId
    }

    if (validatedParams.userId) {
      baseWhere.userId = validatedParams.userId
    }

    if (validatedParams.categories && validatedParams.categories.length > 0) {
      baseWhere.category = { in: validatedParams.categories }
    }

    let reportData: any = {}

    switch (validatedParams.reportType) {
      case 'expense_summary':
        reportData = await generateExpenseSummaryReport(baseWhere, validatedParams)
        break
      case 'budget_utilization':
        reportData = await generateBudgetUtilizationReport(baseWhere, validatedParams)
        break
      case 'client_spending':
        reportData = await generateClientSpendingReport(baseWhere, validatedParams)
        break
      case 'project_costs':
        reportData = await generateProjectCostsReport(baseWhere, validatedParams)
        break
      case 'category_breakdown':
        reportData = await generateCategoryBreakdownReport(baseWhere, validatedParams)
        break
      case 'monthly_trends':
        reportData = await generateMonthlyTrendsReport(baseWhere, validatedParams)
        break
      case 'quarterly_analysis':
        reportData = await generateQuarterlyAnalysisReport(baseWhere, validatedParams)
        break
      case 'yearly_overview':
        reportData = await generateYearlyOverviewReport(baseWhere, validatedParams)
        break
      case 'cost_center_analysis':
        reportData = await generateCostCenterAnalysisReport(baseWhere, validatedParams)
        break
      case 'roi_analysis':
        reportData = await generateROIAnalysisReport(baseWhere, validatedParams)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      reportType: validatedParams.reportType,
      parameters: validatedParams,
      generatedAt: new Date().toISOString(),
      data: reportData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating financial report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate expense summary report
async function generateExpenseSummaryReport(baseWhere: any, params: any) {
  const expenses = await prisma.expense.findMany({
    where: baseWhere,
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, company: true } },
    },
    orderBy: { date: 'desc' },
  })

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount + exp.taxAmount, 0)
  const totalExpenses = expenses.length
  const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0

  const statusBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + exp.amount + exp.taxAmount
    return acc
  }, {} as Record<string, number>)

  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount + exp.taxAmount
    return acc
  }, {} as Record<string, number>)

  const userBreakdown = expenses.reduce((acc, exp) => {
    const userId = exp.user.id
    if (!acc[userId]) {
      acc[userId] = {
        user: exp.user,
        totalAmount: 0,
        expenseCount: 0,
      }
    }
    acc[userId].totalAmount += exp.amount + exp.taxAmount
    acc[userId].expenseCount += 1
    return acc
  }, {} as Record<string, any>)

  return {
    summary: {
      totalAmount,
      totalExpenses,
      averageExpense,
    },
    breakdowns: {
      byStatus: statusBreakdown,
      byCategory: categoryBreakdown,
      byUser: Object.values(userBreakdown),
    },
    expenses: expenses.slice(0, 50), // Latest 50 expenses
  }
}

// Helper function to generate budget utilization report
async function generateBudgetUtilizationReport(baseWhere: any, params: any) {
  const budgets = await prisma.budget.findMany({
    where: {
      OR: [
        {
          startDate: { lte: new Date(params.dateTo) },
          endDate: { gte: new Date(params.dateFrom) },
        },
      ],
      ...(params.clientId && { clientId: params.clientId }),
      ...(params.projectId && { projectId: params.projectId }),
    },
    include: {
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, company: true } },
    },
  })

  const budgetUtilization = await Promise.all(
    budgets.map(async (budget) => {
      const expenseWhere = {
        ...baseWhere,
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      }

      if (budget.projectId) {
        expenseWhere.projectId = budget.projectId
      }

      if (budget.clientId) {
        expenseWhere.clientId = budget.clientId
      }

      const expenses = await prisma.expense.findMany({
        where: expenseWhere,
        select: { amount: true, taxAmount: true, category: true },
      })

      const totalSpent = expenses.reduce(
        (sum, exp) => sum + exp.amount + exp.taxAmount,
        0
      )

      const utilizationPercentage = budget.totalAmount > 0 
        ? (totalSpent / budget.totalAmount) * 100 
        : 0

      return {
        budget,
        totalSpent,
        remainingAmount: budget.totalAmount - totalSpent,
        utilizationPercentage,
        isOverBudget: totalSpent > budget.totalAmount,
        expenseCount: expenses.length,
      }
    })
  )

  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalSpentAmount = budgetUtilization.reduce((sum, b) => sum + b.totalSpent, 0)
  const overallUtilization = totalBudgetAmount > 0 
    ? (totalSpentAmount / totalBudgetAmount) * 100 
    : 0

  return {
    summary: {
      totalBudgets: budgets.length,
      totalBudgetAmount,
      totalSpentAmount,
      overallUtilization,
      overBudgetCount: budgetUtilization.filter(b => b.isOverBudget).length,
    },
    budgets: budgetUtilization,
  }
}

// Helper function to generate client spending report
async function generateClientSpendingReport(baseWhere: any, params: any) {
  const expenses = await prisma.expense.findMany({
    where: baseWhere,
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  })

  const clientSpending = expenses.reduce((acc, exp) => {
    if (!exp.client) return acc
    
    const clientId = exp.client.id
    if (!acc[clientId]) {
      acc[clientId] = {
        client: exp.client,
        totalAmount: 0,
        expenseCount: 0,
        projects: new Set(),
        categories: {},
      }
    }
    
    acc[clientId].totalAmount += exp.amount + exp.taxAmount
    acc[clientId].expenseCount += 1
    
    if (exp.project) {
      acc[clientId].projects.add(exp.project.name)
    }
    
    acc[clientId].categories[exp.category] = 
      (acc[clientId].categories[exp.category] || 0) + exp.amount + exp.taxAmount
    
    return acc
  }, {} as Record<string, any>)

  // Convert Set to Array for JSON serialization
  Object.values(clientSpending).forEach((client: any) => {
    client.projects = Array.from(client.projects)
  })

  const sortedClients = Object.values(clientSpending)
    .sort((a: any, b: any) => b.totalAmount - a.totalAmount)

  return {
    summary: {
      totalClients: sortedClients.length,
      totalSpending: sortedClients.reduce((sum: number, c: any) => sum + c.totalAmount, 0),
    },
    clients: sortedClients,
  }
}

// Helper function to generate project costs report
async function generateProjectCostsReport(baseWhere: any, params: any) {
  const expenses = await prisma.expense.findMany({
    where: baseWhere,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          budget: true,
          client: { select: { id: true, name: true, company: true } },
        },
      },
    },
  })

  const projectCosts = expenses.reduce((acc, exp) => {
    if (!exp.project) return acc
    
    const projectId = exp.project.id
    if (!acc[projectId]) {
      acc[projectId] = {
        project: exp.project,
        totalCost: 0,
        expenseCount: 0,
        categories: {},
      }
    }
    
    acc[projectId].totalCost += exp.amount + exp.taxAmount
    acc[projectId].expenseCount += 1
    acc[projectId].categories[exp.category] = 
      (acc[projectId].categories[exp.category] || 0) + exp.amount + exp.taxAmount
    
    return acc
  }, {} as Record<string, any>)

  const sortedProjects = Object.values(projectCosts)
    .sort((a: any, b: any) => b.totalCost - a.totalCost)
    .map((project: any) => ({
      ...project,
      budgetUtilization: project.project.budget > 0 
        ? (project.totalCost / project.project.budget) * 100 
        : 0,
      isOverBudget: project.project.budget > 0 && project.totalCost > project.project.budget,
    }))

  return {
    summary: {
      totalProjects: sortedProjects.length,
      totalCosts: sortedProjects.reduce((sum: number, p: any) => sum + p.totalCost, 0),
      overBudgetProjects: sortedProjects.filter((p: any) => p.isOverBudget).length,
    },
    projects: sortedProjects,
  }
}

// Helper function to generate category breakdown report
async function generateCategoryBreakdownReport(baseWhere: any, params: any) {
  const expenses = await prisma.expense.findMany({
    where: baseWhere,
    select: { amount: true, taxAmount: true, category: true, date: true },
  })

  const categoryBreakdown = expenses.reduce((acc, exp) => {
    const category = exp.category
    if (!acc[category]) {
      acc[category] = {
        category,
        totalAmount: 0,
        expenseCount: 0,
        averageAmount: 0,
      }
    }
    
    acc[category].totalAmount += exp.amount + exp.taxAmount
    acc[category].expenseCount += 1
    
    return acc
  }, {} as Record<string, any>)

  // Calculate averages
  Object.values(categoryBreakdown).forEach((cat: any) => {
    cat.averageAmount = cat.expenseCount > 0 ? cat.totalAmount / cat.expenseCount : 0
  })

  const sortedCategories = Object.values(categoryBreakdown)
    .sort((a: any, b: any) => b.totalAmount - a.totalAmount)

  const totalAmount = sortedCategories.reduce((sum: number, c: any) => sum + c.totalAmount, 0)

  // Add percentage of total
  sortedCategories.forEach((cat: any) => {
    cat.percentageOfTotal = totalAmount > 0 ? (cat.totalAmount / totalAmount) * 100 : 0
  })

  return {
    summary: {
      totalCategories: sortedCategories.length,
      totalAmount,
      topCategory: sortedCategories[0]?.category || null,
    },
    categories: sortedCategories,
  }
}

// Helper function to generate monthly trends report
async function generateMonthlyTrendsReport(baseWhere: any, params: any) {
  const expenses = await prisma.expense.findMany({
    where: baseWhere,
    select: { amount: true, taxAmount: true, date: true, category: true },
    orderBy: { date: 'asc' },
  })

  const monthlyData = expenses.reduce((acc, exp) => {
    const monthKey = exp.date.toISOString().substring(0, 7) // YYYY-MM
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalAmount: 0,
        expenseCount: 0,
        categories: {},
      }
    }
    
    acc[monthKey].totalAmount += exp.amount + exp.taxAmount
    acc[monthKey].expenseCount += 1
    acc[monthKey].categories[exp.category] = 
      (acc[monthKey].categories[exp.category] || 0) + exp.amount + exp.taxAmount
    
    return acc
  }, {} as Record<string, any>)

  const sortedMonths = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))

  // Calculate month-over-month growth
  sortedMonths.forEach((month: any, index: number) => {
    if (index > 0) {
      const prevMonth = sortedMonths[index - 1] as any
      month.growthRate = prevMonth.totalAmount > 0 
        ? ((month.totalAmount - prevMonth.totalAmount) / prevMonth.totalAmount) * 100 
        : 0
    } else {
      month.growthRate = 0
    }
  })

  return {
    summary: {
      totalMonths: sortedMonths.length,
      averageMonthlySpending: sortedMonths.length > 0 
        ? sortedMonths.reduce((sum: number, m: any) => sum + m.totalAmount, 0) / sortedMonths.length 
        : 0,
      highestMonth: sortedMonths.reduce((max: any, m: any) => 
        m.totalAmount > (max?.totalAmount || 0) ? m : max, null),
      lowestMonth: sortedMonths.reduce((min: any, m: any) => 
        m.totalAmount < (min?.totalAmount || Infinity) ? m : min, null),
    },
    months: sortedMonths,
  }
}

// Placeholder functions for other report types
async function generateQuarterlyAnalysisReport(baseWhere: any, params: any) {
  // Implementation similar to monthly trends but grouped by quarters
  return { message: 'Quarterly analysis report - implementation pending' }
}

async function generateYearlyOverviewReport(baseWhere: any, params: any) {
  // Implementation for yearly overview
  return { message: 'Yearly overview report - implementation pending' }
}

async function generateCostCenterAnalysisReport(baseWhere: any, params: any) {
  // Implementation for cost center analysis
  return { message: 'Cost center analysis report - implementation pending' }
}

async function generateROIAnalysisReport(baseWhere: any, params: any) {
  // Implementation for ROI analysis
  return { message: 'ROI analysis report - implementation pending' }
}