import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for creating budgets
const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  description: z.string().optional(),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  categories: z.array(z.object({
    category: z.enum(['OFFICE_SUPPLIES', 'TRAVEL', 'MEALS', 'SOFTWARE', 'HARDWARE', 'MARKETING', 'UTILITIES', 'RENT', 'INSURANCE', 'PROFESSIONAL_SERVICES', 'OTHER']),
    allocatedAmount: z.number().min(0, 'Allocated amount must be positive'),
    description: z.string().optional(),
  })).optional(),
  alertThreshold: z.number().min(0).max(100, 'Alert threshold must be between 0 and 100').default(80),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Validation schema for updating budgets
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

// GET /api/finance/budgets - Get all budgets with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const period = searchParams.get('period')
    const projectId = searchParams.get('projectId')
    const clientId = searchParams.get('clientId')
    const isActive = searchParams.get('isActive')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeExpenses = searchParams.get('includeExpenses') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (period) {
      where.period = period
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (dateFrom || dateTo) {
      where.AND = []
      if (dateFrom) {
        where.AND.push({
          OR: [
            { startDate: { gte: new Date(dateFrom) } },
            { endDate: { gte: new Date(dateFrom) } },
          ],
        })
      }
      if (dateTo) {
        where.AND.push({
          startDate: { lte: new Date(dateTo) },
        })
      }
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.budget.count({ where }),
    ])

    // Calculate budget utilization if expenses are included
    let budgetsWithUtilization = budgets

    if (includeExpenses) {
      budgetsWithUtilization = await Promise.all(
        budgets.map(async (budget) => {
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
              amount: true,
              taxAmount: true,
              category: true,
            },
          })

          const totalSpent = expenses.reduce(
            (sum, expense) => sum + expense.amount + expense.taxAmount,
            0
          )

          const categorySpending = expenses.reduce((acc, expense) => {
            const category = expense.category
            if (!acc[category]) {
              acc[category] = 0
            }
            acc[category] += expense.amount + expense.taxAmount
            return acc
          }, {} as Record<string, number>)

          const utilizationPercentage = budget.totalAmount > 0 
            ? (totalSpent / budget.totalAmount) * 100 
            : 0

          const remainingAmount = budget.totalAmount - totalSpent
          const isOverBudget = totalSpent > budget.totalAmount
          const isNearThreshold = utilizationPercentage >= budget.alertThreshold

          return {
            ...budget,
            utilization: {
              totalSpent,
              remainingAmount,
              utilizationPercentage,
              isOverBudget,
              isNearThreshold,
              categorySpending,
              expenseCount: expenses.length,
            },
          }
        })
      )
    }

    // Calculate summary statistics
    const summary = await prisma.budget.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        _all: true,
      },
    })

    const statusCounts = await prisma.budget.groupBy({
      by: ['isActive'],
      where,
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
      },
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      budgets: budgetsWithUtilization,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        totalBudgetAmount: summary._sum.totalAmount || 0,
        totalCount: summary._count._all,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          const status = item.isActive ? 'active' : 'inactive'
          acc[status] = {
            count: item._count._all,
            amount: item._sum.totalAmount || 0,
          }
          return acc
        }, {} as Record<string, { count: number; amount: number }>),
      },
    })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/finance/budgets - Create a new budget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBudgetSchema.parse(body)

    // Check if project exists (if provided)
    if (validatedData.projectId) {
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

      // Auto-assign client if not provided
      if (!validatedData.clientId) {
        validatedData.clientId = project.clientId
      }
    }

    // Check if client exists (if provided)
    if (validatedData.clientId) {
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
      const totalAllocated = validatedData.categories.reduce(
        (sum, cat) => sum + cat.allocatedAmount,
        0
      )

      if (totalAllocated > validatedData.totalAmount) {
        return NextResponse.json(
          {
            error: 'Total category allocations exceed budget amount',
            totalAllocated,
            budgetAmount: validatedData.totalAmount,
          },
          { status: 400 }
        )
      }
    }

    const budget = await prisma.budget.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        categories: validatedData.categories || [],
        createdById: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/finance/budgets - Bulk update budgets
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, data } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Budget IDs array is required' },
        { status: 400 }
      )
    }

    const validatedData = updateBudgetSchema.parse(data)

    // Check if budgets exist
    const existingBudgets = await prisma.budget.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })

    if (existingBudgets.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more budgets not found' },
        { status: 404 }
      )
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

    const updatedBudgets = await prisma.budget.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    return NextResponse.json({
      message: `${updatedBudgets.count} budgets updated successfully`,
      updatedCount: updatedBudgets.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error bulk updating budgets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/budgets - Bulk delete budgets
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Budget IDs array is required' },
        { status: 400 }
      )
    }

    const existingBudgets = await prisma.budget.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, isActive: true },
    })

    if (existingBudgets.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more budgets not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of active budgets (optional business rule)
    const activeBudgets = existingBudgets.filter(b => b.isActive)

    if (activeBudgets.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete active budgets. Please deactivate them first.',
          activeBudgets: activeBudgets.map(b => ({
            id: b.id,
            name: b.name,
          })),
        },
        { status: 409 }
      )
    }

    const deletedBudgets = await prisma.budget.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({
      message: `${deletedBudgets.count} budgets deleted successfully`,
      deletedCount: deletedBudgets.count,
    })
  } catch (error) {
    console.error('Error deleting budgets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}