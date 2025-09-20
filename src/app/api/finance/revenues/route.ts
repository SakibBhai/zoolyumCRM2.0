import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for revenue creation
const createRevenueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.enum([
    'PROJECT_PAYMENT',
    'CONSULTING',
    'SUBSCRIPTION',
    'LICENSE',
    'MAINTENANCE',
    'SUPPORT',
    'TRAINING',
    'OTHER'
  ]),
  source: z.enum([
    'STRIPE',
    'PAYPAL',
    'BANK_TRANSFER',
    'CHECK',
    'CREDIT_CARD',
    'CASH',
    'CRYPTOCURRENCY',
    'OTHER'
  ]),
  status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']).default('PENDING'),
  date: z.string().datetime(),

  clientId: z.string().optional(),
  projectId: z.string().optional(),

  taxAmount: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
})

// Validation schema for revenue updates
const updateRevenueSchema = createRevenueSchema.partial()

// Validation schema for bulk operations
const bulkOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  action: z.enum(['delete', 'update_status']),
  data: z.object({
    status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']).optional(),
  }).optional(),
})

// GET /api/finance/revenues - Get all revenues with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeStats = searchParams.get('includeStats') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ]
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (source) {
      where.source = source
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    // Get revenues with related data
    const [revenues, totalCount] = await Promise.all([
      prisma.revenue.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.revenue.count({ where }),
    ])

    let stats = null
    if (includeStats) {
      const [totalRevenue, pendingRevenue, receivedRevenue] = await Promise.all([
        prisma.revenue.aggregate({
          where,
          _sum: { amount: true, taxAmount: true },
        }),
        prisma.revenue.aggregate({
          where: { ...where, status: 'PENDING' },
          _sum: { amount: true, taxAmount: true },
          _count: true,
        }),
        prisma.revenue.aggregate({
          where: { ...where, status: 'RECEIVED' },
          _sum: { amount: true, taxAmount: true },
          _count: true,
        }),
      ])

      stats = {
        totalRevenue: (totalRevenue._sum.amount || 0) + (totalRevenue._sum.taxAmount || 0),
        pendingRevenue: (pendingRevenue._sum.amount || 0) + (pendingRevenue._sum.taxAmount || 0),
        receivedRevenue: (receivedRevenue._sum.amount || 0) + (receivedRevenue._sum.taxAmount || 0),
        pendingCount: pendingRevenue._count,
        receivedCount: receivedRevenue._count,
      }
    }

    return NextResponse.json({
      revenues,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching revenues:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/finance/revenues - Create new revenue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRevenueSchema.parse(body)

    // Verify client exists if provided
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

    // Verify project exists if provided
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId },
        include: { client: true },
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      // If both client and project are provided, ensure they match
      if (validatedData.clientId && project.clientId !== validatedData.clientId) {
        return NextResponse.json(
          { error: 'Project does not belong to the specified client' },
          { status: 400 }
        )
      }

      // If only project is provided, set the client from the project
      if (!validatedData.clientId) {
        validatedData.clientId = project.clientId
      }
    }



    const revenue = await prisma.revenue.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),

        userId: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(revenue, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/finance/revenues - Bulk update revenues
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, action, data } = bulkOperationSchema.parse(body)

    if (action === 'update_status' && data?.status) {
      const updatedRevenues = await prisma.revenue.updateMany({
        where: {
          id: { in: ids },
        },
        data: {
          status: data.status,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: `Updated ${updatedRevenues.count} revenues`,
        updatedCount: updatedRevenues.count,
      })
    }

    return NextResponse.json(
      { error: 'Invalid bulk action' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in bulk revenue operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/revenues - Bulk delete revenues
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(body)

    // Check if any revenues are already received (cannot be deleted)
    const receivedRevenues = await prisma.revenue.findMany({
      where: {
        id: { in: ids },
        status: 'RECEIVED',
      },
      select: { id: true, notes: true },
    })

    if (receivedRevenues.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete received revenues',
          receivedRevenues: receivedRevenues.map(r => r.notes || r.id),
        },
        { status: 400 }
      )
    }

    const deletedRevenues = await prisma.revenue.deleteMany({
      where: {
        id: { in: ids },
        status: { not: 'RECEIVED' },
      },
    })

    return NextResponse.json({
      message: `Deleted ${deletedRevenues.count} revenues`,
      deletedCount: deletedRevenues.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error deleting revenues:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}