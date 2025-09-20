'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useLeads, useLeadStats, type Lead } from '@/hooks/useLeads'
import { MainLayout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
  User,
  Building,
  Loader2
} from 'lucide-react'

const statusColors = {
  'new': 'bg-blue-100 text-blue-800',
  'contacted': 'bg-yellow-100 text-yellow-800',
  'qualified': 'bg-green-100 text-green-800',
  'proposal': 'bg-purple-100 text-purple-800',
  'negotiation': 'bg-orange-100 text-orange-800',
  'closed-won': 'bg-emerald-100 text-emerald-800',
  'closed-lost': 'bg-red-100 text-red-800',
}

const statusLabels = {
  'new': 'New',
  'contacted': 'Contacted',
  'qualified': 'Qualified',
  'proposal': 'Proposal',
  'negotiation': 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function LeadCard({ lead, onCall, onEmail, onSchedule }: { 
  lead: Lead
  onCall?: (lead: Lead) => void
  onEmail?: (lead: Lead) => void
  onSchedule?: (lead: Lead) => void
}) {
  const statusColor = statusColors[lead.status] || 'bg-gray-100 text-gray-800'
  const fullName = `${lead.firstName} ${lead.lastName}`
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{fullName}</h3>
            <p className="text-sm text-gray-600">{lead.company || 'No company'}</p>
          </div>
          <Badge className={statusColor}>
            {lead.status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            <span>{lead.email}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              <span>{lead.phone}</span>
            </div>
          )}
          <div className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            <span>{lead.source}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm text-gray-500">Priority: </span>
            <Badge variant={lead.priority === 'urgent' ? 'destructive' : lead.priority === 'high' ? 'default' : 'secondary'}>
              {lead.priority}
            </Badge>
          </div>
          {lead.value && (
            <div>
              <span className="text-sm text-gray-500">Value: </span>
              <span className="font-medium">${lead.value.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          {lead.assignedTo && <span>Assigned to: {lead.assignedTo}</span>}
          {lead.assignedTo && <br />}
          <span>Last contact: {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'Never'}</span>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onCall?.(lead)}>
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onEmail?.(lead)}>
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onSchedule?.(lead)}>
            <Calendar className="h-3 w-3 mr-1" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const { leads, loading, error, fetchLeads, addActivity } = useLeads({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    limit: 50
  })

  const { stats, loading: statsLoading } = useLeadStats()

  const handleCall = async (lead: Lead) => {
    try {
      await addActivity(lead.id, {
        type: 'call',
        description: `Called ${lead.firstName} ${lead.lastName}`,
        date: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log call activity:', error)
    }
  }

  const handleEmail = async (lead: Lead) => {
    try {
      await addActivity(lead.id, {
        type: 'email',
        description: `Sent email to ${lead.firstName} ${lead.lastName}`,
        date: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log email activity:', error)
    }
  }

  const handleSchedule = async (lead: Lead) => {
    try {
      await addActivity(lead.id, {
        type: 'meeting',
        description: `Scheduled meeting with ${lead.firstName} ${lead.lastName}`,
        date: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log meeting activity:', error)
    }
  }

  if (loading || statsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading leads: {error}</p>
          <Button onClick={fetchLeads}>Try Again</Button>
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
            <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
            <p className="text-gray-600 mt-1">
              Track and manage your sales pipeline
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Active in pipeline</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.new || 0}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.qualified || 0}</div>
              <p className="text-xs text-muted-foreground">Ready for proposal</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats?.totalValue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total potential</p>
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
                    placeholder="Search leads..."
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
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed-won">Closed Won</SelectItem>
                    <SelectItem value="closed-lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onCall={handleCall}
              onEmail={handleEmail}
              onSchedule={handleSchedule}
            />
          ))}
        </div>

        {leads.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add a new lead</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}