'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useClients } from '@/hooks/useClients'
import type { Client } from '@/shared/types'
import { MainLayout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  TrendingDown,
  User,
  Building,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Loader2
} from 'lucide-react'

interface ClientWithProjects extends Client {
  activeProjects?: number
  lastContact?: string
  accountManager?: string
  joinDate?: string
  size?: 'small' | 'medium' | 'large' | 'enterprise'
  satisfaction?: number
  renewalDate?: string
}

// Remove mock data - now using real API data

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'inactive': 'bg-gray-100 text-gray-800',
  'at-risk': 'bg-red-100 text-red-800',
  'churned': 'bg-red-100 text-red-800',
}

const statusLabels = {
  'active': 'Active',
  'inactive': 'Inactive',
  'at-risk': 'At Risk',
  'churned': 'Churned',
}

const sizeLabels = {
  'small': 'Small (1-10)',
  'medium': 'Medium (11-50)',
  'large': 'Large (51-200)',
  'enterprise': 'Enterprise (200+)',
}

function getHealthScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

function getHealthScoreIcon(score: number) {
  if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />
  if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-600" />
  if (score >= 40) return <TrendingDown className="h-4 w-4 text-orange-600" />
  return <AlertTriangle className="h-4 w-4 text-red-600" />
}

interface ClientCardProps {
  client: Client
  onCall?: (client: Client) => void
  onEmail?: (client: Client) => void
  onSchedule?: (client: Client) => void
  onEdit?: (client: Client) => void
}

const ClientCard = ({ client, onCall, onEmail, onSchedule, onEdit }: ClientCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{client.name}</CardTitle>
              <p className="text-sm text-gray-600">{client.company}</p>
            </div>
          </div>
          <Badge 
            variant={client.status === 'active' ? 'default' : 
                    client.status === 'at-risk' ? 'destructive' : 'secondary'}
            className={statusColors[client.status]}
          >
            {statusLabels[client.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-1">
              {getHealthScoreIcon(client.healthScore)}
              <span>Health Score</span>
            </span>
            <span className={`font-medium ${getHealthScoreColor(client.healthScore)}`}>
              {client.healthScore}%
            </span>
          </div>
          <Progress 
            value={client.healthScore} 
            className="h-2"
          />
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Value</p>
            <p className="font-medium">${client.totalValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Projects</p>
            <p className="font-medium">{client.activeProjects}</p>
          </div>
          <div>
            <p className="text-gray-600">Last Contact</p>
            <p className="font-medium">{client.lastContact}</p>
          </div>
          <div>
            <p className="text-gray-600">Account Manager</p>
            <p className="font-medium">{client.accountManager}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onCall?.(client)}
          >
            <Phone className="w-4 h-4 mr-1" />
            Call
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onEmail?.(client)}
          >
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onSchedule?.(client)}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onEdit?.(client)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Use real API data
  const { 
    clients, 
    loading: clientsLoading, 
    error: clientsError,
    updateClient,
    deleteClient
  } = useClients({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    tier: tierFilter !== 'all' ? tierFilter : undefined,
    industry: industryFilter !== 'all' ? industryFilter : undefined
  })

  const { 
    stats, 
    loading: statsLoading, 
    error: statsError 
  } = useClientStats()

  if (!user) {
    return <div>Please log in to access clients.</div>
  }

  // Handle client actions
  const handleCall = (client: Client) => {
    console.log('Calling client:', client.name)
    // In a real app, this would integrate with a phone system
  }

  const handleEmail = (client: Client) => {
    console.log('Emailing client:', client.email)
    // In a real app, this would open email client or send email
    window.location.href = `mailto:${client.email}`
  }

  const handleSchedule = (client: Client) => {
    console.log('Scheduling meeting with client:', client.name)
    // In a real app, this would open calendar integration
  }

  const handleEdit = (client: Client) => {
    console.log('Editing client:', client.name)
    // In a real app, this would open edit modal or navigate to edit page
  }

  const loading = clientsLoading || statsLoading
  const error = clientsError || statsError

  const filteredClients = clients || []

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="text-gray-600 mt-1">
                Manage client relationships and track account health
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading clients...</span>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="text-gray-600 mt-1">
                Manage client relationships and track account health
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading clients</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-1">
              Manage client relationships and track account health
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">Healthy accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.atRisk || 0}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats?.totalValue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Account value</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthScoreColor(stats?.avgHealthScore || 0)}`}>
                {Math.round(stats?.avgHealthScore || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Health score</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.avgSatisfaction || 0).toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                    placeholder="Search clients..."
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
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">Company Size</Label>
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="small">Small (1-10)</SelectItem>
                    <SelectItem value="medium">Medium (11-50)</SelectItem>
                    <SelectItem value="large">Large (51-200)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="health">Health Score</Label>
                <Select value={healthFilter} onValueChange={setHealthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="high">High (80+)</SelectItem>
                    <SelectItem value="medium">Medium (60-79)</SelectItem>
                    <SelectItem value="low">Low (&lt;60)</SelectItem>
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

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onCall={handleCall}
              onEmail={handleEmail}
              onSchedule={handleSchedule}
              onEdit={handleEdit}
            />
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add a new client</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}