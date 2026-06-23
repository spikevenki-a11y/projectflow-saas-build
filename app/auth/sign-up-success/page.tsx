'use client'

import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-600" size={64} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
            <p className="text-gray-600 mt-2">We&apos;ve sent a confirmation link to your email address.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3">
            <Mail className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Please confirm your email</p>
              <p className="mt-1">Click the link in the email to complete your signup process.</p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>

          <p className="text-center text-gray-600 text-sm mt-6">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
        </div>
      </div>
    </div>
  )
}
