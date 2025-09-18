import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for updating expense
const updateExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  category: z.enum(['OFFICE_SUPPLIES', 'TRAVEL', 'MEALS', 'SOFTWARE', 'HARDWARE', 'MARKETING', 'UTILITIES', 'RENT', 'INSURANCE', 'PROFESSIONAL_SERVICES', 'OTHER']).optional(),
  date: z.string().datetime().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  receipt: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED']).optional(),
  isReimbursable: z.boolean().optional(),
  taxAmount: z.number().min(0, 'Tax amount must be positive').optional(),
  notes: z.string().optional(),
})

// GET /api/finance/expenses/[id] - Get a specific expense
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
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    // Check permissions - users can only view their own expenses unless admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    let whereClause: any = { id }

    if (currentUser?.role !== 'ADMIN') {
      whereClause.userId = session.user.id
    }

    const expense = await prisma.expense.findUnique({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
                email: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Calculate expense statistics
    const stats = {
      totalAmount: expense.amount + expense.taxAmount,
      netAmount: expense.amount,
      taxAmount: expense.taxAmount,
      isOverdue: expense.status === 'PENDING' && 
        new Date(expense.date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      daysOld: Math.floor((Date.now() - new Date(expense.date).getTime()) / (1000 * 60 * 60 * 24)),
    }

    return NextResponse.json({
      ...expense,
      stats,
    })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/finance/expenses/[id] - Update a specific expense
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
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateExpenseSchema.parse(body)

    // Check permissions - users can only update their own expenses unless admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    let whereClause: any = { id }

    if (currentUser?.role !== 'ADMIN') {
      whereClause.userId = session.user.id
    }

    const existingExpense = await prisma.expense.findUnique({
      where: whereClause,
      select: {
        id: true,
        status: true,
        userId: true,
        projectId: true,
        clientId: true,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found or access denied' },
        { status: 404 }
      )
    }

    // Prevent modification of reimbursed expenses
    if (existingExpense.status === 'REIMBURSED') {
      return NextResponse.json(
        { error: 'Cannot modify reimbursed expenses' },
        { status: 409 }
      )
    }

    // Only admin can change status to APPROVED or REIMBURSED
    if (validatedData.status && 
        (validatedData.status === 'APPROVED' || validatedData.status === 'REIMBURSED') &&
        currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can approve or mark expenses as reimbursed' },
        { status: 403 }
      )
    }

    // Check if project exists (if being updated)
    if (validatedData.projectId && validatedData.projectId !== existingExpense.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId },
        select: { id: true, clientId: true },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      // Auto-update client if not explicitly provided
      if (!validatedData.clientId) {
        validatedData.clientId = project.clientId
      }
    }

    // Check if client exists (if being updated)
    if (validatedData.clientId && validatedData.clientId !== existingExpense.clientId) {
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

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
                email: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/expenses/[id] - Delete a specific expense
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
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    // Check permissions - users can only delete their own expenses unless admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    let whereClause: any = { id }

    if (currentUser?.role !== 'ADMIN') {
      whereClause.userId = session.user.id
    }

    const existingExpense = await prisma.expense.findUnique({
      where: whereClause,
      select: {
        id: true,
        title: true,
        status: true,
        amount: true,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found or access denied' },
        { status: 404 }
      )
    }

    // Prevent deletion of approved or reimbursed expenses
    if (existingExpense.status === 'APPROVED' || existingExpense.status === 'REIMBURSED') {
      return NextResponse.json(
        {
          error: `Cannot delete ${existingExpense.status.toLowerCase()} expenses`,
          expense: {
            id: existingExpense.id,
            title: existingExpense.title,
            status: existingExpense.status,
          },
        },
        { status: 409 }
      )
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Expense deleted successfully',
      deletedExpense: {
        id: existingExpense.id,
        title: existingExpense.title,
        amount: existingExpense.amount,
      },
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}