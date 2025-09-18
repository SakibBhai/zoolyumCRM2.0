import { useState, useCallback } from 'react'

// Types
export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
  assignedToName?: string
  projectId?: string
  projectName?: string
  clientId?: string
  clientName?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  progress: number
  tags?: string[]
  dependencies?: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  customFields?: Record<string, any>
}

export interface TaskStats {
  total: number
  byStatus: {
    todo: number
    in_progress: number
    review: number
    completed: number
    cancelled: number
  }
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  overdue: number
  completionRate: number
  averageProgress: number
  totalEstimatedHours: number
  totalActualHours: number
  productivity: {
    onTime: number
    late: number
  }
}

export interface TimeEntry {
  id: string
  taskId: string
  hours: number
  description: string
  date: string
  createdAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  content: string
  userId: string
  createdAt: string
}

export interface KanbanData {
  todo: Task[]
  in_progress: Task[]
  review: Task[]
  completed: Task[]
}

interface TasksResponse {
  tasks: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface TaskFilters {
  page?: number
  limit?: number
  status?: string
  priority?: string
  assignedTo?: string
  projectId?: string
  clientId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  overdue?: boolean
}

const API_BASE_URL = 'http://localhost:3001/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

export const useTasks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async (filters: TaskFilters = {}): Promise<TasksResponse | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })
      
      const response = await fetch(`${API_BASE_URL}/tasks?${queryParams}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getTask = useCallback(async (id: string): Promise<Task | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch task')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(async (taskData: Partial<Task>): Promise<Task | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create task')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTask = useCallback(async (id: string, taskData: Partial<Task>): Promise<Task | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProgress = useCallback(async (id: string, progress: number, note?: string): Promise<{ task: Task; progressUpdate: any } | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/progress`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ progress, note })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update progress')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const addTimeEntry = useCallback(async (id: string, hours: number, description: string, date?: string): Promise<{ timeEntry: TimeEntry; task: Task } | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/time-entries`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hours, description, date })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add time entry')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const addComment = useCallback(async (id: string, content: string, userId?: string): Promise<TaskComment | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, userId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add comment')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getKanbanData = useCallback(async (projectId?: string, assignedTo?: string): Promise<KanbanData | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      if (projectId) queryParams.append('projectId', projectId)
      if (assignedTo) queryParams.append('assignedTo', assignedTo)
      
      const response = await fetch(`${API_BASE_URL}/tasks/kanban?${queryParams}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch Kanban data')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const assignTask = useCallback(async (id: string, assignedTo: string, assignedToName?: string): Promise<Task | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/assign`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignedTo, assignedToName })
      })
      
      if (!response.ok) {
        throw new Error('Failed to assign task')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    updateProgress,
    addTimeEntry,
    addComment,
    getKanbanData,
    assignTask
  }
}

export const useTaskStats = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (): Promise<TaskStats | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/stats`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch task statistics')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchStats
  }
}