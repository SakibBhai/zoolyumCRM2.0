import { useState, useEffect } from 'react'

// Team member types
export interface TeamMember {
  id: string
  name: string
  email: string
  position: string
  role: 'admin' | 'manager' | 'developer' | 'designer' | 'qa' | 'intern'
  status: 'active' | 'inactive' | 'on-leave' | 'busy'
  department: string
  avatar?: string
  phone?: string
  joinDate: string
  skills: string[]
  performance: number // 0-100
  workload: number // 0-100
  hoursLogged: number
  tasksCompleted: number
  tasksInProgress: number
  currentProjects: string[]
  salary?: number
  lastActive?: string
  location?: string
  timezone?: string
}

export interface TeamStats {
  total: number
  active: number
  inactive: number
  onLeave: number
  busy: number
  avgPerformance: number
  totalHours: number
  totalTasks: number
  avgWorkload: number
  byDepartment: Record<string, number>
  byRole: Record<string, number>
}

export interface TeamFilters {
  search?: string
  role?: string
  status?: string
  department?: string
  skills?: string[]
  page?: number
  limit?: number
}

export interface PerformanceData {
  memberId: string
  period: string
  tasksCompleted: number
  hoursWorked: number
  performanceScore: number
  feedback?: string
}

export interface WorkloadData {
  memberId: string
  currentTasks: number
  estimatedHours: number
  actualHours: number
  capacity: number
  utilization: number
}

const API_BASE = '/api/team'

export function useTeam() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all team members with filters
  const fetchTeamMembers = async (filters: TeamFilters = {}): Promise<{ members: TeamMember[], total: number }> => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.role) params.append('role', filters.role)
      if (filters.status) params.append('status', filters.status)
      if (filters.department) params.append('department', filters.department)
      if (filters.skills?.length) params.append('skills', filters.skills.join(','))
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`${API_BASE}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch team members')
      
      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team members'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get single team member
  const getTeamMember = async (id: string): Promise<TeamMember> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/${id}`)
      if (!response.ok) throw new Error('Failed to fetch team member')
      
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team member'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Create new team member
  const createTeamMember = async (memberData: Omit<TeamMember, 'id'>): Promise<TeamMember> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      })
      if (!response.ok) throw new Error('Failed to create team member')
      
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team member'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update team member
  const updateTeamMember = async (id: string, updates: Partial<TeamMember>): Promise<TeamMember> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update team member')
      
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team member'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete team member
  const deleteTeamMember = async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete team member')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete team member'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update member status
  const updateMemberStatus = async (id: string, status: TeamMember['status']): Promise<TeamMember> => {
    return updateTeamMember(id, { status })
  }

  // Update member performance
  const updatePerformance = async (id: string, performance: number): Promise<TeamMember> => {
    return updateTeamMember(id, { performance })
  }

  // Update member workload
  const updateWorkload = async (id: string, workload: number): Promise<TeamMember> => {
    return updateTeamMember(id, { workload })
  }

  // Add skill to member
  const addSkill = async (id: string, skill: string): Promise<TeamMember> => {
    const member = await getTeamMember(id)
    const updatedSkills = [...member.skills, skill]
    return updateTeamMember(id, { skills: updatedSkills })
  }

  // Remove skill from member
  const removeSkill = async (id: string, skill: string): Promise<TeamMember> => {
    const member = await getTeamMember(id)
    const updatedSkills = member.skills.filter(s => s !== skill)
    return updateTeamMember(id, { skills: updatedSkills })
  }

  return {
    loading,
    error,
    fetchTeamMembers,
    getTeamMember,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    updateMemberStatus,
    updatePerformance,
    updateWorkload,
    addSkill,
    removeSkill
  }
}

export function useTeamStats() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get team statistics
  const fetchTeamStats = async (): Promise<TeamStats> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/stats`)
      if (!response.ok) throw new Error('Failed to fetch team stats')
      
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team stats'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get performance data
  const fetchPerformanceData = async (memberId?: string, period?: string): Promise<PerformanceData[]> => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (memberId) params.append('memberId', memberId)
      if (period) params.append('period', period)

      const response = await fetch(`${API_BASE}/performance?${params}`)
      if (!response.ok) throw new Error('Failed to fetch performance data')
      
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch performance data'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get workload data
  const fetchWorkloadData = async (memberId?: string): Promise<WorkloadData[]> => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (memberId) params.append('memberId', memberId)

      const response = await fetch(`${API_BASE}/workload?${params}`)
      if (!response.ok) throw new Error('Failed to fetch workload data')
      
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workload data'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    fetchTeamStats,
    fetchPerformanceData,
    fetchWorkloadData
  }
}