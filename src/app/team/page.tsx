'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTeam, useTeamStats, TeamMember, TeamStats } from '@/hooks/useTeam'
import { MainLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  BarChart3,
  CheckCircle,
  Calendar as CalendarIcon,
  AlertTriangle,
  Award,
  Clock,
  Target,
  Activity,
  Eye,
  MessageSquare,
  Video,
  Shield,
  Settings,
  Code,
  Palette,
  Bug,
  GraduationCap,
  Crown,
  User,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

// Mock data removed - using real API data

const roleColors = {
  'admin': 'bg-red-100 text-red-800',
  'manager': 'bg-purple-100 text-purple-800',
  'developer': 'bg-blue-100 text-blue-800',
  'designer': 'bg-green-100 text-green-800',
  'qa': 'bg-yellow-100 text-yellow-800',
  'intern': 'bg-gray-100 text-gray-800',
}

const roleLabels = {
  'admin': 'Admin',
  'manager': 'Manager',
  'developer': 'Developer',
  'designer': 'Designer',
  'qa': 'QA Engineer',
  'intern': 'Intern',
}

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'inactive': 'bg-gray-100 text-gray-800',
  'on-leave': 'bg-yellow-100 text-yellow-800',
  'busy': 'bg-orange-100 text-orange-800',
}

const statusLabels = {
  'active': 'Active',
  'inactive': 'Inactive',
  'on-leave': 'On Leave',
  'busy': 'Busy',
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'admin': return <Crown className="h-4 w-4 text-red-500" />
    case 'manager': return <Shield className="h-4 w-4 text-purple-500" />
    case 'developer': return <User className="h-4 w-4 text-blue-500" />
    case 'designer': return <User className="h-4 w-4 text-green-500" />
    case 'qa': return <User className="h-4 w-4 text-yellow-500" />
    case 'intern': return <User className="h-4 w-4 text-gray-500" />
    default: return <User className="h-4 w-4 text-gray-500" />
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

interface TeamMemberCardProps {
  member: TeamMember;
  onView: (member: TeamMember) => void;
  onMessage: (member: TeamMember) => void;
  onCall: (member: TeamMember) => void;
}

function TeamMemberCard({ member, onView, onMessage, onCall }: TeamMemberCardProps) {
  const performanceColor = member.performance >= 90 ? 'text-green-600' : 
                          member.performance >= 80 ? 'text-yellow-600' : 'text-red-600'
  
  const workloadColor = member.workload >= 90 ? 'text-red-600' : 
                       member.workload >= 75 ? 'text-yellow-600' : 'text-green-600'
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription className="text-sm">
                {member.position} • {member.department}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={roleColors[member.role]}>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(member.role)}
                    <span>{roleLabels[member.role]}</span>
                  </div>
                </Badge>
                <Badge className={statusColors[member.status]}>
                  {statusLabels[member.status]}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="h-3 w-3" />
              <span className="truncate">{member.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="h-3 w-3" />
              <span>{member.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-3 w-3" />
              <span>{member.location}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="h-3 w-3" />
              <span>Joined {member.joinDate}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Activity className="h-3 w-3" />
              <span>Last active: Today</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="h-3 w-3" />
              <span>{member.directReports} direct reports</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Performance</span>
              <span className={`font-medium ${performanceColor}`}>{member.performance}%</span>
            </div>
            <Progress value={member.performance} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Workload</span>
              <span className={`font-medium ${workloadColor}`}>{member.workload}%</span>
            </div>
            <Progress value={member.workload} className="h-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{member.tasksCompleted}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">{member.tasksInProgress}</div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{member.hoursLogged}h</div>
            <div className="text-xs text-gray-600">Logged</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">{member.projectsAssigned}</div>
            <div className="text-xs text-gray-600">Projects</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Skills</div>
          <div className="flex flex-wrap gap-1">
            {member.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {member.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{member.skills.length - 4}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Current Projects</div>
          <div className="space-y-1">
            {member.currentProjects.slice(0, 2).map((project) => (
              <div key={project} className="text-sm text-gray-600 truncate">
                • {project}
              </div>
            ))}
            {member.currentProjects.length > 2 && (
              <div className="text-sm text-gray-500">
                +{member.currentProjects.length - 2} more projects
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(member)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onMessage(member)}>
            <MessageSquare className="h-3 w-3 mr-1" />
            Message
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onCall(member)}>
            <Video className="h-3 w-3 mr-1" />
            Call
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TeamPage() {
  const { user } = useAuth()
  const { fetchTeamMembers, updateMemberStatus, deleteTeamMember, loading, error } = useTeam()
  const { fetchTeamStats, loading: statsLoading, error: statsError } = useTeamStats()
  
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch team members and stats on component mount and filter changes
  useEffect(() => {
    const loadData = async () => {
      try {
        const filters = {
          search: searchTerm || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          department: departmentFilter !== 'all' ? departmentFilter : undefined,
          page: currentPage,
          limit: 12
        }
        
        const [membersData, statsData] = await Promise.all([
          fetchTeamMembers(filters),
          fetchTeamStats()
        ])
        
        setMembers(membersData.members)
        setTotalPages(Math.ceil(membersData.total / 12))
        setStats(statsData)
      } catch (err) {
        console.error('Failed to load team data:', err)
      }
    }

    loadData()
  }, [searchTerm, roleFilter, statusFilter, departmentFilter, currentPage])

  // Handle member actions
  const handleViewMember = (member: TeamMember) => {
    // TODO: Navigate to member detail page
    console.log('View member:', member.id)
  }

  const handleMessageMember = (member: TeamMember) => {
    // TODO: Open messaging interface
    console.log('Message member:', member.id)
  }

  const handleCallMember = (member: TeamMember) => {
    // TODO: Initiate call
    console.log('Call member:', member.id)
  }

  const handleUpdateStatus = async (memberId: string, status: TeamMember['status']) => {
    try {
      await updateMemberStatus(memberId, status)
      // Refresh data
      const filters = {
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        page: currentPage,
        limit: 12
      }
      const membersData = await fetchTeamMembers(filters)
      setMembers(membersData.members)
    } catch (err) {
      console.error('Failed to update member status:', err)
    }
  }

  const departments = useMemo(() => {
    return [...new Set(members.map(m => m.department))]
  }, [members])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-1">
              Manage team members, roles, and performance
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Team members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Working</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-yellow-600">{stats?.onLeave || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Away</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Busy</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-orange-600">{stats?.busy || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Occupied</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">{stats?.avgPerformance || 0}%</div>
              )}
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-purple-600">{stats?.totalHours || 0}h</div>
              )}
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-indigo-600">{stats?.totalTasks || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Total active</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workload</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-teal-600">{stats?.avgWorkload || 0}%</div>
              )}
              <p className="text-xs text-muted-foreground">Average</p>
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
                    placeholder="Search members..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="qa">QA Engineer</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>{department}</SelectItem>
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

        {/* Loading and Error States */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-3 bg-gray-200 rounded w-32" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading team members</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Team Members Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <TeamMemberCard 
                key={member.id} 
                member={member}
                onView={handleViewMember}
                onMessage={handleMessageMember}
                onCall={handleCallMember}
              />
            ))}
          </div>
        )}

        {!loading && !error && members.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add a new team member</p>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}