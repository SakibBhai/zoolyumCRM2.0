import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for revenue updates
const updateRevenueSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().min(1, 'Description is required').max(500).optional(),
  category: z.enum([
    'PROJECT_PAYMENT',
    'RETAINER',
    'MILESTONE',
    'SUBSCRIPTION',
    'CONSULTATION',
    'LICENSE',
    'COMMISSION',
    'REFUND',
    'OTHER'
  ]).optional(),
  source: z.enum([
    'BANK_TRANSFER',
    'CREDIT_CARD',
    'PAYPAL',
    'STRIPE',
    'CHECK',
    'CASH',
    'CRYPTOCURRENCY',
    'OTHER'
  ]).optional(),
  status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']).optional(),
  date: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),

  taxAmount: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  exchangeRate: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/finance/revenues/[id] - Get specific revenue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeRelated = searchParams.get('includeRelated') === 'true'
    const includeHistory = searchParams.get('includeHistory') === 'true'

    const { id } = await params
    
    const revenue = await prisma.revenue.findUnique({
      where: { id },
      include: {
        client: includeRelated ? {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
            address: true,
          },
        } : {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        project: includeRelated ? {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            budget: true,
            startDate: true,
            endDate: true,
          },
        } : {
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

    if (!revenue) {
      return NextResponse.json(
        { error: 'Revenue not found' },
        { status: 404 }
      )
    }

    let additionalData: any = {}

    if (includeHistory && revenue.projectId) {
      // Get related project revenues for context
      const projectRevenues = await prisma.revenue.findMany({
        where: {
          projectId: revenue.projectId,
          id: { not: revenue.id },
        },
        select: {
          id: true,
          amount: true,
          taxAmount: true,
          status: true,
          date: true,
          category: true,
          notes: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      })

      additionalData.relatedRevenues = projectRevenues
    }

    if (includeRelated && revenue.clientId) {
      // Get client revenue summary
      const clientRevenueStats = await prisma.revenue.aggregate({
        where: { clientId: revenue.clientId },
        _sum: { amount: true, taxAmount: true },
        _count: true,
      })

      additionalData.clientStats = {
        totalRevenue: (clientRevenueStats._sum.amount || 0) + (clientRevenueStats._sum.taxAmount || 0),
        revenueCount: clientRevenueStats._count,
      }
    }

    return NextResponse.json({
      ...revenue,
      ...additionalData,
    })
  } catch (error) {
    console.error('Error fetching revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/finance/revenues/[id] - Update specific revenue
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
    const validatedData = updateRevenueSchema.parse(body)

    // Check if revenue exists
    const existingRevenue = await prisma.revenue.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
      },
    })

    if (!existingRevenue) {
      return NextResponse.json(
        { error: 'Revenue not found' },
        { status: 404 }
      )
    }

    // Prevent modification of received revenues (except for notes and tags)
    if (existingRevenue.status === 'RECEIVED') {
      const allowedFields = ['notes', 'tags']
      const hasDisallowedChanges = Object.keys(validatedData).some(
        key => !allowedFields.includes(key)
      )
      
      if (hasDisallowedChanges) {
        return NextResponse.json(
          { error: 'Cannot modify received revenue except notes and tags' },
          { status: 400 }
        )
      }
    }

    // Verify client exists if being updated
    if (validatedData.clientId && validatedData.clientId !== existingRevenue.clientId) {
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

    // Verify project exists if being updated
    if (validatedData.projectId && validatedData.projectId !== existingRevenue.projectId) {
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

      // Ensure project belongs to the client
      const clientId = validatedData.clientId || existingRevenue.clientId
      if (clientId && project.clientId !== clientId) {
        return NextResponse.json(
          { error: 'Project does not belong to the specified client' },
          { status: 400 }
        )
      }

      // If project is being updated but client is not, update client to match project
      if (!validatedData.clientId && project.clientId !== existingRevenue.clientId) {
        validatedData.clientId = project.clientId
      }
    }



    // Validate status transitions
    if (validatedData.status && validatedData.status !== existingRevenue.status) {
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['RECEIVED', 'CANCELLED'],
        'RECEIVED': [], // Cannot change from received
        'CANCELLED': ['PENDING'], // Can reactivate cancelled revenue
      }

      if (!validTransitions[existingRevenue.status]?.includes(validatedData.status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${existingRevenue.status} to ${validatedData.status}` },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate)
    }

    const updatedRevenue = await prisma.revenue.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedRevenue)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/revenues/[id] - Delete specific revenue
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

    // Check if revenue exists
    const revenue = await prisma.revenue.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        notes: true,
        amount: true,
      },
    })

    if (!revenue) {
      return NextResponse.json(
        { error: 'Revenue not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of received revenues
    if (revenue.status === 'RECEIVED') {
      return NextResponse.json(
        { error: 'Cannot delete received revenue' },
        { status: 400 }
      )
    }

    await prisma.revenue.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Revenue deleted successfully',
      deletedRevenue: {
        id: revenue.id,
        amount: revenue.amount,
      },
    })
  } catch (error) {
    console.error('Error deleting revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}