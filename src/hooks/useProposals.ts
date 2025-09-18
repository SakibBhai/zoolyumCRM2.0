import { useState } from 'react'

interface ProposalItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Proposal {
  id: string
  title: string
  client: string
  clientEmail: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  amount: number
  currency: string
  probability: number
  validUntil: string
  createdDate: string
  sentDate?: string
  viewedDate?: string
  respondedDate?: string
  description: string
  items: ProposalItem[]
  notes?: string
  tags: string[]
  projectType: string
  estimatedDuration: string
  paymentTerms: string
  clientId?: string
  projectId?: string
}

interface ProposalStats {
  total: number
  sent: number
  accepted: number
  rejected: number
  totalValue: number
  avgProbability: number
  wonValue: number
  pipelineValue: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  clientEmail: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  amount: number
  currency: string
  createdDate: string
  dueDate: string
  paidDate?: string
  description: string
  items: ProposalItem[]
  paymentTerms: string
  paymentMethod?: string
  notes?: string
  tags: string[]
  proposalId?: string
  clientId?: string
  projectId?: string
}

interface InvoiceStats {
  total: number
  sent: number
  paid: number
  overdue: number
  totalValue: number
  paidValue: number
  overdueValue: number
  pendingValue: number
}

// Custom hook for proposals
export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProposals = async (params?: {
    search?: string
    status?: string
    clientId?: string
    projectType?: string
    page?: number
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append('search', params.search)
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status)
      if (params?.clientId && params.clientId !== 'all') queryParams.append('clientId', params.clientId)
      if (params?.projectType) queryParams.append('projectType', params.projectType)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())

      const response = await fetch(`/api/proposals?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch proposals')
      }

      const data = await response.json()
      setProposals(data.proposals || data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getProposal = async (id: string): Promise<Proposal> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch proposal')
      }

      const proposal = await response.json()
      return proposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposal'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createProposal = async (proposalData: Omit<Proposal, 'id' | 'createdDate'>): Promise<Proposal> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      })

      if (!response.ok) {
        throw new Error('Failed to create proposal')
      }

      const newProposal = await response.json()
      setProposals(prev => [newProposal, ...prev])
      return newProposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create proposal'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProposal = async (id: string, updates: Partial<Proposal>): Promise<Proposal> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update proposal')
      }

      const updatedProposal = await response.json()
      setProposals(prev => prev.map(p => p.id === id ? updatedProposal : p))
      return updatedProposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update proposal'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteProposal = async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete proposal')
      }

      setProposals(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete proposal'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const sendProposal = async (id: string): Promise<Proposal> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/proposals/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to send proposal')
      }

      const updatedProposal = await response.json()
      setProposals(prev => prev.map(p => p.id === id ? updatedProposal : p))
      return updatedProposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send proposal'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    proposals,
    loading,
    error,
    fetchProposals,
    getProposal,
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal,
  }
}

// Custom hook for proposal statistics
export const useProposalStats = () => {
  const [stats, setStats] = useState<ProposalStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/proposals/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch proposal statistics')
      }

      const statsData = await response.json()
      setStats(statsData)
      return statsData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposal statistics'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}

// Custom hook for invoices
export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = async (params?: {
    search?: string
    status?: string
    clientId?: string
    page?: number
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append('search', params.search)
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status)
      if (params?.clientId && params.clientId !== 'all') queryParams.append('clientId', params.clientId)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())

      const response = await fetch(`/api/invoices?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data = await response.json()
      setInvoices(data.invoices || data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getInvoice = async (id: string): Promise<Invoice> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoice')
      }

      const invoice = await response.json()
      return invoice
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdDate' | 'invoiceNumber'>): Promise<Invoice> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        throw new Error('Failed to create invoice')
      }

      const newInvoice = await response.json()
      setInvoices(prev => [newInvoice, ...prev])
      return newInvoice
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice')
      }

      const updatedInvoice = await response.json()
      setInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i))
      return updatedInvoice
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteInvoice = async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }

      setInvoices(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const sendInvoice = async (id: string): Promise<Invoice> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to send invoice')
      }

      const updatedInvoice = await response.json()
      setInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i))
      return updatedInvoice
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invoice'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const markInvoicePaid = async (id: string, paymentData: {
    paymentMethod?: string
    paymentDate?: string
    notes?: string
  }): Promise<Invoice> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/invoices/${id}/paid`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        throw new Error('Failed to mark invoice as paid')
      }

      const updatedInvoice = await response.json()
      setInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i))
      return updatedInvoice
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark invoice as paid'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markInvoicePaid,
  }
}

// Custom hook for invoice statistics
export const useInvoiceStats = () => {
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/invoices/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoice statistics')
      }

      const statsData = await response.json()
      setStats(statsData)
      return statsData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice statistics'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}

export type { Proposal, ProposalItem, ProposalStats, Invoice, InvoiceStats }