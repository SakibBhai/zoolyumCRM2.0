import { useState, useEffect } from 'react'

// Types
export interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate: string
  endDate: string
  budget?: number
  actualCost?: number
  progress: number
  clientId: string
  projectManager: string
  teamMembers: string[]
  category: string
  tags: string[]
  healthScore: number
  createdAt: string
  updatedAt: string
  resources?: ProjectResource[]
}

export interface ProjectResource {
  id: string
  name: string
  type: string
  url: string
  description: string
  createdAt: string
}

export interface ProjectStats {
  total: number
  byStatus: {
    planning: number
    in_progress: number
    on_hold: number
    completed: number
    cancelled: number
  }
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  totalBudget: number
  totalActualCost: number
  averageProgress: number
  onTimeProjects: number
  overdueProjects: number
}

export interface ProjectTask {
  id: string
  title: string
  status: string
  priority: string
  assignedTo: string
  dueDate: string
  progress: number
}

export interface TimeEntry {
  id: string
  projectId: string
  userId: string
  hours: number
  description: string
  date: string
  createdAt: string
}

// Custom hook for projects
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async (params?: {
    search?: string
    status?: string
    priority?: string
    category?: string
    clientId?: string
    page?: number
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append('search', params.search)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.priority) queryParams.append('priority', params.priority)
      if (params?.category) queryParams.append('category', params.category)
      if (params?.clientId) queryParams.append('clientId', params.clientId)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())

      const response = await fetch(`/api/projects?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects || data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const newProject = await response.json()
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      const updatedProject = await response.json()
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ))
      return updatedProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      setProjects(prev => prev.filter(project => project.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (id: string, progress: number, note?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress, note }),
      })

      if (!response.ok) {
        throw new Error('Failed to update progress')
      }

      const result = await response.json()
      setProjects(prev => prev.map(project => 
        project.id === id ? result.project : project
      ))
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addResource = async (id: string, resource: Omit<ProjectResource, 'id' | 'createdAt'>) => {
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}/resources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resource),
      })

      if (!response.ok) {
        throw new Error('Failed to add resource')
      }

      const newResource = await response.json()
      return newResource
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add resource'
      setError(errorMessage)
      throw err
    }
  }

  const getProjectTasks = async (id: string) => {
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project tasks')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project tasks'
      setError(errorMessage)
      throw err
    }
  }

  const addTimeEntry = async (id: string, timeEntry: Omit<TimeEntry, 'id' | 'projectId' | 'createdAt'>) => {
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}/time-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeEntry),
      })

      if (!response.ok) {
        throw new Error('Failed to add time entry')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add time entry'
      setError(errorMessage)
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    updateProgress,
    addResource,
    getProjectTasks,
    addTimeEntry,
  }
}

// Custom hook for project statistics
export const useProjectStats = () => {
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/projects/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project statistics')
      }

      const data = await response.json()
      setStats(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project statistics'
      setError(errorMessage)
      throw err
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
    fetchStats,
  }
}