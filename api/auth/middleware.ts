import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// User schema
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'manager', 'user', 'client']),
  permissions: z.array(z.string()),
  department: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
  lastLogin: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

type User = z.infer<typeof userSchema>

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

// Mock users database
const users: User[] = [
  {
    id: 'user-001',
    email: 'sarah.johnson@agency.com',
    name: 'Sarah Johnson',
    role: 'admin',
    permissions: [
      'leads:read', 'leads:write', 'leads:delete',
      'clients:read', 'clients:write', 'clients:delete',
      'projects:read', 'projects:write', 'projects:delete',
      'tasks:read', 'tasks:write', 'tasks:delete',
      'team:read', 'team:write', 'team:delete',
      'proposals:read', 'proposals:write', 'proposals:delete',
      'finance:read', 'finance:write', 'finance:delete',
      'reports:read', 'reports:write', 'reports:delete',
      'admin:read', 'admin:write'
    ],
    department: 'Management',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    lastLogin: '2024-02-05T14:30:00Z',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-02-05T14:30:00Z'
  },
  {
    id: 'user-002',
    email: 'mike.wilson@agency.com',
    name: 'Mike Wilson',
    role: 'manager',
    permissions: [
      'leads:read', 'leads:write',
      'clients:read', 'clients:write',
      'projects:read', 'projects:write',
      'tasks:read', 'tasks:write',
      'team:read',
      'proposals:read', 'proposals:write',
      'finance:read',
      'reports:read', 'reports:write'
    ],
    department: 'Sales',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    lastLogin: '2024-02-05T11:15:00Z',
    createdAt: '2023-03-20T09:00:00Z',
    updatedAt: '2024-02-05T11:15:00Z'
  },
  {
    id: 'user-003',
    email: 'lisa.chen@agency.com',
    name: 'Lisa Chen',
    role: 'user',
    permissions: [
      'leads:read', 'leads:write',
      'clients:read',
      'projects:read', 'projects:write',
      'tasks:read', 'tasks:write',
      'proposals:read',
      'reports:read'
    ],
    department: 'Development',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    lastLogin: '2024-02-05T16:20:00Z',
    createdAt: '2023-05-10T14:00:00Z',
    updatedAt: '2024-02-05T16:20:00Z'
  },
  {
    id: 'user-004',
    email: 'david.kim@agency.com',
    name: 'David Kim',
    role: 'user',
    permissions: [
      'projects:read', 'projects:write',
      'tasks:read', 'tasks:write',
      'reports:read'
    ],
    department: 'Design',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    lastLogin: '2024-02-05T13:45:00Z',
    createdAt: '2023-07-22T11:30:00Z',
    updatedAt: '2024-02-05T13:45:00Z'
  },
  {
    id: 'user-005',
    email: 'client@techcorp.com',
    name: 'John Smith',
    role: 'client',
    permissions: [
      'projects:read',
      'tasks:read',
      'proposals:read',
      'reports:read'
    ],
    department: 'External',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    isActive: true,
    lastLogin: '2024-02-04T10:20:00Z',
    createdAt: '2023-09-05T16:00:00Z',
    updatedAt: '2024-02-04T10:20:00Z'
  }
]

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' })
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      const user = users.find(u => u.id === decoded.userId && u.isActive)
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' })
      }
      
      req.user = user
      next()
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// Authorization middleware factory
export const authorize = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }
      
      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      
      next()
    } catch (error) {
      res.status(500).json({ error: 'Authorization failed' })
    }
  }
}

// Role-based authorization middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient role permissions' })
      }
      
      next()
    } catch (error) {
      res.status(500).json({ error: 'Authorization failed' })
    }
  }
}

// Optional authentication middleware (for public endpoints that can benefit from user context)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // Continue without user context
    }
    
    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      const user = users.find(u => u.id === decoded.userId && u.isActive)
      
      if (user) {
        req.user = user
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }
    
    next()
  } catch (error) {
    next() // Continue without user context on any error
  }
}

// Login endpoint
export const login = (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    // In a real application, you would verify the password hash
    // For demo purposes, we'll accept any password for existing users
    const user = users.find(u => u.email === email && u.isActive)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Update last login
    const userIndex = users.findIndex(u => u.id === user.id)
    users[userIndex].lastLogin = new Date().toISOString()
    users[userIndex].updatedAt = new Date().toISOString()
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    // Return user data without sensitive information
    const { ...userResponse } = user
    
    res.json({
      user: userResponse,
      token,
      expiresIn: JWT_EXPIRES_IN
    })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
}

// Get current user profile
export const getProfile = (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    res.json(req.user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

// Update user profile
export const updateProfile = (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const { name, avatar, department } = req.body
    const userIndex = users.findIndex(u => u.id === req.user!.id)
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Update allowed fields
    if (name) users[userIndex].name = name
    if (avatar) users[userIndex].avatar = avatar
    if (department && (req.user.role === 'admin' || req.user.role === 'manager')) {
      users[userIndex].department = department
    }
    
    users[userIndex].updatedAt = new Date().toISOString()
    
    res.json(users[userIndex])
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

// Logout endpoint (for token blacklisting in production)
export const logout = (req: Request, res: Response) => {
  try {
    // In a real application, you would add the token to a blacklist
    // For now, we'll just return a success message
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' })
  }
}

// Refresh token endpoint
export const refreshToken = (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    // Generate new JWT token
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email, role: req.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    res.json({
      token,
      expiresIn: JWT_EXPIRES_IN
    })
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' })
  }
}

// Get all users (admin only)
export const getUsers = (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      role,
      department,
      isActive,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query

    let filteredUsers = [...users]

    // Apply filters
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }
    if (department) {
      filteredUsers = filteredUsers.filter(user => user.department === department)
    }
    if (isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === (isActive === 'true'))
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a]
      const bValue = b[sortBy as keyof typeof b]
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    res.json({
      users: paginatedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limitNum)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

// Create new user (admin only)
export const createUser = (req: Request, res: Response) => {
  try {
    const validatedData = userSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body)
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === validatedData.email)
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    users.push(newUser)
    res.status(201).json(newUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create user' })
  }
}

// Update user (admin only)
export const updateUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIndex = users.findIndex(u => u.id === id)
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const validatedData = userSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial().parse(req.body)
    
    users[userIndex] = {
      ...users[userIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    res.json(users[userIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to update user' })
  }
}

// Delete user (admin only)
export const deleteUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userIndex = users.findIndex(u => u.id === id)
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Prevent self-deletion
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }
    
    users.splice(userIndex, 1)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

// Export users for other modules
export { users }