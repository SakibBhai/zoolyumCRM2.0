import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for project updates
const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  budget: z.number().min(0).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/projects/[id] - Get a specific project
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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,

          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
            timeEntries: {
              select: {
                id: true,
                hours: true,
                date: true,
                description: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { date: 'desc' },
              take: 10,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate project statistics
    const taskStats = {
      total: project.tasks.length,
      todo: project.tasks.filter(t => t.status === 'TODO').length,
      inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: project.tasks.filter(t => t.status === 'DONE').length,
      cancelled: project.tasks.filter(t => t.status === 'CANCELLED').length,
    }

    const totalHours = project.tasks.reduce((sum, task) => {
      return sum + task.timeEntries.reduce((taskSum, entry) => taskSum + entry.hours, 0)
    }, 0)

    const projectWithStats = {
      ...project,
      statistics: {
        taskStats,
        totalHours,
        completionRate: taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0,
      },
    }

    return NextResponse.json(projectWithStats)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update a specific project
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
    const validatedData = updateProjectSchema.parse(body)

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Validate manager if provided
    if (validatedData.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.managerId },
      })

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found' },
          { status: 404 }
        )
      }
    }

    // Validate date range if both dates are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (validatedData.endDate <= validatedData.startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    } else if (validatedData.startDate && existingProject.endDate) {
      if (existingProject.endDate <= validatedData.startDate) {
        return NextResponse.json(
          { error: 'Start date must be before existing end date' },
          { status: 400 }
        )
      }
    } else if (validatedData.endDate && existingProject.startDate) {
      if (validatedData.endDate <= existingProject.startDate) {
        return NextResponse.json(
          { error: 'End date must be after existing start date' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Only include fields that are actually being updated
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.budget !== undefined) updateData.budget = validatedData.budget
    if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate
    if (validatedData.managerId !== undefined) updateData.managerId = validatedData.managerId

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a specific project
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

    // Check if project exists and has active tasks
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          where: {
            status: { in: ['TODO', 'IN_PROGRESS'] },
          },
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project has active tasks
    if (existingProject.tasks.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete project with active tasks',
          activeTasks: existingProject.tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
          })),
        },
        { status: 409 }
      )
    }

    // Delete the project (this will cascade delete related tasks and time entries)
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Project deleted successfully',
      id,
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}