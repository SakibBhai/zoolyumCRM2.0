'use client'

import { useState, useCallback } from 'react'

// Types
export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  subcategory?: string
  description: string
  amount: number
  currency: string
  date: string
  status: 'pending' | 'completed' | 'cancelled'
  paymentMethod: string
  reference?: string
  clientId?: string
  projectId?: string
  invoiceId?: string
  receiptUrl?: string
  tags: string[]
  notes?: string
  createdBy: string
  approvedBy?: string
  approvedDate?: string
}

export interface Budget {
  id: string
  name: string
  category: string
  period: 'monthly' | 'quarterly' | 'yearly'
  budgetAmount: number
  spentAmount: number
  currency: string
  startDate: string
  endDate: string
  status: 'active' | 'exceeded' | 'completed' | 'draft'
  description: string
  assignedTo: string
  alerts: {
    threshold: number
    enabled: boolean
  }
  tags: string[]
}

export interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  category: string
  subcategory?: string
  date: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
  paymentMethod?: string
  receiptUrl?: string
  submittedBy: string
  approvedBy?: string
  approvalDate?: string
  rejectionReason?: string
  tags: string[]
  notes?: string
  projectId?: string
  clientId?: string
}

export interface Revenue {
  id: string
  description: string
  amount: number
  currency: string
  source: string
  category: string
  date: string
  status: 'pending' | 'received' | 'cancelled'
  clientId?: string
  projectId?: string
  invoiceId?: string
  paymentMethod?: string
  reference?: string
  tags: string[]
  notes?: string
  createdBy: string
}

export interface FinancialReport {
  id: string
  name: string
  type: 'profit_loss' | 'cash_flow' | 'budget_variance' | 'expense_analysis' | 'revenue_analysis'
  period: string
  generatedDate: string
  status: 'draft' | 'final' | 'archived'
  data: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    cashFlow: number
    budgetVariance: number
  }
  charts: string[]
  createdBy: string
}

export interface FinanceStats {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  cashFlow: number
  budgetUtilization: number
  pendingExpenses: number
  overdueInvoices: number
}

export interface BudgetForecast {
  period: string
  projectedRevenue: number
  projectedExpenses: number
  projectedProfit: number
  confidence: number
  factors: string[]
}

// API functions
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const fetchTransactions = async (params?: {
  search?: string
  type?: string
  category?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}): Promise<{ transactions: Transaction[], total: number }> => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const response = await fetch(`${API_BASE}/api/finance/transactions?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch transactions')
  }
  
  return response.json()
}

const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdBy'>): Promise<Transaction> => {
  const response = await fetch(`${API_BASE}/api/finance/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transaction)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create transaction')
  }
  
  return response.json()
}

const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const response = await fetch(`${API_BASE}/api/finance/transactions/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update transaction')
  }
  
  return response.json()
}

const deleteTransaction = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/finance/transactions/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete transaction')
  }
}

const fetchBudgets = async (params?: {
  search?: string
  category?: string
  status?: string
  period?: string
  page?: number
  limit?: number
}): Promise<{ budgets: Budget[], total: number }> => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const response = await fetch(`${API_BASE}/api/finance/budgets?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch budgets')
  }
  
  return response.json()
}

const createBudget = async (budget: Omit<Budget, 'id' | 'spentAmount'>): Promise<Budget> => {
  const response = await fetch(`${API_BASE}/api/finance/budgets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(budget)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create budget')
  }
  
  return response.json()
}

const fetchExpenses = async (params?: {
  search?: string
  category?: string
  status?: string
  submittedBy?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}): Promise<{ expenses: Expense[], total: number }> => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const response = await fetch(`${API_BASE}/api/finance/expenses?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch expenses')
  }
  
  return response.json()
}

const submitExpense = async (expense: Omit<Expense, 'id' | 'submittedBy' | 'status'>): Promise<Expense> => {
  const response = await fetch(`${API_BASE}/api/finance/expenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...expense, status: 'submitted' })
  })
  
  if (!response.ok) {
    throw new Error('Failed to submit expense')
  }
  
  return response.json()
}

const approveExpense = async (id: string, notes?: string): Promise<Expense> => {
  const response = await fetch(`${API_BASE}/api/finance/expenses/${id}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notes })
  })
  
  if (!response.ok) {
    throw new Error('Failed to approve expense')
  }
  
  return response.json()
}

const rejectExpense = async (id: string, reason: string): Promise<Expense> => {
  const response = await fetch(`${API_BASE}/api/finance/expenses/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  })
  
  if (!response.ok) {
    throw new Error('Failed to reject expense')
  }
  
  return response.json()
}

const fetchRevenues = async (params?: {
  search?: string
  source?: string
  category?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}): Promise<{ revenues: Revenue[], total: number }> => {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString())
      }
    })
  }
  
  const response = await fetch(`${API_BASE}/api/finance/revenues?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch revenues')
  }
  
  return response.json()
}

const createRevenue = async (revenue: Omit<Revenue, 'id' | 'createdBy'>): Promise<Revenue> => {
  const response = await fetch(`${API_BASE}/api/finance/revenues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(revenue)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create revenue')
  }
  
  return response.json()
}

const fetchFinanceStats = async (): Promise<FinanceStats> => {
  const response = await fetch(`${API_BASE}/api/finance/stats`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch finance stats')
  }
  
  return response.json()
}

const generateBudgetForecast = async (params: {
  category?: string
  period: string
  months: number
}): Promise<BudgetForecast[]> => {
  const response = await fetch(`${API_BASE}/api/finance/forecast`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate budget forecast')
  }
  
  return response.json()
}

const generateFinancialReport = async (params: {
  type: string
  period: string
  startDate: string
  endDate: string
}): Promise<FinancialReport> => {
  const response = await fetch(`${API_BASE}/api/finance/reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate financial report')
  }
  
  return response.json()
}

// Custom hooks
export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadTransactions = useCallback(async (params?: Parameters<typeof fetchTransactions>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchTransactions(params)
      setTransactions(result.transactions)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  const addTransaction = useCallback(async (transaction: Parameters<typeof createTransaction>[0]) => {
    try {
      setError(null)
      const newTransaction = await createTransaction(transaction)
      setTransactions(prev => [newTransaction, ...prev])
      return newTransaction
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
      throw err
    }
  }, [])

  const editTransaction = useCallback(async (id: string, updates: Parameters<typeof updateTransaction>[1]) => {
    try {
      setError(null)
      const updatedTransaction = await updateTransaction(id, updates)
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t))
      return updatedTransaction
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction')
      throw err
    }
  }, [])

  const removeTransaction = useCallback(async (id: string) => {
    try {
      setError(null)
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction')
      throw err
    }
  }, [])

  return {
    transactions,
    loading,
    error,
    total,
    loadTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    refetch: loadTransactions
  }
}

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadBudgets = useCallback(async (params?: Parameters<typeof fetchBudgets>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchBudgets(params)
      setBudgets(result.budgets)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }, [])

  const addBudget = useCallback(async (budget: Parameters<typeof createBudget>[0]) => {
    try {
      setError(null)
      const newBudget = await createBudget(budget)
      setBudgets(prev => [newBudget, ...prev])
      return newBudget
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget')
      throw err
    }
  }, [])

  return {
    budgets,
    loading,
    error,
    total,
    loadBudgets,
    addBudget,
    refetch: loadBudgets
  }
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadExpenses = useCallback(async (params?: Parameters<typeof fetchExpenses>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchExpenses(params)
      setExpenses(result.expenses)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [])

  const createExpense = useCallback(async (expense: Parameters<typeof submitExpense>[0]) => {
    try {
      setError(null)
      const newExpense = await submitExpense(expense)
      setExpenses(prev => [newExpense, ...prev])
      return newExpense
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit expense')
      throw err
    }
  }, [])

  const handleApproveExpense = useCallback(async (id: string, notes?: string) => {
    try {
      setError(null)
      const updatedExpense = await approveExpense(id, notes)
      setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e))
      return updatedExpense
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve expense')
      throw err
    }
  }, [])

  const handleRejectExpense = useCallback(async (id: string, reason: string) => {
    try {
      setError(null)
      const updatedExpense = await rejectExpense(id, reason)
      setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e))
      return updatedExpense
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject expense')
      throw err
    }
  }, [])

  return {
    expenses,
    loading,
    error,
    total,
    loadExpenses,
    createExpense,
    approveExpense: handleApproveExpense,
    rejectExpense: handleRejectExpense,
    refetch: loadExpenses
  }
}

export const useRevenues = () => {
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadRevenues = useCallback(async (params?: Parameters<typeof fetchRevenues>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchRevenues(params)
      setRevenues(result.revenues)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenues')
    } finally {
      setLoading(false)
    }
  }, [])

  const addRevenue = useCallback(async (revenue: Parameters<typeof createRevenue>[0]) => {
    try {
      setError(null)
      const newRevenue = await createRevenue(revenue)
      setRevenues(prev => [newRevenue, ...prev])
      return newRevenue
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create revenue')
      throw err
    }
  }, [])

  return {
    revenues,
    loading,
    error,
    total,
    loadRevenues,
    addRevenue,
    refetch: loadRevenues
  }
}

export const useFinanceStats = () => {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFinanceStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance stats')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    stats,
    loading,
    error,
    loadStats,
    refetch: loadStats
  }
}

export const useBudgetForecast = () => {
  const [forecast, setForecast] = useState<BudgetForecast[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateForecast = useCallback(async (params: Parameters<typeof generateBudgetForecast>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await generateBudgetForecast(params)
      setForecast(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate forecast')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    forecast,
    loading,
    error,
    generateForecast
  }
}

export const useFinancialReports = () => {
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = useCallback(async (params: Parameters<typeof generateFinancialReport>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await generateFinancialReport(params)
      setReports(prev => [result, ...prev])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    reports,
    loading,
    error,
    generateReport
  }
}