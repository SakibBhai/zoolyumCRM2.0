import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { Invoice, InvoiceItem } from '@/shared/types'

interface InvoiceWithDetails extends Invoice {
  client?: {
    id: string
    name: string
    company?: string | null
    email: string
  }
  project?: {
    id: string
    name: string
  }
  items: InvoiceItem[]
  payments: {
    id: string
    amount: number
    date: Date
    method: string
    reference?: string | null
  }[]
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'overdue'
}

interface InvoicesResponse {
  invoices: InvoiceWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface UseInvoicesOptions {
  page?: number
  limit?: number
  status?: string
  clientId?: string
  projectId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useInvoices = (options: UseInvoicesOptions = {}) => {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const { user } = useAuth()

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.status) params.append('status', options.status)
      if (options.clientId) params.append('clientId', options.clientId)
      if (options.projectId) params.append('projectId', options.projectId)
      if (options.search) params.append('search', options.search)
      if (options.sortBy) params.append('sortBy', options.sortBy)
      if (options.sortOrder) params.append('sortOrder', options.sortOrder)

      const response = await fetch(`/api/invoices?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data: InvoicesResponse = await response.json()
      setInvoices(data.invoices)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchInvoices()
    }
  }, [user, options.page, options.limit, options.status, options.clientId, options.projectId, options.search, options.sortBy, options.sortOrder])

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { items: Omit<InvoiceItem, 'id' | 'invoiceId'>[] }) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const newInvoice = await response.json()
      setInvoices(prev => [newInvoice, ...prev])
      return newInvoice
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create invoice')
    }
  }

  const updateInvoice = async (id: string, updates: Partial<Invoice> & { items?: Omit<InvoiceItem, 'id' | 'invoiceId'>[] }) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update invoice')
      }

      const updatedInvoice = await response.json()
      setInvoices(prev => prev.map(invoice => invoice.id === id ? updatedInvoice : invoice))
      return updatedInvoice
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update invoice')
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete invoice')
      }

      setInvoices(prev => prev.filter(invoice => invoice.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete invoice')
    }
  }

  const sendInvoice = async (id: string, email?: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invoice')
      }

      const result = await response.json()
      // Refresh invoices to get updated status
      await fetchInvoices()
      return result
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to send invoice')
    }
  }

  const markAsPaid = async (id: string, paymentData: { amount: number; method: string; reference?: string; date?: string }) => {
    try {
      const response = await fetch(`/api/invoices/${id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record payment')
      }

      const result = await response.json()
      // Refresh invoices to get updated payment status
      await fetchInvoices()
      return result
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to record payment')
    }
  }

  return {
    invoices,
    loading,
    error,
    pagination,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markAsPaid
  }
}

export const useInvoice = (id: string) => {
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/invoices/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoice')
      }

      const data = await response.json()
      setInvoice(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && id) {
      fetchInvoice()
    }
  }, [user, id])

  return {
    invoice,
    loading,
    error,
    fetchInvoice
  }
}

export type { InvoiceWithDetails }