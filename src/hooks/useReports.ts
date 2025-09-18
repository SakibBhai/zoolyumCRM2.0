'use client'

import { useState, useCallback } from 'react'

// Types
export interface Widget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'progress' | 'list'
  title: string
  description?: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  config: {
    dataSource: string
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
    metrics: string[]
    filters?: Record<string, any>
    groupBy?: string
    sortBy?: string
    limit?: number
    refreshInterval?: number
  }
  style: {
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    borderRadius?: number
  }
  permissions: string[]
  createdBy: string
  updatedAt: string
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  widgets: Widget[]
  layout: 'grid' | 'freeform'
  isPublic: boolean
  permissions: string[]
  tags: string[]
  createdBy: string
  updatedAt: string
  settings: {
    refreshInterval: number
    theme: 'light' | 'dark' | 'auto'
    showFilters: boolean
    allowExport: boolean
  }
}

export interface Report {
  id: string
  name: string
  description?: string
  type: 'standard' | 'custom' | 'scheduled'
  category: string
  template?: string
  parameters: Record<string, any>
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    time: string
    timezone: string
    recipients: string[]
    format: 'pdf' | 'excel' | 'csv'
  }
  status: 'draft' | 'active' | 'paused' | 'archived'
  lastGenerated?: string
  nextRun?: string
  createdBy: string
  updatedAt: string
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  type: 'financial' | 'sales' | 'project' | 'client' | 'performance'
  sections: {
    id: string
    title: string
    type: 'chart' | 'table' | 'text' | 'metric'
    config: Record<string, any>
  }[]
  parameters: {
    name: string
    type: 'date' | 'select' | 'multiselect' | 'text' | 'number'
    label: string
    required: boolean
    options?: string[]
    defaultValue?: any
  }[]
  permissions: string[]
  isPublic: boolean
}

export interface AnalyticsData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }[]
  metadata: {
    total: number
    period: string
    lastUpdated: string
    source: string
  }
}

export interface ReportExecution {
  id: string
  reportId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  duration?: number
  fileUrl?: string
  fileSize?: number
  error?: string
  parameters: Record<string, any>
  triggeredBy: string
}

// API functions
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const fetchDashboards = async (params?: {
  search?: string
  category?: string
  createdBy?: string
  isPublic?: boolean
  page?: number
  limit?: number
}): Promise<{ dashboards: Dashboard[], total: number }> => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const response = await fetch(`${API_BASE}/api/reports/dashboards?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboards')
  }
  
  return response.json()
}

const createDashboard = async (dashboard: Omit<Dashboard, 'id' | 'createdBy' | 'updatedAt'>): Promise<Dashboard> => {
  const response = await fetch(`${API_BASE}/api/reports/dashboards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dashboard)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create dashboard')
  }
  
  return response.json()
}

const updateDashboard = async (id: string, updates: Partial<Dashboard>): Promise<Dashboard> => {
  const response = await fetch(`${API_BASE}/api/reports/dashboards/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update dashboard')
  }
  
  return response.json()
}

const deleteDashboard = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/reports/dashboards/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete dashboard')
  }
}

const fetchReports = async (params?: {
  search?: string
  type?: string
  category?: string
  status?: string
  createdBy?: string
  page?: number
  limit?: number
}): Promise<{ reports: Report[], total: number }> => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const response = await fetch(`${API_BASE}/api/reports?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch reports')
  }
  
  return response.json()
}

const createReport = async (report: Omit<Report, 'id' | 'createdBy' | 'updatedAt'>): Promise<Report> => {
  const response = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(report)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create report')
  }
  
  return response.json()
}

const updateReport = async (id: string, updates: Partial<Report>): Promise<Report> => {
  const response = await fetch(`${API_BASE}/api/reports/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update report')
  }
  
  return response.json()
}

const executeReport = async (id: string, parameters?: Record<string, any>): Promise<ReportExecution> => {
  const response = await fetch(`${API_BASE}/api/reports/${id}/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ parameters })
  })
  
  if (!response.ok) {
    throw new Error('Failed to execute report')
  }
  
  return response.json()
}

const fetchReportTemplates = async (): Promise<ReportTemplate[]> => {
  const response = await fetch(`${API_BASE}/api/reports/templates`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch report templates')
  }
  
  return response.json()
}

const fetchAnalyticsData = async (params: {
  source: string
  metrics: string[]
  filters?: Record<string, any>
  groupBy?: string
  startDate?: string
  endDate?: string
}): Promise<AnalyticsData> => {
  const response = await fetch(`${API_BASE}/api/analytics/data`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data')
  }
  
  return response.json()
}

const fetchWidgetData = async (widgetId: string): Promise<AnalyticsData> => {
  const response = await fetch(`${API_BASE}/api/reports/widgets/${widgetId}/data`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch widget data')
  }
  
  return response.json()
}

const exportDashboard = async (id: string, format: 'pdf' | 'png' | 'excel'): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/api/reports/dashboards/${id}/export?format=${format}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to export dashboard')
  }
  
  return response.blob()
}

// Custom hooks
export const useDashboards = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadDashboards = useCallback(async (params?: Parameters<typeof fetchDashboards>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchDashboards(params)
      setDashboards(result.dashboards)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboards')
    } finally {
      setLoading(false)
    }
  }, [])

  const addDashboard = useCallback(async (dashboard: Parameters<typeof createDashboard>[0]) => {
    try {
      setError(null)
      const newDashboard = await createDashboard(dashboard)
      setDashboards(prev => [newDashboard, ...prev])
      return newDashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dashboard')
      throw err
    }
  }, [])

  const editDashboard = useCallback(async (id: string, updates: Parameters<typeof updateDashboard>[1]) => {
    try {
      setError(null)
      const updatedDashboard = await updateDashboard(id, updates)
      setDashboards(prev => prev.map(d => d.id === id ? updatedDashboard : d))
      return updatedDashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dashboard')
      throw err
    }
  }, [])

  const removeDashboard = useCallback(async (id: string) => {
    try {
      setError(null)
      await deleteDashboard(id)
      setDashboards(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dashboard')
      throw err
    }
  }, [])

  const exportDashboardFile = useCallback(async (id: string, format: Parameters<typeof exportDashboard>[1]) => {
    try {
      setError(null)
      const blob = await exportDashboard(id, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-${id}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export dashboard')
      throw err
    }
  }, [])

  return {
    dashboards,
    loading,
    error,
    total,
    loadDashboards,
    addDashboard,
    editDashboard,
    removeDashboard,
    exportDashboard: exportDashboardFile,
    refetch: loadDashboards
  }
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadReports = useCallback(async (params?: Parameters<typeof fetchReports>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchReports(params)
      setReports(result.reports)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  const addReport = useCallback(async (report: Parameters<typeof createReport>[0]) => {
    try {
      setError(null)
      const newReport = await createReport(report)
      setReports(prev => [newReport, ...prev])
      return newReport
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report')
      throw err
    }
  }, [])

  const editReport = useCallback(async (id: string, updates: Parameters<typeof updateReport>[1]) => {
    try {
      setError(null)
      const updatedReport = await updateReport(id, updates)
      setReports(prev => prev.map(r => r.id === id ? updatedReport : r))
      return updatedReport
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report')
      throw err
    }
  }, [])

  const runReport = useCallback(async (id: string, parameters?: Record<string, any>) => {
    try {
      setError(null)
      const execution = await executeReport(id, parameters)
      return execution
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute report')
      throw err
    }
  }, [])

  return {
    reports,
    loading,
    error,
    total,
    loadReports,
    addReport,
    editReport,
    executeReport: runReport,
    refetch: loadReports
  }
}

export const useReportTemplates = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchReportTemplates()
      setTemplates(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report templates')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    templates,
    loading,
    error,
    loadTemplates,
    refetch: loadTemplates
  }
}

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalyticsData = useCallback(async (params: Parameters<typeof fetchAnalyticsData>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchAnalyticsData(params)
      setData(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    error,
    loadAnalyticsData
  }
}

export const useWidgetData = () => {
  const [widgetData, setWidgetData] = useState<Record<string, AnalyticsData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string | null>>({})

  const loadWidgetData = useCallback(async (widgetId: string) => {
    try {
      setLoading(prev => ({ ...prev, [widgetId]: true }))
      setError(prev => ({ ...prev, [widgetId]: null }))
      const result = await fetchWidgetData(widgetId)
      setWidgetData(prev => ({ ...prev, [widgetId]: result }))
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load widget data'
      setError(prev => ({ ...prev, [widgetId]: errorMessage }))
      throw err
    } finally {
      setLoading(prev => ({ ...prev, [widgetId]: false }))
    }
  }, [])

  const refreshWidget = useCallback(async (widgetId: string) => {
    return loadWidgetData(widgetId)
  }, [loadWidgetData])

  const clearWidgetData = useCallback((widgetId: string) => {
    setWidgetData(prev => {
      const newData = { ...prev }
      delete newData[widgetId]
      return newData
    })
    setLoading(prev => {
      const newLoading = { ...prev }
      delete newLoading[widgetId]
      return newLoading
    })
    setError(prev => {
      const newError = { ...prev }
      delete newError[widgetId]
      return newError
    })
  }, [])

  return {
    widgetData,
    loading,
    error,
    loadWidgetData,
    refreshWidget,
    clearWidgetData
  }
}

// Dashboard builder utilities
export const useDashboardBuilder = () => {
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const selectWidget = useCallback((widget: Widget | null) => {
    setSelectedWidget(widget)
  }, [])

  const startDrag = useCallback((widget: Widget) => {
    setDraggedWidget(widget)
  }, [])

  const endDrag = useCallback(() => {
    setDraggedWidget(null)
  }, [])

  const toggleEdit = useCallback(() => {
    setIsEditing(prev => !prev)
  }, [])

  const createWidget = useCallback((type: Widget['type'], position: Widget['position']): Omit<Widget, 'id' | 'createdBy' | 'updatedAt'> => {
    return {
      type,
      title: `New ${type} Widget`,
      position,
      config: {
        dataSource: '',
        metrics: [],
        refreshInterval: 300000 // 5 minutes
      },
      style: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderRadius: 8
      },
      permissions: ['read']
    }
  }, [])

  return {
    selectedWidget,
    draggedWidget,
    isEditing,
    selectWidget,
    startDrag,
    endDrag,
    toggleEdit,
    createWidget
  }
}