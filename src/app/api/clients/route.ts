import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for client data
const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED']).default('ACTIVE'),
  contractValue: z.number().min(0).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
})

const updateClientSchema = clientSchema.partial()

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) where.status = status
    if (assignedTo) where.assignedToId = assignedTo
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              budget: true,
            },
          },
          _count: {
            select: {
              projects: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = clientSchema.parse(body)

    // Check if client with email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email: validatedData.email },
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    // If no assignedToId provided, assign to current user
    if (!validatedData.assignedToId) {
      validatedData.assignedToId = session.user.id
    }

    const client = await prisma.client.create({
      data: validatedData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            budget: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/clients - Update multiple clients (bulk update)
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

    const validatedData = updateClientSchema.parse(data)

    const updatedClients = await prisma.client.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `Updated ${updatedClients.count} clients`,
      count: updatedClients.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients - Delete multiple clients
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
        { error: 'No client IDs provided' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',')

    // Check if any clients have active projects
    const clientsWithProjects = await prisma.client.findMany({
      where: {
        id: { in: ids },
        projects: {
          some: {
            status: { in: ['PLANNING', 'IN_PROGRESS'] },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (clientsWithProjects.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete clients with active projects',
          clientsWithProjects: clientsWithProjects.map(c => c.name),
        },
        { status: 409 }
      )
    }

    const deletedClients = await prisma.client.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    return NextResponse.json({
      message: `Deleted ${deletedClients.count} clients`,
      count: deletedClients.count,
    })
  } catch (error) {
    console.error('Error deleting clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}