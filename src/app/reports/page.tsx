'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
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
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Building,
  FileText,
  Activity,
  Zap,
  RefreshCw,
  Settings,
  Share2,
  Bookmark,
  Star,
  Calendar as CalendarIcon,
  Hash,
  Percent,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react'

interface Report {
  id: string
  name: string
  description: string
  type: 'sales' | 'financial' | 'project' | 'team' | 'client' | 'custom'
  category: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  visibility: 'private' | 'team' | 'company' | 'public'
  createdBy: string
  createdDate: string
  lastModified: string
  scheduledDate?: string
  tags: string[]
  metrics: {
    views: number
    downloads: number
    shares: number
  }
  data: {
    period: string
    totalRecords: number
    keyMetrics: Record<string, number>
    charts: string[]
    insights: string[]
  }
  format: 'pdf' | 'excel' | 'csv' | 'dashboard'
  recipients?: string[]
  automation?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    nextRun?: string
  }
}

interface Dashboard {
  id: string
  name: string
  description: string
  type: 'executive' | 'sales' | 'project' | 'financial' | 'operational' | 'custom'
  layout: 'grid' | 'list' | 'kanban'
  widgets: Widget[]
  filters: DashboardFilter[]
  refreshRate: number
  isPublic: boolean
  createdBy: string
  createdDate: string
  lastAccessed: string
  accessCount: number
  tags: string[]
}

interface Widget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'progress' | 'list' | 'calendar'
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  position: { x: number; y: number }
  dataSource: string
  config: Record<string, any>
  refreshRate: number
}

interface DashboardFilter {
  id: string
  name: string
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number'
  options?: string[]
  defaultValue?: any
}

interface Analytics {
  id: string
  metric: string
  value: number
  previousValue: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  period: string
  trend: number[]
  target?: number
  unit: string
  category: string
}

const mockReports: Report[] = [
  {
    id: '1',
    name: 'Monthly Sales Performance',
    description: 'Comprehensive analysis of sales metrics, lead conversion, and revenue trends',
    type: 'sales',
    category: 'Performance',
    status: 'published',
    visibility: 'team',
    createdBy: 'Sarah Johnson',
    createdDate: '2024-01-15',
    lastModified: '2024-01-25',
    tags: ['Sales', 'Monthly', 'Performance'],
    metrics: {
      views: 156,
      downloads: 23,
      shares: 8
    },
    data: {
      period: 'January 2024',
      totalRecords: 1250,
      keyMetrics: {
        totalRevenue: 125000,
        leadsGenerated: 450,
        conversionRate: 12.5,
        avgDealSize: 2500
      },
      charts: ['revenue_trend', 'lead_funnel', 'conversion_analysis'],
      insights: [
        'Revenue increased by 15% compared to last month',
        'Lead quality improved with 18% higher conversion rate',
        'Enterprise deals contributed 60% of total revenue'
      ]
    },
    format: 'pdf',
    recipients: ['team@company.com', 'management@company.com'],
    automation: {
      enabled: true,
      frequency: 'monthly',
      nextRun: '2024-02-01'
    }
  },
  {
    id: '2',
    name: 'Project Delivery Dashboard',
    description: 'Real-time overview of project status, resource utilization, and delivery metrics',
    type: 'project',
    category: 'Operations',
    status: 'published',
    visibility: 'company',
    createdBy: 'David Lee',
    createdDate: '2024-01-10',
    lastModified: '2024-01-24',
    tags: ['Projects', 'Delivery', 'Real-time'],
    metrics: {
      views: 89,
      downloads: 12,
      shares: 5
    },
    data: {
      period: 'Current Quarter',
      totalRecords: 45,
      keyMetrics: {
        activeProjects: 12,
        onTimeDelivery: 85,
        resourceUtilization: 78,
        clientSatisfaction: 4.2
      },
      charts: ['project_timeline', 'resource_allocation', 'delivery_trends'],
      insights: [
        '3 projects at risk of delay due to resource constraints',
        'Client satisfaction improved by 0.3 points this quarter',
        'Development team utilization at optimal 78%'
      ]
    },
    format: 'dashboard',
    automation: {
      enabled: true,
      frequency: 'weekly',
      nextRun: '2024-01-29'
    }
  },
  {
    id: '3',
    name: 'Financial Health Report',
    description: 'Detailed financial analysis including P&L, cash flow, and budget variance',
    type: 'financial',
    category: 'Finance',
    status: 'draft',
    visibility: 'private',
    createdBy: 'Emily Davis',
    createdDate: '2024-01-20',
    lastModified: '2024-01-25',
    tags: ['Finance', 'P&L', 'Cash Flow'],
    metrics: {
      views: 12,
      downloads: 2,
      shares: 0
    },
    data: {
      period: 'Q4 2023',
      totalRecords: 890,
      keyMetrics: {
        revenue: 485000,
        expenses: 320000,
        netProfit: 165000,
        profitMargin: 34
      },
      charts: ['profit_loss', 'cash_flow', 'expense_breakdown'],
      insights: [
        'Profit margin increased by 5% compared to Q3',
        'Operating expenses reduced by 8% through optimization',
        'Cash flow positive for 6 consecutive months'
      ]
    },
    format: 'excel'
  },
  {
    id: '4',
    name: 'Team Performance Analytics',
    description: 'Individual and team productivity metrics, goal achievement, and capacity planning',
    type: 'team',
    category: 'HR',
    status: 'scheduled',
    visibility: 'team',
    createdBy: 'John Smith',
    createdDate: '2024-01-18',
    lastModified: '2024-01-23',
    scheduledDate: '2024-02-01',
    tags: ['Team', 'Performance', 'Productivity'],
    metrics: {
      views: 67,
      downloads: 15,
      shares: 3
    },
    data: {
      period: 'January 2024',
      totalRecords: 25,
      keyMetrics: {
        teamSize: 15,
        avgProductivity: 87,
        goalAchievement: 92,
        utilization: 82
      },
      charts: ['productivity_trends', 'goal_progress', 'capacity_analysis'],
      insights: [
        'Team exceeded quarterly goals by 12%',
        'Average productivity increased by 8% this month',
        '2 team members ready for promotion based on performance'
      ]
    },
    format: 'pdf',
    automation: {
      enabled: true,
      frequency: 'monthly',
      nextRun: '2024-02-01'
    }
  },
]

const mockDashboards: Dashboard[] = [
  {
    id: '1',
    name: 'Executive Overview',
    description: 'High-level KPIs and business metrics for leadership team',
    type: 'executive',
    layout: 'grid',
    widgets: [
      {
        id: '1',
        type: 'metric',
        title: 'Monthly Revenue',
        size: 'medium',
        position: { x: 0, y: 0 },
        dataSource: 'sales',
        config: { metric: 'revenue', format: 'currency' },
        refreshRate: 300
      },
      {
        id: '2',
        type: 'chart',
        title: 'Revenue Trend',
        size: 'large',
        position: { x: 1, y: 0 },
        dataSource: 'sales',
        config: { chartType: 'line', period: '12months' },
        refreshRate: 600
      }
    ],
    filters: [
      {
        id: '1',
        name: 'Date Range',
        type: 'date',
        defaultValue: 'last30days'
      },
      {
        id: '2',
        name: 'Department',
        type: 'select',
        options: ['All', 'Sales', 'Marketing', 'Development'],
        defaultValue: 'All'
      }
    ],
    refreshRate: 300,
    isPublic: false,
    createdBy: 'John Smith',
    createdDate: '2024-01-10',
    lastAccessed: '2024-01-25',
    accessCount: 245,
    tags: ['Executive', 'KPIs', 'Overview']
  },
  {
    id: '2',
    name: 'Sales Performance',
    description: 'Detailed sales metrics, pipeline analysis, and team performance',
    type: 'sales',
    layout: 'grid',
    widgets: [
      {
        id: '3',
        type: 'metric',
        title: 'Pipeline Value',
        size: 'small',
        position: { x: 0, y: 0 },
        dataSource: 'leads',
        config: { metric: 'pipeline_value', format: 'currency' },
        refreshRate: 180
      },
      {
        id: '4',
        type: 'progress',
        title: 'Monthly Goal',
        size: 'small',
        position: { x: 1, y: 0 },
        dataSource: 'sales',
        config: { target: 100000, current: 75000 },
        refreshRate: 300
      }
    ],
    filters: [
      {
        id: '3',
        name: 'Sales Rep',
        type: 'multiselect',
        options: ['All', 'Sarah Johnson', 'Mike Wilson', 'Lisa Chen'],
        defaultValue: ['All']
      }
    ],
    refreshRate: 180,
    isPublic: true,
    createdBy: 'Sarah Johnson',
    createdDate: '2024-01-12',
    lastAccessed: '2024-01-25',
    accessCount: 156,
    tags: ['Sales', 'Pipeline', 'Performance']
  },
]

const mockAnalytics: Analytics[] = [
  {
    id: '1',
    metric: 'Total Revenue',
    value: 125000,
    previousValue: 108000,
    change: 15.7,
    changeType: 'increase',
    period: 'This Month',
    trend: [95000, 102000, 108000, 115000, 125000],
    target: 120000,
    unit: 'USD',
    category: 'Financial'
  },
  {
    id: '2',
    metric: 'Active Projects',
    value: 12,
    previousValue: 15,
    change: -20,
    changeType: 'decrease',
    period: 'This Month',
    trend: [18, 16, 15, 14, 12],
    target: 15,
    unit: 'count',
    category: 'Operations'
  },
  {
    id: '3',
    metric: 'Team Productivity',
    value: 87,
    previousValue: 82,
    change: 6.1,
    changeType: 'increase',
    period: 'This Month',
    trend: [78, 80, 82, 85, 87],
    target: 85,
    unit: '%',
    category: 'Team'
  },
  {
    id: '4',
    metric: 'Client Satisfaction',
    value: 4.2,
    previousValue: 3.9,
    change: 7.7,
    changeType: 'increase',
    period: 'This Quarter',
    trend: [3.8, 3.9, 4.0, 4.1, 4.2],
    target: 4.0,
    unit: 'rating',
    category: 'Client'
  },
]

const reportStatusColors = {
  'draft': 'bg-yellow-100 text-yellow-800',
  'published': 'bg-green-100 text-green-800',
  'scheduled': 'bg-blue-100 text-blue-800',
  'archived': 'bg-gray-100 text-gray-800',
}

const visibilityColors = {
  'private': 'bg-red-100 text-red-800',
  'team': 'bg-blue-100 text-blue-800',
  'company': 'bg-purple-100 text-purple-800',
  'public': 'bg-green-100 text-green-800',
}

function ReportCard({ report }: { report: Report }) {
  const changeIcon = report.data.keyMetrics.totalRevenue ? TrendingUp : TrendingDown
  const ChangeIcon = changeIcon
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{report.name}</CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-2">
              {report.description}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={reportStatusColors[report.status]}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
              <Badge className={visibilityColors[report.visibility]}>
                {report.visibility.charAt(0).toUpperCase() + report.visibility.slice(1)}
              </Badge>
              <Badge variant="outline">{report.type}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {report.data.period}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {report.data.totalRecords} records
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{report.metrics.views}</div>
            <div className="text-gray-600">Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{report.metrics.downloads}</div>
            <div className="text-gray-600">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{report.metrics.shares}</div>
            <div className="text-gray-600">Shares</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Key Insights</div>
          <div className="space-y-1">
            {report.data.insights.slice(0, 2).map((insight, index) => (
              <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                • {insight}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Created by:</span>
              <span>{report.createdBy}</span>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{report.createdDate}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="uppercase">{report.format}</span>
            </div>
            <div className="flex justify-between">
              <span>Auto:</span>
              <span className={report.automation?.enabled ? 'text-green-600' : 'text-gray-400'}>
                {report.automation?.enabled ? report.automation.frequency : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        
        {report.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {report.tags.map((tag) => (
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
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardCard({ dashboard }: { dashboard: Dashboard }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{dashboard.name}</CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-2">
              {dashboard.description}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{dashboard.type}</Badge>
              <Badge variant="outline">{dashboard.layout}</Badge>
              {dashboard.isPublic && (
                <Badge className="bg-green-100 text-green-800">Public</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{dashboard.widgets.length} widgets</div>
            <div className="text-xs text-gray-500 mt-1">
              {dashboard.accessCount} views
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Refresh:</span>
              <span>{dashboard.refreshRate}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Filters:</span>
              <span>{dashboard.filters.length}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{dashboard.createdDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last access:</span>
              <span>{dashboard.lastAccessed}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Widgets</div>
          <div className="grid grid-cols-2 gap-2">
            {dashboard.widgets.slice(0, 4).map((widget) => (
              <div key={widget.id} className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-medium">{widget.title}</div>
                <div className="text-gray-600">{widget.type} • {widget.size}</div>
              </div>
            ))}
          </div>
        </div>
        
        {dashboard.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dashboard.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Open
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Settings className="h-3 w-3 mr-1" />
            Config
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsCard({ analytics }: { analytics: Analytics }) {
  const isPositive = analytics.changeType === 'increase'
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const changeIcon = isPositive ? TrendingUp : TrendingDown
  const ChangeIcon = changeIcon
  
  const formatValue = (value: number, unit: string) => {
    if (unit === 'USD') return `$${value.toLocaleString()}`
    if (unit === '%') return `${value}%`
    if (unit === 'rating') return `${value}/5`
    return value.toString()
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{analytics.metric}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {analytics.category} • {analytics.period}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatValue(analytics.value, analytics.unit)}
            </div>
            <div className={`text-sm flex items-center ${changeColor}`}>
              <ChangeIcon className="h-3 w-3 mr-1" />
              {Math.abs(analytics.change)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Previous:</span>
            <span>{formatValue(analytics.previousValue, analytics.unit)}</span>
          </div>
          {analytics.target && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target:</span>
              <span className={analytics.value >= analytics.target ? 'text-green-600' : 'text-red-600'}>
                {formatValue(analytics.target, analytics.unit)}
              </span>
            </div>
          )}
        </div>
        
        {analytics.target && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress to Target</span>
              <span className="font-medium">
                {((analytics.value / analytics.target) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  analytics.value >= analytics.target ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((analytics.value / analytics.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Trend (Last 5 periods)</div>
          <div className="flex items-end space-x-1 h-12">
            {analytics.trend.map((value, index) => {
              const maxValue = Math.max(...analytics.trend)
              const height = (value / maxValue) * 100
              return (
                <div
                  key={index}
                  className="bg-blue-200 rounded-t flex-1 transition-all hover:bg-blue-300"
                  style={{ height: `${height}%` }}
                  title={formatValue(value, analytics.unit)}
                />
              )
            })}
          </div>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <BarChart3 className="h-3 w-3 mr-1" />
            Details
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory
  })

  const filteredDashboards = mockDashboards.filter(dashboard => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dashboard.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || dashboard.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const filteredAnalytics = mockAnalytics.filter(analytics => {
    const matchesSearch = analytics.metric.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analytics.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || analytics.category.toLowerCase() === categoryFilter.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  const reportTypes = [...new Set(mockReports.map(r => r.type))]
  const reportCategories = [...new Set(mockReports.map(r => r.category))]
  const analyticsCategories = [...new Set(mockAnalytics.map(a => a.category))]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">
              Business intelligence, reporting, and data visualization
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockReports.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {mockReports.filter(r => r.status === 'published').length} published
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Dashboards</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockDashboards.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {mockDashboards.filter(d => d.isPublic).length} public
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockReports.reduce((sum, r) => sum + r.metrics.views, 0) + 
                     mockDashboards.reduce((sum, d) => sum + d.accessCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Automated Reports</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockReports.filter(r => r.automation?.enabled).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Active automations</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Overview</CardTitle>
                <CardDescription>Real-time business performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockAnalytics.map((analytics) => (
                    <div key={analytics.id} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.unit === 'USD' ? `$${analytics.value.toLocaleString()}` :
                         analytics.unit === '%' ? `${analytics.value}%` :
                         analytics.unit === 'rating' ? `${analytics.value}/5` :
                         analytics.value}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mt-1">
                        {analytics.metric}
                      </div>
                      <div className={`text-xs flex items-center justify-center mt-1 ${
                        analytics.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analytics.changeType === 'increase' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(analytics.change)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest reports and dashboard updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {report.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.type} • Updated {report.lastModified}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={reportStatusColors[report.status]}>
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Report Filters */}
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
                        placeholder="Search reports..."
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
                        {reportTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
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
                        {reportCategories.map((category) => (
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

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dashboards" className="space-y-6">
            {/* Dashboard Filters */}
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
                        placeholder="Search dashboards..."
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
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
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

            {/* Dashboards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDashboards.map((dashboard) => (
                <DashboardCard key={dashboard.id} dashboard={dashboard} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Filters */}
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
                        placeholder="Search metrics..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {analyticsCategories.map((category) => (
                          <SelectItem key={category} value={category.toLowerCase()}>{category}</SelectItem>
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

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnalytics.map((analytics) => (
                <AnalyticsCard key={analytics.id} analytics={analytics} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty States */}
        {activeTab === 'reports' && filteredReports.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new report</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'dashboards' && filteredDashboards.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dashboards found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new dashboard</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && filteredAnalytics.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or configure new metrics</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}