import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: 'website' | 'referral' | 'social' | 'email' | 'phone' | 'event' | 'other'
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  value?: number
  notes?: string
  tags?: string[]
  assignedTo?: string
  expectedCloseDate?: string
  lastContactDate?: string
  nextFollowUpDate?: string
  createdAt: string
  updatedAt: string
  customFields?: Record<string, any>
}

interface LeadStats {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  bySource: Record<string, number>
  totalValue: number
  averageValue: number
  conversionRate: number
}

interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface UseLeadsOptions {
  page?: number
  limit?: number
  status?: string
  priority?: string
  source?: string
  assignedTo?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useLeads = (options: UseLeadsOptions = {}) => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const { user } = useAuth()

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.status) params.append('status', options.status)
      if (options.priority) params.append('priority', options.priority)
      if (options.source) params.append('source', options.source)
      if (options.assignedTo) params.append('assignedTo', options.assignedTo)
      if (options.search) params.append('search', options.search)
      if (options.sortBy) params.append('sortBy', options.sortBy)
      if (options.sortOrder) params.append('sortOrder', options.sortOrder)

      const response = await fetch(`/api/leads?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }

      const data: LeadsResponse = await response.json()
      setLeads(data.leads)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user, options.page, options.limit, options.status, options.priority, options.source, options.assignedTo, options.search, options.sortBy, options.sortOrder])

  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      })

      if (!response.ok) {
        throw new Error('Failed to create lead')
      }

      const newLead = await response.json()
      setLeads(prev => [newLead, ...prev])
      return newLead
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create lead')
    }
  }

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update lead')
      }

      const updatedLead = await response.json()
      setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead))
      return updatedLead
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update lead')
    }
  }

  const deleteLead = async (id: string) => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete lead')
      }

      setLeads(prev => prev.filter(lead => lead.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete lead')
    }
  }

  const convertLead = async (id: string) => {
    try {
      const response = await fetch(`/api/leads/${id}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to convert lead')
      }

      const result = await response.json()
      setLeads(prev => prev.map(lead => lead.id === id ? result.lead : lead))
      return result
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to convert lead')
    }
  }

  const addActivity = async (id: string, activity: { type: string; description: string; date?: string }) => {
    try {
      const response = await fetch(`/api/leads/${id}/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activity)
      })

      if (!response.ok) {
        throw new Error('Failed to add activity')
      }

      const newActivity = await response.json()
      // Refresh leads to get updated lastContactDate
      await fetchLeads()
      return newActivity
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add activity')
    }
  }

  return {
    leads,
    loading,
    error,
    pagination,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    convertLead,
    addActivity
  }
}

export const useLeadStats = () => {
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/leads/stats', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch lead statistics')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  return {
    stats,
    loading,
    error,
    fetchStats
  }
}

export type { Lead, LeadStats }