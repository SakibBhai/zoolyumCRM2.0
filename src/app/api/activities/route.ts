import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for creating activities
const createActivitySchema = z.object({
  type: z.enum(['LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_CONVERTED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_COMPLETED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_COMPLETED', 'PROPOSAL_CREATED', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED', 'INVOICE_CREATED', 'INVOICE_SENT', 'INVOICE_PAID', 'PAYMENT_RECEIVED', 'NOTE_ADDED', 'FILE_UPLOADED', 'EMAIL_SENT', 'CALL_LOGGED', 'MEETING_SCHEDULED', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
  entityType: z.enum(['LEAD', 'CLIENT', 'PROJECT', 'TASK', 'PROPOSAL', 'INVOICE', 'USER', 'OTHER']).optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// GET /api/activities - Get all activities with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (entityId) {
      where.entityId = entityId
    }

    if (userId) {
      where.userId = userId
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
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
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/activities - Create a new activity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createActivitySchema.parse(body)

    const activity = await prisma.activity.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities - Delete multiple activities
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can delete activities' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json(
        { error: 'No activity IDs provided' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',')

    const deletedActivities = await prisma.activity.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    return NextResponse.json({
      message: `Deleted ${deletedActivities.count} activities`,
      count: deletedActivities.count,
    })
  } catch (error) {
    console.error('Error deleting activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}