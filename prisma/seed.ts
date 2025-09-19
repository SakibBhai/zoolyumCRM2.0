import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.timeEntry.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.client.deleteMany({})
  await prisma.lead.deleteMany({})

  // Hash the demo password
  const hashedPassword = await bcrypt.hash('demo123', 12)

  // Create demo users
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@agency.com' },
    update: {},
    create: {
      email: 'demo@agency.com',
      name: 'Demo User',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@agency.com' },
    update: {},
    create: {
      email: 'sales@agency.com',
      name: 'Sales Manager',
      password: hashedPassword,
      role: 'AGENT',
      isActive: true,
    },
  })

  // Create demo leads
  const leads = [
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-0123',
      company: 'TechCorp Solutions',
      status: 'NEW',
      source: 'WEBSITE',
      value: 15000,
      notes: 'Interested in digital marketing services',
      assignedId: demoUser.id,
      createdById: demoUser.id,
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@innovate.com',
      phone: '+1-555-0456',
      company: 'Innovate Inc',
      status: 'CONTACTED',
      source: 'REFERRAL',
      value: 25000,
      notes: 'Looking for complete brand redesign',
      assignedId: salesUser.id,
      createdById: demoUser.id,
    },
    {
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@startup.io',
      phone: '+1-555-0789',
      company: 'Startup.io',
      status: 'QUALIFIED',
      source: 'SOCIAL_MEDIA',
      value: 8000,
      notes: 'Small startup needing basic web presence',
      assignedId: demoUser.id,
      createdById: demoUser.id,
    },
  ]

  for (const leadData of leads) {
    await prisma.lead.create({
      data: leadData,
    })
  }

  // Create demo clients
  const clients = [
    {
      name: 'Global Enterprises',
      email: 'contact@global-ent.com',
      phone: '+1-555-1000',
      company: 'Global Enterprises Ltd',
      status: 'ACTIVE',
      assignedId: demoUser.id,
    },
    {
      name: 'Creative Studios',
      email: 'hello@creativestudios.com',
      phone: '+1-555-2000',
      company: 'Creative Studios',
      status: 'ACTIVE',
      assignedId: salesUser.id,
    },
  ]

  for (const clientData of clients) {
    await prisma.client.create({
      data: clientData,
    })
  }

  // Get created clients for projects
  const globalClient = await prisma.client.findUnique({ where: { email: 'contact@global-ent.com' } })
  const creativeClient = await prisma.client.findUnique({ where: { email: 'hello@creativestudios.com' } })

  // Create demo projects
  if (globalClient && creativeClient) {
    const projects = [
      {
        name: 'Website Redesign',
        description: 'Complete website redesign and development',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        budget: 25000,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-04-20'),
        clientId: globalClient.id,
        managerId: demoUser.id,
      },
      {
        name: 'Brand Identity',
        description: 'Logo design and brand guidelines',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        budget: 15000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-03-15'),
        clientId: creativeClient.id,
        managerId: salesUser.id,
      },
      {
        name: 'Marketing Campaign',
        description: 'Digital marketing campaign setup',
        status: 'PLANNING',
        priority: 'MEDIUM',
        budget: 20000,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-01'),
        clientId: globalClient.id,
        managerId: demoUser.id,
      },
    ]

    for (const projectData of projects) {
      await prisma.project.create({
        data: projectData,
      })
    }

    // Get created projects for tasks
    const websiteProject = await prisma.project.findFirst({ 
      where: { name: 'Website Redesign', clientId: globalClient.id } 
    })
    const brandProject = await prisma.project.findFirst({ 
      where: { name: 'Brand Identity', clientId: creativeClient.id } 
    })

    // Create demo tasks
    if (websiteProject && brandProject) {
      const tasks = [
        {
          title: 'Design Homepage Mockup',
          description: 'Create initial homepage design concepts',
          status: 'COMPLETED',
          priority: 'HIGH',
          dueDate: new Date('2024-02-01'),
          projectId: websiteProject.id,
          assignedId: demoUser.id,
          createdById: demoUser.id,
        },
        {
          title: 'Develop Frontend Components',
          description: 'Build reusable React components',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: new Date('2024-03-15'),
          projectId: websiteProject.id,
          assignedId: demoUser.id,
          createdById: demoUser.id,
        },
        {
          title: 'Logo Design Concepts',
          description: 'Create 3 logo design variations',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          dueDate: new Date('2024-02-15'),
          projectId: brandProject.id,
          assignedId: salesUser.id,
          createdById: demoUser.id,
        },
        {
          title: 'Brand Guidelines Document',
          description: 'Create comprehensive brand guidelines',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          dueDate: new Date('2024-03-01'),
          projectId: brandProject.id,
          assignedId: salesUser.id,
          createdById: demoUser.id,
        }
      ]

      for (const taskData of tasks) {
        await prisma.task.create({
          data: taskData,
        })
      }
    }

    // Create demo time entries
    if (websiteProject) {
      const timeEntries = [
        {
          description: 'Homepage design work',
          hours: 8,
          date: new Date('2024-01-25'),
          userId: demoUser.id,
        },
        {
          description: 'Component development',
          hours: 6,
          date: new Date('2024-02-10'),
          userId: demoUser.id,
        },
      ]

      for (const entryData of timeEntries) {
        await prisma.timeEntry.create({
          data: entryData,
        })
      }
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log('Demo credentials:')
  console.log('Email: demo@agency.com')
  console.log('Password: demo123')
  console.log('')
  console.log('Sales user:')
  console.log('Email: sales@agency.com')
  console.log('Password: demo123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })