'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import {
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  User,
  Building,
  DollarSign,
  Clock,
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  source: string
  score: number
  value: number
  assignedTo: string
  createdAt: string
  lastContact: string
  priority: 'low' | 'medium' | 'high'
}

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Inc.',
    status: 'new',
    source: 'Website',
    score: 85,
    value: 25000,
    assignedTo: 'Sarah Johnson',
    createdAt: '2024-01-15',
    lastContact: '2024-01-15',
    priority: 'high'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@designstudio.com',
    phone: '+1 (555) 987-6543',
    company: 'Design Studio',
    status: 'contacted',
    source: 'Referral',
    score: 92,
    value: 35000,
    assignedTo: 'Mike Chen',
    createdAt: '2024-01-14',
    lastContact: '2024-01-16',
    priority: 'high'
  },
  {
    id: '3',
    name: 'Robert Wilson',
    email: 'robert@startup.io',
    phone: '+1 (555) 456-7890',
    company: 'Startup.io',
    status: 'qualified',
    source: 'LinkedIn',
    score: 78,
    value: 18000,
    assignedTo: 'Sarah Johnson',
    createdAt: '2024-01-13',
    lastContact: '2024-01-17',
    priority: 'medium'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@retailco.com',
    phone: '+1 (555) 321-0987',
    company: 'RetailCo',
    status: 'proposal',
    source: 'Cold Call',
    score: 88,
    value: 42000,
    assignedTo: 'David Lee',
    createdAt: '2024-01-12',
    lastContact: '2024-01-18',
    priority: 'high'
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael@consulting.com',
    phone: '+1 (555) 654-3210',
    company: 'Consulting Group',
    status: 'negotiation',
    source: 'Referral',
    score: 95,
    value: 55000,
    assignedTo: 'Sarah Johnson',
    createdAt: '2024-01-10',
    lastContact: '2024-01-19',
    priority: 'high'
  },
]

const pipelineStages = [
  { id: 'new', title: 'New Leads', color: 'bg-blue-50 border-blue-200' },
  { id: 'contacted', title: 'Contacted', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'qualified', title: 'Qualified', color: 'bg-green-50 border-green-200' },
  { id: 'proposal', title: 'Proposal Sent', color: 'bg-purple-50 border-purple-200' },
  { id: 'negotiation', title: 'Negotiation', color: 'bg-orange-50 border-orange-200' },
  { id: 'closed-won', title: 'Closed Won', color: 'bg-emerald-50 border-emerald-200' },
]

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function LeadPipelineCard({ lead }: { lead: Lead }) {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{lead.name}</h4>
              <p className="text-xs text-gray-500 flex items-center">
                <Building className="h-3 w-3 mr-1" />
                {lead.company}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${priorityColors[lead.priority]}`}>
              {lead.priority.toUpperCase()}
            </Badge>
            <div className={`flex items-center space-x-1 ${getScoreColor(lead.score)}`}>
              <Star className="h-3 w-3" />
              <span className="text-xs font-medium">{lead.score}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600">
              ${lead.value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">{lead.source}</span>
          </div>
          
          <div className="text-xs text-gray-500">
            <div className="flex items-center space-x-1 mb-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Last contact: {lead.lastContact}</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 pt-1 border-t">
            Assigned to {lead.assignedTo}
          </div>
        </div>
        
        <div className="flex space-x-1 mt-3">
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PipelineColumn({ stage, leads }: { stage: any, leads: Lead[] }) {
  const stageLeads = leads.filter(lead => lead.status === stage.id)
  const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0)
  
  return (
    <div className={`rounded-lg border-2 border-dashed p-4 min-h-[600px] ${stage.color}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{stage.title}</h3>
          <p className="text-sm text-gray-600">
            {stageLeads.length} leads • ${stageValue.toLocaleString()}
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {stageLeads.map((lead) => (
          <LeadPipelineCard key={lead.id} lead={lead} />
        ))}
        
        {stageLeads.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <User className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No leads in this stage</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeadPipelinePage() {
  const { user } = useAuth()
  
  const stats = {
    totalLeads: mockLeads.length,
    totalValue: mockLeads.reduce((sum, lead) => sum + lead.value, 0),
    avgDealSize: mockLeads.length > 0 ? mockLeads.reduce((sum, lead) => sum + lead.value, 0) / mockLeads.length : 0,
    conversionRate: 85, // Mock conversion rate
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="text-gray-600 mt-1">
              Visual overview of your sales process
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats.totalLeads} active leads</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Math.round(stats.avgDealSize).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per opportunity</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Lead to customer</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockLeads.filter(l => !['closed-won', 'closed-lost'].includes(l.status)).length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Board */}
        <div className="overflow-x-auto">
          <div className="flex space-x-6 min-w-max pb-4">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="w-80 flex-shrink-0">
                <PipelineColumn stage={stage} leads={mockLeads} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}