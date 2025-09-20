import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for creating time entries
const createTimeEntrySchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24'),
  date: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.number().min(0).optional(),
})

// Validation schema for updating time entries
const updateTimeEntrySchema = createTimeEntrySchema.partial().omit({ taskId: true })

// GET /api/time-entries - Get all time entries with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const taskId = searchParams.get('taskId')
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const billable = searchParams.get('billable')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (taskId) {
      where.taskId = taskId
    }

    if (projectId) {
      where.task = {
        projectId: projectId,
      }
    }

    if (userId) {
      where.userId = userId
    }

    if (billable !== null && billable !== undefined) {
      where.billable = billable === 'true'
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

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
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
          task: {
            select: {
              id: true,
              title: true,
              status: true,
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
            },
          },
        },
      }),
      prisma.timeEntry.count({ where }),
    ])

    // Calculate totals
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const billableHours = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0)
    const totalValue = timeEntries.reduce((sum, entry) => {
      if (entry.billable && entry.hourlyRate) {
        return sum + (entry.hours * entry.hourlyRate)
      }
      return sum
    }, 0)

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      timeEntries,
      summary: {
        totalHours,
        billableHours,
        nonBillableHours: totalHours - billableHours,
        totalValue,
      },
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
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/time-entries - Create a new time entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTimeEntrySchema.parse(body)

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: validatedData.taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check for overlapping time entries on the same date
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        taskId: validatedData.taskId,
        date: validatedData.date,
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Time entry already exists for this task on this date. Please update the existing entry.' },
        { status: 409 }
      )
    }

    const timeEntry = await prisma.timeEntry.create({
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
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
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
          },
        },
      },
    })

    return NextResponse.json(timeEntry, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/time-entries - Update multiple time entries (bulk update)
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
        { error: 'Invalid or empty ids array' },
        { status: 400 }
      )
    }

    const validatedData = updateTimeEntrySchema.parse(data)

    // Check if user owns all the time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    })

    if (timeEntries.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some time entries not found or not owned by user' },
        { status: 403 }
      )
    }

    const updatedTimeEntries = await prisma.timeEntry.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `Updated ${updatedTimeEntries.count} time entries`,
      count: updatedTimeEntries.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating time entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-entries - Delete multiple time entries
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json(
        { error: 'No time entry IDs provided' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',')

    // Check if user owns all the time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    })

    if (timeEntries.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some time entries not found or not owned by user' },
        { status: 403 }
      )
    }

    const deletedTimeEntries = await prisma.timeEntry.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      message: `Deleted ${deletedTimeEntries.count} time entries`,
      count: deletedTimeEntries.count,
    })
  } catch (error) {
    console.error('Error deleting time entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}