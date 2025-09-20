import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for creating invoices
const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  projectId: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  issueDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    totalPrice: z.number().min(0, 'Total must be positive'),
  })).min(1, 'At least one item is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  taxAmount: z.number().min(0, 'Tax amount must be positive').default(0),
  totalAmount: z.number().min(0, 'Total must be positive'),
  notes: z.string().optional(),
  terms: z.string().optional(),
})

// Validation schema for updating invoices
const updateInvoiceSchema = createInvoiceSchema.partial().omit({ clientId: true })

// GET /api/invoices - Get all invoices with filtering and pagination
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
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
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
      where.issueDate = {}
      if (dateFrom) {
        where.issueDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.issueDate.lte = new Date(dateTo)
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
        }),
      prisma.invoice.count({ where }),
    ])

    // Calculate payment status for each invoice
    const invoicesWithPaymentStatus = invoices.map(invoice => {
      const totalPaid = invoice.payments
        .reduce((sum, payment) => sum + payment.amount, 0)
      
      const remainingAmount = invoice.totalAmount - totalPaid
      const paymentStatus = remainingAmount <= 0 ? 'FULLY_PAID' : 
                           totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'

      return {
        ...invoice,
        totalPaid,
        remainingAmount,
        paymentStatus,
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      invoices: invoicesWithPaymentStatus,
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
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

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
    }

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: validatedData.invoiceNumber },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 409 }
      )
    }

    // Validate date range
    if (validatedData.dueDate <= validatedData.issueDate) {
      return NextResponse.json(
        { error: 'Due date must be after issue date' },
        { status: 400 }
      )
    }

    // Create invoice with items
    const { items, ...invoiceData } = validatedData
    
    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        createdBy: session.user.id,
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
        items: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices - Update multiple invoices (bulk update)
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

    const validatedData = updateInvoiceSchema.parse(data)

    const updatedInvoices = await prisma.invoice.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `Updated ${updatedInvoices.count} invoices`,
      count: updatedInvoices.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices - Delete multiple invoices
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
        { error: 'No invoice IDs provided' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',')

    // Check if any invoices are paid (shouldn't be deleted)
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        id: { in: ids },
        status: 'PAID',
      },
      select: { id: true, invoiceNumber: true },
    })

    if (paidInvoices.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete paid invoices',
          paidInvoices: paidInvoices.map(inv => inv.invoiceNumber),
        },
        { status: 400 }
      )
    }

    const deletedInvoices = await prisma.invoice.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    return NextResponse.json({
      message: `Deleted ${deletedInvoices.count} invoices`,
      count: deletedInvoices.count,
    })
  } catch (error) {
    console.error('Error deleting invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}