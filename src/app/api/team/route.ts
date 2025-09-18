import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Validation schema for creating team members
const createTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
})

// Validation schema for updating team members
const updateTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/team - Get all team members with filtering and pagination
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
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role) {
      where.role = role
    }

    if (department) {
      where.department = department
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [teamMembers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
          // Include related data counts
          _count: {
            select: {
              assignedLeads: true,
              assignedClients: true,
              managedProjects: true,
              assignedTasks: true,
              timeEntries: true,
            },
          },
          // Include recent activities
          assignedTasks: {
            where: {
              status: { in: ['TODO', 'IN_PROGRESS'] },
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { dueDate: 'asc' },
            take: 5,
          },
          managedProjects: {
            where: {
              status: { in: ['PLANNING', 'IN_PROGRESS'] },
            },
            select: {
              id: true,
              name: true,
              status: true,
              priority: true,
              endDate: true,
            },
            orderBy: { endDate: 'asc' },
            take: 3,
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      teamMembers,
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
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/team - Create a new team member
export async function POST(request: NextRequest) {
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
        { error: 'Only administrators can create team members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTeamMemberSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    const teamMember = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
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

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/team - Bulk update team members
export async function PUT(request: NextRequest) {
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
        { error: 'Only administrators can update team members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ids, data } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      )
    }

    const validatedData = updateTeamMemberSchema.parse(data)

    // Check for email conflicts if email is being updated
    if (validatedData.email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { notIn: ids },
        },
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email already exists for another user' },
          { status: 409 }
        )
      }
    }

    const updatedUsers = await prisma.user.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `${updatedUsers.count} team members updated successfully`,
      updatedCount: updatedUsers.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error bulk updating team members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/team - Bulk deactivate team members (soft delete)
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
        { error: 'Only administrators can deactivate team members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      )
    }

    // Prevent self-deactivation
    if (ids.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Check for users with active assignments
    const usersWithActiveWork = await prisma.user.findMany({
      where: {
        id: { in: ids },
        OR: [
          {
            assignedTasks: {
              some: {
                status: { in: ['TODO', 'IN_PROGRESS'] },
              },
            },
          },
          {
            managedProjects: {
              some: {
                status: { in: ['PLANNING', 'IN_PROGRESS'] },
              },
            },
          },
          {
            assignedLeads: {
              some: {
                status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
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

    if (usersWithActiveWork.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot deactivate users with active assignments',
          usersWithActiveWork: usersWithActiveWork.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            activeTasks: u._count.assignedTasks,
            activeProjects: u._count.managedProjects,
            activeLeads: u._count.assignedLeads,
          })),
        },
        { status: 409 }
      )
    }

    // Soft delete by setting isActive to false
    const deactivatedUsers = await prisma.user.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `${deactivatedUsers.count} team members deactivated successfully`,
      deactivatedCount: deactivatedUsers.count,
    })
  } catch (error) {
    console.error('Error deactivating team members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}