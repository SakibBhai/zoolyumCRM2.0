import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/auth-provider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgencyCRM - Complete Business Management Solution',
  description: 'Comprehensive CRM system for agencies with lead management, project tracking, team collaboration, and financial reporting.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider session={session}>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}