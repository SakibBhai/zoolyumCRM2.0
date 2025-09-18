'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { 
  useTransactions, 
  useBudgets, 
  useExpenses, 
  useRevenues, 
  useFinanceStats,
  useBudgetForecast,
  useFinancialReports,
  type Transaction,
  type Budget,
  type Expense,
  type Revenue
} from '@/hooks/useFinance'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  LineChart,
  Calculator,
  CreditCard,
  Wallet,
  Banknote,
  Receipt,
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Percent,
  Hash,
  Building,
  User,
  Tag,
  Calendar as CalendarIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  Briefcase,
  ShoppingCart,
  Car,
  Home,
  Zap,
  Coffee,
  Plane,
  Smartphone,
  Laptop,
} from 'lucide-react'

interface Transaction {
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

interface Budget {
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

interface FinancialReport {
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

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'Client Payment',
    subcategory: 'Project Payment',
    description: 'Website Development - Acme Corp',
    amount: 25000,
    currency: 'USD',
    date: '2024-01-25',
    status: 'completed',
    paymentMethod: 'Bank Transfer',
    reference: 'TXN-2024-001',
    clientId: '1',
    projectId: '1',
    invoiceId: 'INV-2024-001',
    tags: ['Client Payment', 'Web Development'],
    notes: 'Final payment for website project',
    createdBy: 'Sarah Johnson',
    approvedBy: 'John Smith',
    approvedDate: '2024-01-25'
  },
  {
    id: '2',
    type: 'expense',
    category: 'Software & Tools',
    subcategory: 'Design Software',
    description: 'Adobe Creative Suite - Monthly Subscription',
    amount: 599,
    currency: 'USD',
    date: '2024-01-20',
    status: 'completed',
    paymentMethod: 'Credit Card',
    reference: 'EXP-2024-001',
    receiptUrl: '/receipts/adobe-jan-2024.pdf',
    tags: ['Software', 'Subscription', 'Design'],
    notes: 'Monthly subscription for design team',
    createdBy: 'Emily Davis',
    approvedBy: 'Sarah Johnson',
    approvedDate: '2024-01-20'
  },
  {
    id: '3',
    type: 'expense',
    category: 'Office & Equipment',
    subcategory: 'Hardware',
    description: 'MacBook Pro 16" for new developer',
    amount: 2499,
    currency: 'USD',
    date: '2024-01-18',
    status: 'completed',
    paymentMethod: 'Company Card',
    reference: 'EXP-2024-002',
    receiptUrl: '/receipts/macbook-jan-2024.pdf',
    tags: ['Hardware', 'Equipment', 'Developer'],
    notes: 'Equipment for new team member',
    createdBy: 'David Lee',
    approvedBy: 'John Smith',
    approvedDate: '2024-01-18'
  },
  {
    id: '4',
    type: 'income',
    category: 'Consulting',
    subcategory: 'Technical Consulting',
    description: 'Technical Consulting - TechStart Inc',
    amount: 7500,
    currency: 'USD',
    date: '2024-01-15',
    status: 'completed',
    paymentMethod: 'Wire Transfer',
    reference: 'TXN-2024-002',
    clientId: '2',
    invoiceId: 'INV-2024-002',
    tags: ['Consulting', 'Technical'],
    notes: 'Monthly consulting retainer',
    createdBy: 'David Lee',
    approvedBy: 'Sarah Johnson',
    approvedDate: '2024-01-15'
  },
  {
    id: '5',
    type: 'expense',
    category: 'Marketing',
    subcategory: 'Advertising',
    description: 'Google Ads Campaign - Q1 2024',
    amount: 3500,
    currency: 'USD',
    date: '2024-01-10',
    status: 'pending',
    paymentMethod: 'Credit Card',
    reference: 'EXP-2024-003',
    tags: ['Marketing', 'Advertising', 'Google Ads'],
    notes: 'Q1 marketing campaign budget',
    createdBy: 'Emily Davis'
  },
]

const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Software & Tools',
    category: 'Technology',
    period: 'monthly',
    budgetAmount: 5000,
    spentAmount: 3200,
    currency: 'USD',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'active',
    description: 'Monthly budget for software subscriptions and tools',
    assignedTo: 'IT Department',
    alerts: {
      threshold: 80,
      enabled: true
    },
    tags: ['Software', 'Monthly']
  },
  {
    id: '2',
    name: 'Marketing & Advertising',
    category: 'Marketing',
    period: 'quarterly',
    budgetAmount: 15000,
    spentAmount: 8500,
    currency: 'USD',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    status: 'active',
    description: 'Q1 marketing and advertising budget',
    assignedTo: 'Marketing Team',
    alerts: {
      threshold: 75,
      enabled: true
    },
    tags: ['Marketing', 'Quarterly']
  },
  {
    id: '3',
    name: 'Office Equipment',
    category: 'Operations',
    period: 'yearly',
    budgetAmount: 25000,
    spentAmount: 12800,
    currency: 'USD',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    description: 'Annual budget for office equipment and furniture',
    assignedTo: 'Operations Team',
    alerts: {
      threshold: 85,
      enabled: true
    },
    tags: ['Equipment', 'Annual']
  },
  {
    id: '4',
    name: 'Travel & Entertainment',
    category: 'Business Development',
    period: 'quarterly',
    budgetAmount: 8000,
    spentAmount: 9200,
    currency: 'USD',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    status: 'exceeded',
    description: 'Q1 travel and client entertainment budget',
    assignedTo: 'Sales Team',
    alerts: {
      threshold: 90,
      enabled: true
    },
    tags: ['Travel', 'Entertainment']
  },
]

const mockReports: FinancialReport[] = [
  {
    id: '1',
    name: 'January 2024 P&L Statement',
    type: 'profit_loss',
    period: 'January 2024',
    generatedDate: '2024-02-01',
    status: 'final',
    data: {
      totalRevenue: 125000,
      totalExpenses: 85000,
      netProfit: 40000,
      profitMargin: 32,
      cashFlow: 35000,
      budgetVariance: 5000
    },
    charts: ['revenue_trend', 'expense_breakdown', 'profit_margin'],
    createdBy: 'Finance Team'
  },
  {
    id: '2',
    name: 'Q1 2024 Cash Flow Analysis',
    type: 'cash_flow',
    period: 'Q1 2024',
    generatedDate: '2024-01-28',
    status: 'draft',
    data: {
      totalRevenue: 95000,
      totalExpenses: 62000,
      netProfit: 33000,
      profitMargin: 35,
      cashFlow: 28000,
      budgetVariance: 3000
    },
    charts: ['cash_flow_trend', 'receivables_aging'],
    createdBy: 'Sarah Johnson'
  },
  {
    id: '3',
    name: 'Budget vs Actual - January',
    type: 'budget_variance',
    period: 'January 2024',
    generatedDate: '2024-01-30',
    status: 'final',
    data: {
      totalRevenue: 125000,
      totalExpenses: 85000,
      netProfit: 40000,
      profitMargin: 32,
      cashFlow: 35000,
      budgetVariance: -2000
    },
    charts: ['budget_variance', 'category_breakdown'],
    createdBy: 'Finance Team'
  },
]

const transactionStatusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
}

const budgetStatusColors = {
  'active': 'bg-blue-100 text-blue-800',
  'exceeded': 'bg-red-100 text-red-800',
  'completed': 'bg-green-100 text-green-800',
  'draft': 'bg-gray-100 text-gray-800',
}

const reportStatusColors = {
  'draft': 'bg-yellow-100 text-yellow-800',
  'final': 'bg-green-100 text-green-800',
  'archived': 'bg-gray-100 text-gray-800',
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === 'income'
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600'
  const amountPrefix = isIncome ? '+' : '-'
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{transaction.description}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {transaction.category} {transaction.subcategory && `• ${transaction.subcategory}`}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={transactionStatusColors[transaction.status]}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
              <Badge variant="outline">{transaction.paymentMethod}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${amountColor}`}>
              {amountPrefix}${transaction.amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {transaction.currency}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{transaction.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono text-xs">{transaction.reference || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created by:</span>
              <span>{transaction.createdBy}</span>
            </div>
          </div>
          <div className="space-y-1">
            {transaction.clientId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="text-blue-600">#{transaction.clientId}</span>
              </div>
            )}
            {transaction.projectId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Project:</span>
                <span className="text-blue-600">#{transaction.projectId}</span>
              </div>
            )}
            {transaction.approvedBy && (
              <div className="flex justify-between">
                <span className="text-gray-600">Approved by:</span>
                <span>{transaction.approvedBy}</span>
              </div>
            )}
          </div>
        </div>
        
        {transaction.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {transaction.notes}
          </div>
        )}
        
        {transaction.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {transaction.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {transaction.receiptUrl && (
            <Button size="sm" variant="outline" className="flex-1">
              <Download className="h-3 w-3 mr-1" />
              Receipt
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function BudgetCard({ budget }: { budget: Budget }) {
  const spentPercentage = (budget.spentAmount / budget.budgetAmount) * 100
  const isExceeded = budget.status === 'exceeded'
  const isNearLimit = spentPercentage >= budget.alerts.threshold
  
  const progressColor = isExceeded ? 'bg-red-500' : 
                       isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${isExceeded ? 'border-red-200' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{budget.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {budget.category} • {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={budgetStatusColors[budget.status]}>
                {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
              </Badge>
              <Badge variant="outline">{budget.assignedTo}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              ${budget.spentAmount.toLocaleString()} / ${budget.budgetAmount.toLocaleString()}
            </div>
            <div className={`text-lg font-bold ${isExceeded ? 'text-red-600' : 'text-blue-600'}`}>
              {spentPercentage.toFixed(1)}% used
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          {budget.description}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Budget Progress</span>
            <span className={`font-medium ${isExceeded ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'}`}>
              {spentPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${progressColor}`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          {isExceeded && (
            <div className="text-xs text-red-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Budget exceeded by ${(budget.spentAmount - budget.budgetAmount).toLocaleString()}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Period:</span>
              <span>{budget.startDate} to {budget.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining:</span>
              <span className={isExceeded ? 'text-red-600' : 'text-green-600'}>
                ${Math.max(0, budget.budgetAmount - budget.spentAmount).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Alert threshold:</span>
              <span>{budget.alerts.threshold}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Alerts:</span>
              <span className={budget.alerts.enabled ? 'text-green-600' : 'text-gray-600'}>
                {budget.alerts.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        
        {budget.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {budget.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <BarChart3 className="h-3 w-3 mr-1" />
            Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ReportCard({ report }: { report: FinancialReport }) {
  const profitColor = report.data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
  const profitIcon = report.data.netProfit >= 0 ? TrendingUp : TrendingDown
  const ProfitIcon = profitIcon
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{report.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {report.period}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={reportStatusColors[report.status]}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
              <Badge variant="outline">{report.createdBy}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${profitColor} flex items-center`}>
              <ProfitIcon className="h-5 w-5 mr-1" />
              ${Math.abs(report.data.netProfit).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {report.data.profitMargin}% margin
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-medium text-green-600">
                ${report.data.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expenses:</span>
              <span className="font-medium text-red-600">
                ${report.data.totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cash Flow:</span>
              <span className={`font-medium ${report.data.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${report.data.cashFlow.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Generated:</span>
              <span>{report.generatedDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Charts:</span>
              <span>{report.charts.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Variance:</span>
              <span className={`font-medium ${report.data.budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${report.data.budgetVariance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <BarChart3 className="h-3 w-3 mr-1" />
            Charts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FinancePage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showForecast, setShowForecast] = useState(false)

  // Finance hooks
  const { transactions, loading: transactionsLoading, error: transactionsError, loadTransactions } = useTransactions()
  const { budgets, loading: budgetsLoading, error: budgetsError, loadBudgets } = useBudgets()
  const { expenses, loading: expensesLoading, error: expensesError, loadExpenses, approveExpense, rejectExpense } = useExpenses()
  const { revenues, loading: revenuesLoading, error: revenuesError, loadRevenues } = useRevenues()
  const { stats, loading: statsLoading, error: statsError, loadStats } = useFinanceStats()
  const { forecast, loading: forecastLoading, error: forecastError, generateForecast } = useBudgetForecast()
  const { reports, loading: reportsLoading, error: reportsError, generateReport } = useFinancialReports()

  // Load data on component mount
  useEffect(() => {
    loadTransactions()
    loadBudgets()
    loadExpenses()
    loadRevenues()
    loadStats()
  }, [])

  // Generate forecast when period changes
  useEffect(() => {
    if (showForecast) {
      generateForecast({
        period: selectedPeriod,
        months: selectedPeriod === 'month' ? 3 : selectedPeriod === 'quarter' ? 12 : 24
      })
    }
  }, [selectedPeriod, showForecast, generateForecast])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  const filteredTransactions = (transactions || mockTransactions).filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory
  })

  const filteredBudgets = (budgets || mockBudgets).filter(budget => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || budget.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const filteredReports = (reports || mockReports).filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.period.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate overview stats
  const totalIncome = stats?.totalRevenue || (transactions || mockTransactions)
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = stats?.totalExpenses || (transactions || mockTransactions)
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netProfit = stats?.netProfit || (totalIncome - totalExpenses)
  const profitMargin = stats?.profitMargin || (totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0)

  const handleApproveExpense = async (expenseId: string) => {
    try {
      await approveExpense(expenseId, 'Approved by manager')
    } catch (error) {
      console.error('Failed to approve expense:', error)
    }
  }

  const handleRejectExpense = async (expenseId: string, reason: string) => {
    try {
      await rejectExpense(expenseId, reason)
    } catch (error) {
      console.error('Failed to reject expense:', error)
    }
  }

  const handleGenerateReport = async (type: string) => {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      const endDate = new Date()
      
      await generateReport({
        type,
        period: selectedPeriod,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }
  
  const totalBudget = mockBudgets.reduce((sum, b) => sum + b.budgetAmount, 0)
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spentAmount, 0)
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  
  const exceededBudgets = mockBudgets.filter(b => b.status === 'exceeded').length
  const activeBudgets = mockBudgets.filter(b => b.status === 'active').length

  const categories = [...new Set(mockTransactions.map(t => t.category))]
  const budgetCategories = [...new Set(mockBudgets.map(b => b.category))]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
            <p className="text-gray-600 mt-1">
              Financial management, budgets, and reporting
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netProfit.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% margin</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${budgetUtilization > 90 ? 'text-red-600' : budgetUtilization > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {budgetUtilization.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{activeBudgets}</div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Exceeded Budgets</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{exceededBudgets}</div>
                  <p className="text-xs text-muted-foreground">Over budget</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {mockTransactions.filter(t => t.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{mockReports.length}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common financial tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Plus className="h-6 w-6 mb-2" />
                    Add Transaction
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Target className="h-6 w-6 mb-2" />
                    Create Budget
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Generate Report
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Upload className="h-6 w-6 mb-2" />
                    Import Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Transaction Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search transactions..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Advanced
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            {/* Budget Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search budgets..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="exceeded">Exceeded</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {budgetCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Advanced
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Report Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search reports..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Advanced
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty States */}
        {activeTab === 'transactions' && filteredTransactions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add a new transaction</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'budgets' && filteredBudgets.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new budget</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && filteredReports.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or generate a new report</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}