import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for creating expenses
const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  category: z.enum(['OFFICE_SUPPLIES', 'TRAVEL', 'MEALS', 'SOFTWARE', 'HARDWARE', 'MARKETING', 'UTILITIES', 'RENT', 'INSURANCE', 'PROFESSIONAL_SERVICES', 'OTHER']),
  date: z.string().datetime(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  receipt: z.string().optional(), // URL to receipt image
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED']).default('PENDING'),
  isReimbursable: z.boolean().default(true),
  taxAmount: z.number().min(0, 'Tax amount must be positive').default(0),
  notes: z.string().optional(),
})

// Validation schema for updating expenses
const updateExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  category: z.enum(['OFFICE_SUPPLIES', 'TRAVEL', 'MEALS', 'SOFTWARE', 'HARDWARE', 'MARKETING', 'UTILITIES', 'RENT', 'INSURANCE', 'PROFESSIONAL_SERVICES', 'OTHER']).optional(),
  date: z.string().datetime().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  receipt: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED']).optional(),
  isReimbursable: z.boolean().optional(),
  taxAmount: z.number().min(0, 'Tax amount must be positive').optional(),
  notes: z.string().optional(),
})

// GET /api/finance/expenses - Get all expenses with filtering and pagination
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
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const clientId = searchParams.get('clientId')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const isReimbursable = searchParams.get('isReimbursable')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (userId) {
      where.userId = userId
    }

    if (isReimbursable !== null && isReimbursable !== undefined) {
      where.isReimbursable = isReimbursable === 'true'
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
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
        },
      }),
      prisma.expense.count({ where }),
    ])

    // Calculate summary statistics
    const summary = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
        taxAmount: true,
      },
      _count: {
        _all: true,
      },
    })

    const statusCounts = await prisma.expense.groupBy({
      by: ['status'],
      where,
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalTax: summary._sum.taxAmount || 0,
        totalCount: summary._count._all,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count._all,
            amount: item._sum.amount || 0,
          }
          return acc
        }, {} as Record<string, { count: number; amount: number }>),
      },
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/finance/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createExpenseSchema.parse(body)

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

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
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
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/finance/expenses - Bulk update expenses
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
        { error: 'Expense IDs array is required' },
        { status: 400 }
      )
    }

    const validatedData = updateExpenseSchema.parse(data)

    // Check permissions - users can only update their own expenses unless admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    let whereClause: any = { id: { in: ids } }

    if (currentUser?.role !== 'ADMIN') {
      whereClause.userId = session.user.id
    }

    const existingExpenses = await prisma.expense.findMany({
      where: whereClause,
      select: { id: true, status: true },
    })

    if (existingExpenses.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more expenses not found or access denied' },
        { status: 404 }
      )
    }

    // Prevent modification of reimbursed expenses
    const reimbursedExpenses = existingExpenses.filter(
      e => e.status === 'REIMBURSED'
    )

    if (reimbursedExpenses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot modify reimbursed expenses' },
        { status: 409 }
      )
    }

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    const updatedExpenses = await prisma.expense.updateMany({
      where: whereClause,
      data: updateData,
    })

    return NextResponse.json({
      message: `${updatedExpenses.count} expenses updated successfully`,
      updatedCount: updatedExpenses.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error bulk updating expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/expenses - Bulk delete expenses
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
        { error: 'Expense IDs array is required' },
        { status: 400 }
      )
    }

    // Check permissions - users can only delete their own expenses unless admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    let whereClause: any = { id: { in: ids } }

    if (currentUser?.role !== 'ADMIN') {
      whereClause.userId = session.user.id
    }

    const existingExpenses = await prisma.expense.findMany({
      where: whereClause,
      select: { id: true, status: true, title: true },
    })

    if (existingExpenses.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more expenses not found or access denied' },
        { status: 404 }
      )
    }

    // Prevent deletion of approved or reimbursed expenses
    const protectedExpenses = existingExpenses.filter(
      e => e.status === 'APPROVED' || e.status === 'REIMBURSED'
    )

    if (protectedExpenses.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete approved or reimbursed expenses',
          protectedExpenses: protectedExpenses.map(e => ({
            id: e.id,
            title: e.title,
            status: e.status,
          })),
        },
        { status: 409 }
      )
    }

    const deletedExpenses = await prisma.expense.deleteMany({
      where: whereClause,
    })

    return NextResponse.json({
      message: `${deletedExpenses.count} expenses deleted successfully`,
      deletedCount: deletedExpenses.count,
    })
  } catch (error) {
    console.error('Error deleting expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}