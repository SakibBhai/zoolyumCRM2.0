import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  Users,
  FolderOpen,
  CheckSquare,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Lead & Client Management',
    description: 'Track leads through your sales pipeline and manage client relationships effectively.'
  },
  {
    icon: FolderOpen,
    title: 'Project Management',
    description: 'Organize projects with Kanban boards, timelines, and resource allocation.'
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Assign tasks, track progress, and collaborate with your team seamlessly.'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Get insights into your business performance with comprehensive reporting.'
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Secure your data with granular permissions and role-based access control.'
  },
  {
    icon: Zap,
    title: 'Automated Workflows',
    description: 'Streamline your processes with intelligent automation and notifications.'
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">AgencyCRM</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Complete Business
              <span className="text-blue-600"> Management Solution</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your agency operations with our comprehensive CRM system.
              Manage leads, projects, teams, and finances all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run your agency
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for agencies and service businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of agencies already using AgencyCRM to streamline their operations.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">AgencyCRM</h3>
            <p className="text-gray-400">
              Complete Business Management Solution for Modern Agencies
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                © 2024 AgencyCRM. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}