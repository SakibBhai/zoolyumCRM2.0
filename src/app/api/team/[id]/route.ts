import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Validation schema for updating team member
const updateTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/team/[id] - Get specific team member
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

    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    const teamMember = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,

        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Include detailed statistics
        _count: {
          select: {
            assignedLeads: true,
            managedClients: true,
            managedProjects: true,
            assignedTasks: true,
            timeEntries: true,
          },
        },
        // Include assigned leads
        assignedLeads: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,

            score: true,
            source: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        // Include managed clients
        managedClients: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        // Include managed projects
        managedProjects: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            startDate: true,
            endDate: true,
            budget: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
            _count: {
              select: {
                tasks: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        // Include assigned tasks
        assignedTasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            estimatedHours: true,
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
            _count: {
              select: {
                timeEntries: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
        // Include recent time entries
        timeEntries: {
          select: {
            id: true,
            description: true,
            hours: true,
            date: true,
            task: {
              select: {
                id: true,
                title: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Calculate additional statistics
    const totalHours = await prisma.timeEntry.aggregate({
      where: { userId: id },
      _sum: { hours: true },
    })

    const thisMonthHours = await prisma.timeEntry.aggregate({
      where: {
        userId: id,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { hours: true },
    })

    const completedTasksCount = await prisma.task.count({
      where: {
        assignedToId: id,
        status: 'DONE',
      },
    })

    const overdueTasks = await prisma.task.count({
      where: {
        assignedToId: id,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: {
          lt: new Date(),
        },
      },
    })

    return NextResponse.json({
      ...teamMember,
      statistics: {
        totalHours: totalHours._sum.hours || 0,
        thisMonthHours: thisMonthHours._sum.hours || 0,
        completedTasks: completedTasksCount,
        overdueTasks,
        totalLeads: teamMember._count.assignedLeads,
        totalClients: teamMember._count.assignedClients,
        totalProjects: teamMember._count.managedProjects,
        totalTasks: teamMember._count.assignedTasks,
        totalTimeEntries: teamMember._count.timeEntries,
      },
    })
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/team/[id] - Update specific team member
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

    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Check if current user has permission to update
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // Users can update their own profile, but only admins can update others
    if (session.user.id !== id && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateTeamMemberSchema.parse(body)

    // Check if team member exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Check for email conflicts
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    // Only admins can change roles
    if (validatedData.role && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can change user roles' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/team/[id] - Deactivate specific team member (soft delete)
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

    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Check if current user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can deactivate team members' },
        { status: 403 }
      )
    }

    // Prevent self-deactivation
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Check if team member exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignedTasks: {
              where: {
                status: { in: ['TODO', 'IN_PROGRESS'] },
              },
            },
            managedProjects: {
              where: {
                status: { in: ['PLANNING', 'IN_PROGRESS'] },
              },
            },
            assignedLeads: {
              where: {
                status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
              },
            },
          },
        },
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Check for active assignments
    const hasActiveWork = 
      existingUser._count.assignedTasks > 0 ||
      existingUser._count.managedProjects > 0 ||
      existingUser._count.assignedLeads > 0

    if (hasActiveWork) {
      return NextResponse.json(
        {
          error: 'Cannot deactivate user with active assignments',
          activeAssignments: {
            tasks: existingUser._count.assignedTasks,
            projects: existingUser._count.managedProjects,
            leads: existingUser._count.assignedLeads,
          },
        },
        { status: 409 }
      )
    }

    // Soft delete by setting isActive to false
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Team member deactivated successfully',
      user: deactivatedUser,
    })
  } catch (error) {
    console.error('Error deactivating team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}