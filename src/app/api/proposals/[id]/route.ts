import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for updating proposal
const updateProposalSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  validUntil: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    total: z.number().min(0, 'Total must be positive'),
  })).optional(),
  subtotal: z.number().min(0, 'Subtotal must be positive').optional(),
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1').optional(),
  taxAmount: z.number().min(0, 'Tax amount must be positive').optional(),
  discountRate: z.number().min(0).max(1, 'Discount rate must be between 0 and 1').optional(),
  discountAmount: z.number().min(0, 'Discount amount must be positive').optional(),
  total: z.number().min(0, 'Total must be positive').optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
})

// GET /api/proposals/[id] - Get specific proposal
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

    if (!id) {
      return NextResponse.json(
        { error: 'Proposal ID is required' },
        { status: 400 }
      )
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            startDate: true,
            endDate: true,
            budget: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
            department: true,
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Track view if status is SENT and not viewed by creator
    if (
      proposal.status === 'SENT' &&
      session.user.id !== proposal.createdById
    ) {
      await prisma.proposal.update({
        where: { id },
        data: {
          status: 'VIEWED',
          viewedAt: new Date(),
        },
      })
      proposal.status = 'VIEWED'
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/proposals/[id] - Update specific proposal
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

    if (!id) {
      return NextResponse.json(
        { error: 'Proposal ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateProposalSchema.parse(body)

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdById: true,
        clientId: true,
        projectId: true,
      },
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Check permissions - only creator or admin can modify
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (
      existingProposal.createdById !== session.user.id &&
      currentUser?.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prevent modification of accepted/rejected proposals
    if (
      (existingProposal.status === 'ACCEPTED' || existingProposal.status === 'REJECTED') &&
      validatedData.status !== 'EXPIRED'
    ) {
      return NextResponse.json(
        { error: 'Cannot modify accepted or rejected proposals' },
        { status: 409 }
      )
    }

    // Validate status transitions
    if (validatedData.status) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['SENT', 'EXPIRED'],
        SENT: ['VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
        VIEWED: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
        ACCEPTED: ['EXPIRED'],
        REJECTED: ['EXPIRED'],
        EXPIRED: [], // Cannot transition from expired
      }

      const allowedStatuses = validTransitions[existingProposal.status] || []
      if (!allowedStatuses.includes(validatedData.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${existingProposal.status} to ${validatedData.status}`,
            allowedStatuses,
          },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil)
    }

    // Set acceptance/rejection timestamps
    if (validatedData.status === 'ACCEPTED') {
      updateData.acceptedAt = new Date()
    } else if (validatedData.status === 'REJECTED') {
      updateData.rejectedAt = new Date()
    } else if (validatedData.status === 'SENT') {
      updateData.sentAt = new Date()
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // If proposal is accepted, optionally create a project
    if (
      validatedData.status === 'ACCEPTED' &&
      !existingProposal.projectId &&
      body.createProject
    ) {
      const project = await prisma.project.create({
        data: {
          name: updatedProposal.title,
          description: updatedProposal.description || '',
          clientId: existingProposal.clientId,
          managerId: session.user.id,
          status: 'PLANNING',
          priority: 'MEDIUM',
          budget: updatedProposal.total,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      })

      // Link proposal to project
      await prisma.proposal.update({
        where: { id },
        data: { projectId: project.id },
      })

      return NextResponse.json({
        ...updatedProposal,
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
        },
      })
    }

    return NextResponse.json(updatedProposal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/proposals/[id] - Delete specific proposal
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

    if (!id) {
      return NextResponse.json(
        { error: 'Proposal ID is required' },
        { status: 400 }
      )
    }

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdById: true,
        proposalNumber: true,
        title: true,
        projectId: true,
      },
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Check permissions - only creator or admin can delete
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (
      existingProposal.createdById !== session.user.id &&
      currentUser?.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prevent deletion of accepted proposals
    if (existingProposal.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Cannot delete accepted proposals' },
        { status: 409 }
      )
    }

    // Check if proposal is linked to a project
    if (existingProposal.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: existingProposal.projectId },
        select: {
          id: true,
          status: true,
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      })

      if (project && (project.status !== 'CANCELLED' || project._count.tasks > 0)) {
        return NextResponse.json(
          {
            error: 'Cannot delete proposal linked to active project with tasks',
            projectId: project.id,
            projectStatus: project.status,
            taskCount: project._count.tasks,
          },
          { status: 409 }
        )
      }
    }

    const deletedProposal = await prisma.proposal.delete({
      where: { id },
      select: {
        id: true,
        proposalNumber: true,
        title: true,
        status: true,
      },
    })

    return NextResponse.json({
      message: 'Proposal deleted successfully',
      proposal: deletedProposal,
    })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}