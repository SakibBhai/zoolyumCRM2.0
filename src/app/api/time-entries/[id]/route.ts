import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for time entry updates
const updateTimeEntrySchema = z.object({
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24').optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().min(0).optional(),
})

// GET /api/time-entries/[id] - Get a specific time entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
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

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this time entry or has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (timeEntry.userId !== session.user.id && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Error fetching time entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/time-entries/[id] - Update a specific time entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTimeEntrySchema.parse(body)

    // Check if time entry exists and user owns it
    const existingTimeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!existingTimeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this time entry or has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (existingTimeEntry.userId !== session.user.id && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check for overlapping time entries if date is being changed
    if (validatedData.date && validatedData.date.getTime() !== existingTimeEntry.date.getTime()) {
      const overlappingEntry = await prisma.timeEntry.findFirst({
        where: {
          userId: existingTimeEntry.userId,
          taskId: existingTimeEntry.taskId,
          date: validatedData.date,
          id: { not: id }, // Exclude current entry
        },
      })

      if (overlappingEntry) {
        return NextResponse.json(
          { error: 'Time entry already exists for this task on this date' },
          { status: 409 }
        )
      }
    }

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
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

    return NextResponse.json(updatedTimeEntry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating time entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-entries/[id] - Delete a specific time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if time entry exists
    const existingTimeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!existingTimeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this time entry or has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (existingTimeEntry.userId !== session.user.id && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.timeEntry.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Time entry deleted successfully',
      id,
    })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}