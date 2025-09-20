import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { TimeEntry } from '@/shared/types'

interface TimeEntryWithDetails extends TimeEntry {
  user: {
    id: string
    name: string | null
    email: string
  }
  task: {
    id: string
    title: string
    status: string
    project: {
      id: string
      name: string
      client: {
        id: string
        name: string
        company?: string | null
      }
    }
  }
}

interface TimeEntriesResponse {
  timeEntries: TimeEntryWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: {
    totalHours: number
    billableHours: number
    totalValue: number
  }
}

interface UseTimeEntriesOptions {
  page?: number
  limit?: number
  userId?: string
  taskId?: string
  projectId?: string
  clientId?: string
  billable?: boolean
  startDate?: string
  endDate?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useTimeEntries = (options: UseTimeEntriesOptions = {}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [summary, setSummary] = useState({
    totalHours: 0,
    billableHours: 0,
    totalValue: 0
  })
  const { user } = useAuth()

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.userId) params.append('userId', options.userId)
      if (options.taskId) params.append('taskId', options.taskId)
      if (options.projectId) params.append('projectId', options.projectId)
      if (options.clientId) params.append('clientId', options.clientId)
      if (options.billable !== undefined) params.append('billable', options.billable.toString())
      if (options.startDate) params.append('startDate', options.startDate)
      if (options.endDate) params.append('endDate', options.endDate)
      if (options.search) params.append('search', options.search)
      if (options.sortBy) params.append('sortBy', options.sortBy)
      if (options.sortOrder) params.append('sortOrder', options.sortOrder)

      const response = await fetch(`/api/time-entries?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch time entries')
      }

      const data: TimeEntriesResponse = await response.json()
      setTimeEntries(data.timeEntries)
      setPagination(data.pagination)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTimeEntries()
    }
  }, [user, options.page, options.limit, options.userId, options.taskId, options.projectId, options.clientId, options.billable, options.startDate, options.endDate, options.search, options.sortBy, options.sortOrder])

  const createTimeEntry = async (timeEntryData: Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timeEntryData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create time entry')
      }

      const newTimeEntry = await response.json()
      setTimeEntries(prev => [newTimeEntry, ...prev])
      return newTimeEntry
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create time entry')
    }
  }

  const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update time entry')
      }

      const updatedTimeEntry = await response.json()
      setTimeEntries(prev => prev.map(entry => entry.id === id ? updatedTimeEntry : entry))
      return updatedTimeEntry
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update time entry')
    }
  }

  const deleteTimeEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete time entry')
      }

      setTimeEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete time entry')
    }
  }

  const deleteTimeEntries = async (ids: string[]) => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete time entries')
      }

      setTimeEntries(prev => prev.filter(entry => !ids.includes(entry.id)))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete time entries')
    }
  }

  const updateTimeEntries = async (ids: string[], updates: Partial<TimeEntry>) => {
    try {
      const response = await fetch('/api/time-entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids, updates })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update time entries')
      }

      const updatedEntries = await response.json()
      setTimeEntries(prev => 
        prev.map(entry => {
          const updated = updatedEntries.find((u: TimeEntryWithDetails) => u.id === entry.id)
          return updated || entry
        })
      )
      return updatedEntries
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update time entries')
    }
  }

  return {
    timeEntries,
    loading,
    error,
    pagination,
    summary,
    fetchTimeEntries,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    deleteTimeEntries,
    updateTimeEntries
  }
}

export const useTimeEntry = (id: string) => {
  const [timeEntry, setTimeEntry] = useState<TimeEntryWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchTimeEntry = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/time-entries/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch time entry')
      }

      const data = await response.json()
      setTimeEntry(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && id) {
      fetchTimeEntry()
    }
  }, [user, id])

  return {
    timeEntry,
    loading,
    error,
    fetchTimeEntry
  }
}

export type { TimeEntryWithDetails }