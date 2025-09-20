import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for invoice updates
const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required').optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  issueDate: z.string().transform((str) => new Date(str)).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    totalPrice: z.number().min(0, 'Total must be positive'),
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

// GET /api/invoices/[id] - Get a specific invoice
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
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

          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            transactionId: true,
            notes: true,
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Calculate payment status
    const totalPaid = invoice.payments
      .reduce((sum, payment) => sum + payment.amount, 0)
    
    const remainingAmount = invoice.totalAmount - totalPaid
    const paymentStatus = remainingAmount <= 0 ? 'FULLY_PAID' : 
                         totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'

    return NextResponse.json({
      ...invoice,
      totalPaid,
      remainingAmount,
      paymentStatus,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update a specific invoice
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
    const validatedData = updateInvoiceSchema.parse(body)

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice is paid (shouldn't be modified)
    if (existingInvoice.status === 'PAID' && validatedData.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Cannot modify paid invoice' },
        { status: 400 }
      )
    }

    // If invoice number is being updated, check for conflicts
    if (validatedData.invoiceNumber && validatedData.invoiceNumber !== existingInvoice.invoiceNumber) {
      const invoiceNumberConflict = await prisma.invoice.findUnique({
        where: { invoiceNumber: validatedData.invoiceNumber },
      })

      if (invoiceNumberConflict) {
        return NextResponse.json(
          { error: 'Invoice number already exists' },
          { status: 409 }
        )
      }
    }

    // Validate date range if both dates are provided
    if (validatedData.issueDate && validatedData.dueDate) {
      if (validatedData.dueDate <= validatedData.issueDate) {
        return NextResponse.json(
          { error: 'Due date must be after issue date' },
          { status: 400 }
        )
      }
    }

    // Handle items update
    const { items, ...invoiceUpdateData } = validatedData

    let updatedInvoice
    if (items) {
      // Update invoice and replace items
      updatedInvoice = await prisma.$transaction(async (tx) => {
        // Delete existing items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        })

        // Update invoice and create new items
        return await tx.invoice.update({
          where: { id },
          data: {
            ...invoiceUpdateData,
            updatedAt: new Date(),
            items: {
              create: items,
            },
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

              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: true,
            payments: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                paymentMethod: true,
              },
            },
          },
        })
      })
    } else {
      // Update invoice only
      updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          ...invoiceUpdateData,
          updatedAt: new Date(),
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
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
          payments: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                paymentMethod: true,
              },
            },
          },
        })
    }

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete a specific invoice
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

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice is paid (shouldn't be deleted)
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoice' },
        { status: 400 }
      )
    }

    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Invoice deleted successfully',
      id,
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}