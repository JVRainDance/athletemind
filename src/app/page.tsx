import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary-900 mb-4">
            AthleteMind
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Show up. Reflect. Build momentum.
          </p>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="inline-block bg-secondary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary-700 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}










