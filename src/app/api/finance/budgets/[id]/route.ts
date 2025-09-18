import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for updating budget
const updateBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').optional(),
  description: z.string().optional(),
  totalAmount: z.number().min(0, 'Total amount must be positive').optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  categories: z.array(z.object({
    category: z.enum(['OFFICE_SUPPLIES', 'TRAVEL', 'MEALS', 'SOFTWARE', 'HARDWARE', 'MARKETING', 'UTILITIES', 'RENT', 'INSURANCE', 'PROFESSIONAL_SERVICES', 'OTHER']),
    allocatedAmount: z.number().min(0, 'Allocated amount must be positive'),
    description: z.string().optional(),
  })).optional(),
  alertThreshold: z.number().min(0).max(100, 'Alert threshold must be between 0 and 100').optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
})

// GET /api/finance/budgets/[id] - Get a specific budget with detailed utilization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      )
    }

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
                email: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Get expenses for this budget period
    const expenseWhere: any = {
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
      select: {
        id: true,
        title: true,
        amount: true,
        taxAmount: true,
        category: true,
        date: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate detailed utilization
    const totalSpent = expenses.reduce(
      (sum, expense) => sum + expense.amount + expense.taxAmount,
      0
    )

    const categorySpending = expenses.reduce((acc, expense) => {
      const category = expense.category
      if (!acc[category]) {
        acc[category] = {
          spent: 0,
          allocated: 0,
          count: 0,
          expenses: [],
        }
      }
      acc[category].spent += expense.amount + expense.taxAmount
      acc[category].count += 1
      acc[category].expenses.push(expense)
      return acc
    }, {} as Record<string, any>)

    // Add allocated amounts from budget categories
    if (budget.categories && Array.isArray(budget.categories)) {
      budget.categories.forEach((budgetCategory: any) => {
        const category = budgetCategory.category
        if (!categorySpending[category]) {
          categorySpending[category] = {
            spent: 0,
            allocated: budgetCategory.allocatedAmount,
            count: 0,
            expenses: [],
          }
        } else {
          categorySpending[category].allocated = budgetCategory.allocatedAmount
        }
      })
    }

    // Calculate category utilization percentages
    Object.keys(categorySpending).forEach(category => {
      const cat = categorySpending[category]
      cat.utilizationPercentage = cat.allocated > 0 
        ? (cat.spent / cat.allocated) * 100 
        : 0
      cat.remainingAmount = cat.allocated - cat.spent
      cat.isOverBudget = cat.spent > cat.allocated
    })

    const utilizationPercentage = budget.totalAmount > 0 
      ? (totalSpent / budget.totalAmount) * 100 
      : 0

    const remainingAmount = budget.totalAmount - totalSpent
    const isOverBudget = totalSpent > budget.totalAmount
    const isNearThreshold = utilizationPercentage >= budget.alertThreshold

    // Calculate time-based metrics
    const now = new Date()
    const totalDays = Math.ceil(
      (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysElapsed = Math.max(0, Math.ceil(
      (now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ))
    const daysRemaining = Math.max(0, Math.ceil(
      (budget.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ))
    const timeElapsedPercentage = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0

    // Budget health indicators
    const isHealthy = utilizationPercentage <= timeElapsedPercentage + 10 // 10% tolerance
    const burnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0
    const projectedSpend = burnRate * totalDays
    const projectedOverrun = Math.max(0, projectedSpend - budget.totalAmount)

    // Recent spending trend (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentExpenses = expenses.filter(e => new Date(e.date) >= sevenDaysAgo)
    const recentSpending = recentExpenses.reduce(
      (sum, expense) => sum + expense.amount + expense.taxAmount,
      0
    )

    return NextResponse.json({
      ...budget,
      utilization: {
        totalSpent,
        remainingAmount,
        utilizationPercentage,
        isOverBudget,
        isNearThreshold,
        isHealthy,
        categoryBreakdown: categorySpending,
        expenseCount: expenses.length,
        recentSpending,
        recentExpenseCount: recentExpenses.length,
      },
      timeline: {
        totalDays,
        daysElapsed,
        daysRemaining,
        timeElapsedPercentage,
        burnRate,
        projectedSpend,
        projectedOverrun,
      },
      expenses: expenses.slice(0, 10), // Latest 10 expenses
    })
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/finance/budgets/[id] - Update a specific budget
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateBudgetSchema.parse(body)

    const existingBudget = await prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        totalAmount: true,
        projectId: true,
        clientId: true,
      },
    })

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Validate date range if both dates are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    // Check if project exists (if being updated)
    if (validatedData.projectId && validatedData.projectId !== existingBudget.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId },
        select: { id: true, clientId: true },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      // Auto-update client if not explicitly provided
      if (!validatedData.clientId) {
        validatedData.clientId = project.clientId
      }
    }

    // Check if client exists (if being updated)
    if (validatedData.clientId && validatedData.clientId !== existingBudget.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId },
      })

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
    }

    // Validate category allocations don't exceed total budget
    if (validatedData.categories && validatedData.categories.length > 0) {
      const totalAmount = validatedData.totalAmount || existingBudget.totalAmount
      const totalAllocated = validatedData.categories.reduce(
        (sum, cat) => sum + cat.allocatedAmount,
        0
      )

      if (totalAllocated > totalAmount) {
        return NextResponse.json(
          {
            error: 'Total category allocations exceed budget amount',
            totalAllocated,
            budgetAmount: totalAmount,
          },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate)
    }

    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate)
    }

    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
                email: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(updatedBudget)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/budgets/[id] - Delete a specific budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      )
    }

    const existingBudget = await prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        totalAmount: true,
      },
    })

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of active budgets (optional business rule)
    if (existingBudget.isActive) {
      return NextResponse.json(
        {
          error: 'Cannot delete active budget. Please deactivate it first.',
          budget: {
            id: existingBudget.id,
            name: existingBudget.name,
            isActive: existingBudget.isActive,
          },
        },
        { status: 409 }
      )
    }

    await prisma.budget.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Budget deleted successfully',
      deletedBudget: {
        id: existingBudget.id,
        name: existingBudget.name,
        totalAmount: existingBudget.totalAmount,
      },
    })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}