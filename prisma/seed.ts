import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@agencycrm.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      role: 'ADMIN',
      department: 'Management',
      phone: '+1-555-0001',
      isActive: true,
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@agencycrm.com',
      passwordHash: await bcrypt.hash('manager123', 10),
      name: 'Project Manager',
      role: 'MANAGER',
      department: 'Project Management',
      phone: '+1-555-0002',
      isActive: true,
    },
  })

  const memberUser = await prisma.user.create({
    data: {
      email: 'member@agencycrm.com',
      passwordHash: await bcrypt.hash('member123', 10),
      name: 'Team Member',
      role: 'MEMBER',
      department: 'Development',
      phone: '+1-555-0003',
      isActive: true,
    },
  })

  console.log('✅ Users created')

  // Create leads
  const lead1 = await prisma.lead.create({
    data: {
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      company: 'TechCorp Solutions',
      phone: '+1-555-1001',
      source: 'WEBSITE',
      score: 'WARM',
      status: 'NEW',
      assignedTo: memberUser.id,
      notes: 'Interested in web development services',
    },
  })

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Sarah Johnson',
      email: 'sarah@innovatetech.com',
      company: 'InnovateTech',
      phone: '+1-555-1002',
      source: 'REFERRAL',
      score: 'HOT',
      status: 'CONTACTED',
      assignedTo: memberUser.id,
      notes: 'Needs mobile app development',
    },
  })

  console.log('✅ Leads created')

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Michael Brown',
      email: 'michael@digitalagency.com',
      company: 'Digital Agency Pro',
      industry: 'Marketing',
      phone: '+1-555-2001',
      address: '123 Business St, New York, NY 10001',
      website: 'https://digitalagencypro.com',
      healthScore: 8,
      accountManagerId: managerUser.id,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Emily Davis',
      email: 'emily@startupventure.com',
      company: 'Startup Venture',
      industry: 'Technology',
      phone: '+1-555-2002',
      address: '456 Innovation Ave, San Francisco, CA 94105',
      website: 'https://startupventure.com',
      healthScore: 9,
      accountManagerId: managerUser.id,
    },
  })

  console.log('✅ Clients created')

  // Create client contacts
  await prisma.clientContact.create({
    data: {
      clientId: client1.id,
      name: 'Michael Brown',
      email: 'michael@digitalagency.com',
      phone: '+1-555-2001',
      position: 'CEO',
      isPrimary: true,
    },
  })

  await prisma.clientContact.create({
    data: {
      clientId: client2.id,
      name: 'Emily Davis',
      email: 'emily@startupventure.com',
      phone: '+1-555-2002',
      position: 'Founder',
      isPrimary: true,
    },
  })

  console.log('✅ Client contacts created')

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of company website with modern UI/UX',
      clientId: client1.id,
      managerId: managerUser.id,
      budget: 15000,
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      completionPercentage: 45,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Native iOS and Android app for customer engagement',
      clientId: client2.id,
      managerId: managerUser.id,
      budget: 25000,
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-06-01'),
      completionPercentage: 15,
    },
  })

  console.log('✅ Projects created')

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Homepage Mockup',
      description: 'Create wireframes and mockups for the new homepage design',
      projectId: project1.id,
      assigneeId: memberUser.id,
      createdBy: managerUser.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2024-02-01'),
      estimatedHours: 16,
      actualHours: 8,
      completionPercentage: 50,
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Setup Development Environment',
      description: 'Configure development environment for mobile app project',
      projectId: project2.id,
      assigneeId: memberUser.id,
      createdBy: managerUser.id,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2024-02-15'),
      estimatedHours: 8,
      actualHours: 0,
      completionPercentage: 0,
    },
  })

  console.log('✅ Tasks created')

  // Create task comments
  await prisma.taskComment.create({
    data: {
      taskId: task1.id,
      userId: memberUser.id,
      content: 'Started working on the initial wireframes. Will have first draft ready by tomorrow.',
    },
  })

  // Create time entries
  await prisma.timeEntry.create({
    data: {
      taskId: task1.id,
      userId: memberUser.id,
      hours: 4,
      description: 'Initial research and wireframe sketching',
      date: new Date('2024-01-20'),
    },
  })

  await prisma.timeEntry.create({
    data: {
      taskId: task1.id,
      userId: memberUser.id,
      hours: 4,
      description: 'Created detailed mockups in Figma',
      date: new Date('2024-01-21'),
    },
  })

  console.log('✅ Task comments and time entries created')

  // Create proposals
  const proposal1 = await prisma.proposal.create({
    data: {
      clientId: client1.id,
      projectId: project1.id,
      title: 'Website Redesign Proposal',
      content: 'Comprehensive website redesign including modern UI/UX, responsive design, and SEO optimization.',
      totalAmount: 15000,
      status: 'ACCEPTED',
      validUntil: new Date('2024-02-15'),
      createdBy: managerUser.id,
    },
  })

  const proposal2 = await prisma.proposal.create({
    data: {
      clientId: client2.id,
      projectId: project2.id,
      title: 'Mobile App Development Proposal',
      content: 'Native mobile application development for iOS and Android platforms with backend API integration.',
      totalAmount: 25000,
      status: 'SENT',
      validUntil: new Date('2024-03-01'),
      createdBy: managerUser.id,
    },
  })

  console.log('✅ Proposals created')

  // Create invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-001',
      clientId: client1.id,
      projectId: project1.id,
      proposalId: proposal1.id,
      amount: 15000,
      taxAmount: 1200,
      totalAmount: 16200,
      status: 'SENT',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      notes: 'Payment terms: Net 30 days',
      createdBy: managerUser.id,
    },
  })

  console.log('✅ Invoices created')

  // Create invoice items
  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice1.id,
      description: 'Website Redesign - Phase 1',
      quantity: 1,
      unitPrice: 7500,
      totalPrice: 7500,
    },
  })

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice1.id,
      description: 'Website Redesign - Phase 2',
      quantity: 1,
      unitPrice: 7500,
      totalPrice: 7500,
    },
  })

  console.log('✅ Invoice items created')

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: managerUser.id,
      title: 'New Lead Assigned',
      message: 'A new lead "John Smith" has been assigned to you.',
      type: 'INFO',
      isRead: false,
      actionUrl: '/leads',
    },
  })

  await prisma.notification.create({
    data: {
      userId: memberUser.id,
      title: 'Task Due Soon',
      message: 'Task "Design Homepage Mockup" is due in 2 days.',
      type: 'WARNING',
      isRead: false,
      actionUrl: '/tasks',
    },
  })

  console.log('✅ Notifications created')

  // Create lead interactions
  await prisma.leadInteraction.create({
    data: {
      leadId: lead1.id,
      userId: memberUser.id,
      interactionType: 'EMAIL',
      subject: 'Welcome to AgencyCRM',
      content: 'Thank you for your interest in our services. We will be in touch soon.',
      completedAt: new Date('2024-01-18'),
    },
  })

  await prisma.leadInteraction.create({
    data: {
      leadId: lead2.id,
      userId: memberUser.id,
      interactionType: 'CALL',
      subject: 'Initial Discovery Call',
      content: 'Discussed project requirements and timeline. Very interested in proceeding.',
      completedAt: new Date('2024-01-19'),
    },
  })

  console.log('✅ Lead interactions created')

  // Create project resources
  await prisma.projectResource.create({
    data: {
      projectId: project1.id,
      name: 'Brand Guidelines',
      type: 'DOCUMENT',
      url: 'https://example.com/brand-guidelines.pdf',
      description: 'Official brand guidelines and style guide',
      createdBy: managerUser.id,
    },
  })

  await prisma.projectResource.create({
    data: {
      projectId: project2.id,
      name: 'API Documentation',
      type: 'LINK',
      url: 'https://api-docs.example.com',
      description: 'Backend API documentation and endpoints',
      createdBy: managerUser.id,
    },
  })

  console.log('✅ Project resources created')

  // Create system settings
  await prisma.systemSetting.create({
    data: {
      key: 'company_name',
      value: 'AgencyCRM',
      description: 'Company name displayed in the application',
    },
  })

  await prisma.systemSetting.create({
    data: {
      key: 'default_tax_rate',
      value: '8.0',
      description: 'Default tax rate percentage for invoices',
    },
  })

  console.log('✅ System settings created')

  console.log('🎉 Database seeding completed successfully!')
  console.log(`
📊 Summary:
- 3 Users created (Admin, Manager, Member)
- 2 Leads created
- 2 Clients created with contacts
- 2 Projects created
- 2 Tasks created with comments and time entries
- 2 Proposals created
- 1 Invoice created with items
- 2 Notifications created
- 2 Lead interactions created
- 2 Project resources created
- 2 System settings created
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })