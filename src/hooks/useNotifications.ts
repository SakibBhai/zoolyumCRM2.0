import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { Notification } from '@/shared/types'

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  unreadCount: number
}

interface UseNotificationsOptions {
  page?: number
  limit?: number
  type?: string
  read?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.type) params.append('type', options.type)
      if (options.read !== undefined) params.append('read', options.read.toString())
      if (options.search) params.append('search', options.search)
      if (options.sortBy) params.append('sortBy', options.sortBy)
      if (options.sortOrder) params.append('sortOrder', options.sortOrder)

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data: NotificationsResponse = await response.json()
      setNotifications(data.notifications)
      setPagination(data.pagination)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, options.page, options.limit, options.type, options.read, options.search, options.sortBy, options.sortOrder])

  const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create notification')
      }

      const newNotification = await response.json()
      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)
      return newNotification
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create notification')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [id], read: true })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark notification as read')
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      )
      
      // Decrease unread count if notification was unread
      const notification = notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to mark notification as read')
    }
  }

  const markAsUnread = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [id], read: false })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark notification as unread')
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: false, readAt: null }
            : notification
        )
      )
      
      // Increase unread count if notification was read
      const notification = notifications.find(n => n.id === id)
      if (notification && notification.read) {
        setUnreadCount(prev => prev + 1)
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to mark notification as unread')
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: unreadIds, read: true })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark all notifications as read')
      }

      setNotifications(prev => 
        prev.map(notification => 
          unreadIds.includes(notification.id)
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      )
      setUnreadCount(0)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [id] })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete notification')
      }

      // Decrease unread count if notification was unread
      const notification = notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      setNotifications(prev => prev.filter(notification => notification.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }

  const deleteNotifications = async (ids: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete notifications')
      }

      // Decrease unread count for unread notifications being deleted
      const unreadDeletedCount = notifications.filter(n => ids.includes(n.id) && !n.read).length
      setUnreadCount(prev => Math.max(0, prev - unreadDeletedCount))

      setNotifications(prev => prev.filter(notification => !ids.includes(notification.id)))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete notifications')
    }
  }

  return {
    notifications,
    loading,
    error,
    pagination,
    unreadCount,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteNotifications
  }
}