import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Users, FileText } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">ProjectFlow</div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
          <span className="text-balance">Enterprise Project Management for Modern Teams</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-balance">
          ProjectFlow is a powerful, scalable platform designed for teams to collaborate on projects,
          manage tasks, and track progress in real-time. Multi-tenant, role-based, and ready to scale.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Start Free <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-xl">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-80 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg font-semibold">Dashboard Preview</p>
              <p className="text-blue-100 mt-2">Coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="p-3 bg-blue-100 w-fit rounded-lg mb-4">
              <Users className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Tenant</h3>
            <p className="text-gray-600">
              Enterprise-grade multi-tenant architecture with complete data isolation and organization management.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="p-3 bg-blue-100 w-fit rounded-lg mb-4">
              <Zap className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Collaboration</h3>
            <p className="text-gray-600">
              Live updates, comments, and activity tracking keep your team synchronized and productive.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="p-3 bg-blue-100 w-fit rounded-lg mb-4">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Task Management</h3>
            <p className="text-gray-600">
              Organize projects into tasks, set priorities, track status, and collaborate with your team.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your workflow?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Join thousands of teams using ProjectFlow to manage their projects and collaborate effectively.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Get Started Free <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-gray-600">© 2026 ProjectFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
