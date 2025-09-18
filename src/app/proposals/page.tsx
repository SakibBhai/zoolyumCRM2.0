'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { useProposals, useProposalStats, useInvoices, useInvoiceStats } from '@/hooks/useProposals'
import type { Proposal, Invoice } from '@/hooks/useProposals'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Eye,
  Edit,
  Download,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  Calculator,
  Percent,
  Hash,
  Calendar as CalendarIcon,
  Banknote,
  Wallet,
  Target,
  Award,
  Zap,
} from 'lucide-react'

// Mock data will be replaced with API calls

const proposalStatusColors = {
  'draft': 'bg-gray-100 text-gray-800',
  'sent': 'bg-blue-100 text-blue-800',
  'viewed': 'bg-yellow-100 text-yellow-800',
  'accepted': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'expired': 'bg-orange-100 text-orange-800',
}

const invoiceStatusColors = {
  'draft': 'bg-gray-100 text-gray-800',
  'sent': 'bg-blue-100 text-blue-800',
  'paid': 'bg-green-100 text-green-800',
  'overdue': 'bg-red-100 text-red-800',
  'cancelled': 'bg-orange-100 text-orange-800',
}

function ProposalCard({ proposal, onView, onEdit, onDelete, onSend }: { 
  proposal: Proposal
  onView: (proposal: Proposal) => void
  onEdit: (proposal: Proposal) => void
  onDelete: (proposal: Proposal) => void
  onSend: (proposal: Proposal) => void
}) {
  const probabilityColor = proposal.probability >= 75 ? 'text-green-600' : 
                          proposal.probability >= 50 ? 'text-yellow-600' : 'text-red-600'
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{proposal.title}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {proposal.client} • {proposal.clientEmail}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={proposalStatusColors[proposal.status]}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </Badge>
              <Badge variant="outline">{proposal.stage}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${proposal.amount.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${probabilityColor}`}>
              {proposal.probability}% probability
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          {proposal.description}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{proposal.createdDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expires:</span>
              <span>{proposal.expiryDate}</span>
            </div>
            {proposal.lastViewed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last viewed:</span>
                <span>{proposal.lastViewed}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Assigned to:</span>
              <span>{proposal.assignedTo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span>{proposal.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Attachments:</span>
              <span>{proposal.attachments.length}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Win Probability</span>
            <span className={`font-medium ${probabilityColor}`}>{proposal.probability}%</span>
          </div>
          <Progress value={proposal.probability} className="h-2" />
        </div>
        
        {proposal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {proposal.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(proposal)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(proposal)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onSend(proposal)}>
            <Send className="h-3 w-3 mr-1" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function InvoiceCard({ invoice, onView, onEdit, onDelete, onSend, onMarkPaid }: { 
  invoice: Invoice
  onView: (invoice: Invoice) => void
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
  onSend: (invoice: Invoice) => void
  onMarkPaid: (invoice: Invoice) => void
}) {
  const isOverdue = invoice.status === 'overdue'
  const isPaid = invoice.status === 'paid'
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {invoice.client} • {invoice.clientEmail}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={invoiceStatusColors[invoice.status]}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
              {invoice.paymentMethod && (
                <Badge variant="outline">{invoice.paymentMethod}</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${isPaid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
              ${invoice.amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {invoice.currency}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          {invoice.description}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{invoice.createdDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {invoice.dueDate}
              </span>
            </div>
            {invoice.paidDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="text-green-600">{invoice.paidDate}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span>{invoice.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Terms:</span>
              <span>{invoice.paymentTerms}</span>
            </div>
            {invoice.proposalId && (
              <div className="flex justify-between">
                <span className="text-gray-600">From proposal:</span>
                <span className="text-blue-600">#{invoice.proposalId}</span>
              </div>
            )}
          </div>
        </div>
        
        {invoice.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {invoice.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(invoice)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(invoice)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onSend(invoice)}>
            <Send className="h-3 w-3 mr-1" />
            Send
          </Button>
          {!isPaid && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onMarkPaid(invoice)}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark Paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProposalsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('proposals')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')

  // Fetch data using hooks
  const { 
    proposals, 
    loading: proposalsLoading, 
    error: proposalsError,
    fetchProposals,
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal
  } = useProposals()
  
  const { stats: proposalStats, loading: proposalStatsLoading } = useProposalStats()
  
  const { 
    invoices, 
    loading: invoicesLoading, 
    error: invoicesError,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markInvoicePaid
  } = useInvoices()
  
  const { stats: invoiceStats, loading: invoiceStatsLoading } = useInvoiceStats()

  // Fetch data on component mount
  useEffect(() => {
    fetchProposals()
    fetchInvoices()
  }, [])

  // Filter proposals
  const filteredProposals = useMemo(() => {
    if (!proposals) return []
    return proposals.filter(proposal => {
      const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proposal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           proposal.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter
      const matchesClient = clientFilter === 'all' || proposal.client === clientFilter
      
      return matchesSearch && matchesStatus && matchesClient
    })
  }, [proposals, searchTerm, statusFilter, clientFilter])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    return invoices.filter(invoice => {
      const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      const matchesClient = clientFilter === 'all' || invoice.client === clientFilter
      
      return matchesSearch && matchesStatus && matchesClient
    })
  }, [invoices, searchTerm, statusFilter, clientFilter])

  // Handle proposal actions
  const handleViewProposal = (proposal: Proposal) => {
    console.log('View proposal:', proposal.id)
  }

  const handleEditProposal = (proposal: Proposal) => {
    console.log('Edit proposal:', proposal.id)
  }

  const handleDeleteProposal = async (proposal: Proposal) => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      await deleteProposal(proposal.id)
    }
  }

  const handleSendProposal = async (proposal: Proposal) => {
    await sendProposal(proposal.id)
  }

  // Handle invoice actions
  const handleViewInvoice = (invoice: Invoice) => {
    console.log('View invoice:', invoice.id)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    console.log('Edit invoice:', invoice.id)
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(invoice.id)
    }
  }

  const handleSendInvoice = async (invoice: Invoice) => {
    await sendInvoice(invoice.id)
  }

  const handleMarkInvoicePaid = async (invoice: Invoice) => {
    await markInvoicePaid(invoice.id)
  }

  const clients = [...new Set([...(proposals || []).map(p => p.client), ...(invoices || []).map(i => i.client)])]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proposals &amp; Invoicing</h1>
            <p className="text-gray-600 mt-1">
              Manage proposals, invoices, and billing
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">
            {/* Proposal Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {proposalStatsLoading ? '...' : proposalStats?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Proposals</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {proposalStatsLoading ? '...' : proposalStats?.sent || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {proposalStatsLoading ? '...' : proposalStats?.accepted || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Won</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {proposalStatsLoading ? '...' : proposalStats?.rejected || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Lost</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {proposalStatsLoading ? '...' : `$${(proposalStats?.totalValue || 0).toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">All proposals</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Won Value</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {proposalStatsLoading ? '...' : `$${(proposalStats?.wonValue || 0).toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">Accepted</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {proposalStatsLoading ? '...' : `$${(proposalStats?.pipelineValue || 0).toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {proposalStatsLoading ? '...' : `${proposalStats?.avgProbability || 0}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">Average</p>
                </CardContent>
              </Card>
            </div>

            {/* Proposal Filters */}
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
                        placeholder="Search proposals..."
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
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="viewed">Viewed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client} value={client}>{client}</SelectItem>
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

            {/* Proposals Grid */}
            {proposalsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : proposalsError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error loading proposals</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {proposalsError}
                  </p>
                  <Button onClick={() => fetchProposals()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredProposals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProposals.map((proposal) => (
                  <ProposalCard 
                    key={proposal.id} 
                    proposal={proposal}
                    onView={handleViewProposal}
                    onEdit={handleEditProposal}
                    onDelete={handleDeleteProposal}
                    onSend={handleSendProposal}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Create your first proposal to get started.'}
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Proposal
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            {/* Invoice Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {invoiceStatsLoading ? '...' : invoiceStats?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {invoiceStatsLoading ? '...' : invoiceStats?.sent || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {invoiceStatsLoading ? '...' : invoiceStats?.paid || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {invoiceStatsLoading ? '...' : invoiceStats?.overdue || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Late</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {invoiceStatsLoading ? '...' : `$${(invoiceStats?.totalValue || 0).toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">All invoices</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid Value</CardTitle>
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {invoiceStatsLoading ? '...' : `$${(invoiceStats?.paidValue || 0).toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">Received</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Value</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {invoiceStatsLoading ? '...' : `$${(invoiceStats?.overdueValue || 0).toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {invoiceStatsLoading ? '...' : `$${(invoiceStats?.pendingValue || 0).toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting</p>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Filters */}
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
                        placeholder="Search invoices..."
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
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client} value={client}>{client}</SelectItem>
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

            {/* Invoices Grid */}
            {invoicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : invoicesError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error loading invoices</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {invoicesError}
                  </p>
                  <Button onClick={() => fetchInvoices()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredInvoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice}
                    onView={handleViewInvoice}
                    onEdit={handleEditInvoice}
                    onDelete={handleDeleteInvoice}
                    onSend={handleSendInvoice}
                    onMarkPaid={handleMarkInvoicePaid}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Create your first invoice to get started.'}
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Empty States */}
        {activeTab === 'proposals' && filteredProposals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new proposal</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'invoices' && filteredInvoices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new invoice</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}