import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { Activity } from '@/shared/types'

interface ActivityWithUser extends Activity {
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface ActivitiesResponse {
  activities: ActivityWithUser[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface UseActivitiesOptions {
  page?: number
  limit?: number
  type?: string
  entityType?: string
  entityId?: string
  userId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useActivities = (options: UseActivitiesOptions = {}) => {
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const { user } = useAuth()

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.type) params.append('type', options.type)
      if (options.entityType) params.append('entityType', options.entityType)
      if (options.entityId) params.append('entityId', options.entityId)
      if (options.userId) params.append('userId', options.userId)
      if (options.search) params.append('search', options.search)
      if (options.sortBy) params.append('sortBy', options.sortBy)
      if (options.sortOrder) params.append('sortOrder', options.sortOrder)

      const response = await fetch(`/api/activities?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }

      const data: ActivitiesResponse = await response.json()
      setActivities(data.activities)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchActivities()
    }
  }, [user, options.page, options.limit, options.type, options.entityType, options.entityId, options.userId, options.search, options.sortBy, options.sortOrder])

  const createActivity = async (activityData: Omit<Activity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create activity')
      }

      const newActivity = await response.json()
      setActivities(prev => [newActivity, ...prev])
      return newActivity
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create activity')
    }
  }

  const deleteActivity = async (id: string) => {
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete activity')
      }

      setActivities(prev => prev.filter(activity => activity.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete activity')
    }
  }

  const deleteActivities = async (ids: string[]) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete activities')
      }

      setActivities(prev => prev.filter(activity => !ids.includes(activity.id)))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete activities')
    }
  }

  return {
    activities,
    loading,
    error,
    pagination,
    fetchActivities,
    createActivity,
    deleteActivity,
    deleteActivities
  }
}

export type { ActivityWithUser }