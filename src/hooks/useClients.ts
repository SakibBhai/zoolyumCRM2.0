import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

// Client interface matching the backend schema
export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company: string
  status: 'active' | 'inactive' | 'prospect' | 'churned'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  healthScore: number
  totalValue?: number
  industry?: string
  website?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  assignedTo?: string
  tags?: string[]
  customFields?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ClientStats {
  total: number
  byStatus: {
    active: number
    inactive: number
    prospect: number
    churned: number
  }
  byTier: {
    bronze: number
    silver: number
    gold: number
    platinum: number
  }
  totalValue: number
  averageValue: number
  averageHealthScore: number
  healthDistribution: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
}

export interface ClientProject {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  budget: number
  progress: number
}

export interface ClientNote {
  id: string
  clientId: string
  content: string
  type: string
  createdAt: string
  createdBy: string
}

interface UseClientsOptions {
  search?: string
  status?: string
  tier?: string
  industry?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export const useClients = (options: UseClientsOptions = {}) => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.search) params.append('search', options.search)
      if (options.status) params.append('status', options.status)
      if (options.tier) params.append('tier', options.tier)
      if (options.industry) params.append('industry', options.industry)
      if (options.sortBy) params.append('sortBy', options.sortBy)
      if (options.sortOrder) params.append('sortOrder', options.sortOrder)
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())

      const response = await fetch(`http://localhost:3001/api/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }

      const data = await response.json()
      setClients(data.clients || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('http://localhost:3001/api/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      const newClient = await response.json()
      setClients(prev => [newClient, ...prev])
      return newClient
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create client')
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      const updatedClient = await response.json()
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ))
      return updatedClient
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update client')
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      setClients(prev => prev.filter(client => client.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete client')
    }
  }

  const updateHealthScore = async (id: string, healthScore: number, reason?: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}/health-score`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ healthScore, reason })
      })

      if (!response.ok) {
        throw new Error('Failed to update health score')
      }

      const { client } = await response.json()
      setClients(prev => prev.map(c => 
        c.id === id ? client : c
      ))
      return client
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update health score')
    }
  }

  const getClientProjects = async (id: string): Promise<ClientProject[]> => {
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}/projects`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch client projects')
      }

      return await response.json()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch client projects')
    }
  }

  const addClientNote = async (id: string, content: string, type: string = 'general'): Promise<ClientNote> => {
    try {
      const response = await fetch(`http://localhost:3001/api/clients/${id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, type })
      })

      if (!response.ok) {
        throw new Error('Failed to add client note')
      }

      return await response.json()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add client note')
    }
  }

  useEffect(() => {
    fetchClients()
  }, [options.search, options.status, options.tier, options.industry, options.sortBy, options.sortOrder, options.page, options.limit])

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    updateHealthScore,
    getClientProjects,
    addClientNote
  }
}

export const useClientStats = () => {
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:3001/api/clients/stats', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch client statistics')
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
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    fetchStats
  }
}