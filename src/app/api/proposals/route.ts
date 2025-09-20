import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for creating proposals
const createProposalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  projectId: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).default('DRAFT'),
  validUntil: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    totalAmount: z.number().min(0, 'Total must be positive'),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal must be positive'),
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1').default(0),
  taxAmount: z.number().min(0, 'Tax amount must be positive').default(0),
  discountRate: z.number().min(0).max(1, 'Discount rate must be between 0 and 1').default(0),
  discountAmount: z.number().min(0, 'Discount amount must be positive').default(0),
  totalAmount: z.number().min(0, 'Total must be positive'),
  notes: z.string().optional(),
  terms: z.string().optional(),
})

// Validation schema for updating proposals
const updateProposalSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  validUntil: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    totalAmount: z.number().min(0, 'Total must be positive'),
  })).optional(),
  subtotal: z.number().min(0, 'Subtotal must be positive').optional(),
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1').optional(),
  taxAmount: z.number().min(0, 'Tax amount must be positive').optional(),
  discountRate: z.number().min(0).max(1, 'Discount rate must be between 0 and 1').optional(),
  discountAmount: z.number().min(0, 'Discount amount must be positive').optional(),
  totalAmount: z.number().min(0, 'Total must be positive').optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
})

// GET /api/proposals - Get all proposals with filtering and pagination
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
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { company: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (projectId) {
      where.projectId = projectId
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

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
              phone: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.proposal.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      proposals,
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
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProposalSchema.parse(body)

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if project exists (if provided)
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      // Verify project belongs to the client
      if (project.clientId !== validatedData.clientId) {
        return NextResponse.json(
          { error: 'Project does not belong to the specified client' },
          { status: 400 }
        )
      }
    }

    // Generate proposal number
    const proposalCount = await prisma.proposal.count()
    const proposalNumber = `PROP-${String(proposalCount + 1).padStart(4, '0')}`

    const proposal = await prisma.proposal.create({
      data: {
        ...validatedData,

        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
        createdBy: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/proposals - Bulk update proposals
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
        { error: 'Proposal IDs array is required' },
        { status: 400 }
      )
    }

    const validatedData = updateProposalSchema.parse(data)

    // Check if proposals exist and user has permission
    const existingProposals = await prisma.proposal.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        status: true,
        createdBy: true,
      },
    })

    if (existingProposals.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more proposals not found' },
        { status: 404 }
      )
    }

    // Check if any proposals are already accepted/rejected and cannot be modified
    const immutableProposals = existingProposals.filter(
      p => p.status === 'ACCEPTED' || p.status === 'REJECTED'
    )

    if (immutableProposals.length > 0 && validatedData.status !== 'EXPIRED') {
      return NextResponse.json(
        {
          error: 'Cannot modify accepted or rejected proposals',
          immutableProposals: immutableProposals.map(p => p.id),
        },
        { status: 409 }
      )
    }

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil)
    }

    const updatedProposals = await prisma.proposal.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    })

    return NextResponse.json({
      message: `${updatedProposals.count} proposals updated successfully`,
      updatedCount: updatedProposals.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error bulk updating proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/proposals - Bulk delete proposals
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
        { error: 'Proposal IDs array is required' },
        { status: 400 }
      )
    }

    // Check if proposals exist and their status
    const existingProposals = await prisma.proposal.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        status: true,

        title: true,
      },
    })

    if (existingProposals.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more proposals not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of accepted proposals
    const acceptedProposals = existingProposals.filter(
      p => p.status === 'ACCEPTED'
    )

    if (acceptedProposals.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete accepted proposals',
          acceptedProposals: acceptedProposals.map(p => ({
            id: p.id,
            title: p.title,
          })),
        },
        { status: 409 }
      )
    }

    const deletedProposals = await prisma.proposal.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    return NextResponse.json({
      message: `${deletedProposals.count} proposals deleted successfully`,
      deletedCount: deletedProposals.count,
    })
  } catch (error) {
    console.error('Error deleting proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}