import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for client updates
const updateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED']).optional(),
  contractValue: z.number().min(0).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
})

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        projects: {
          include: {
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
            },
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update a specific client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // If email is being updated, check for conflicts
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const emailConflict = await prisma.client.findUnique({
        where: { email: validatedData.email },
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Client with this email already exists' },
          { status: 409 }
        )
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
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

    return NextResponse.json(updatedClient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete a specific client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          where: {
            status: { in: ['PLANNING', 'IN_PROGRESS'] },
          },
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if client has active projects
    if (existingClient.projects.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete client with active projects',
          activeProjects: existingClient.projects.map(p => p.name),
        },
        { status: 409 }
      )
    }

    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Client deleted successfully',
      id,
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}