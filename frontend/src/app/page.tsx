import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">🗺️ TaskHub</h1>
          <p className="text-xl text-gray-600 mb-8">Complete tasks. Earn points. Make a difference.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">🎯 Simple Workflow</h2>
              <ol className="text-left space-y-3 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold mr-3">1️⃣</span>
                  <span>Login & Enable Location</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">2️⃣</span>
                  <span>Find Local Tasks</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">3️⃣</span>
                  <span>Complete Task</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">4️⃣</span>
                  <span>Upload Evidence</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">5️⃣</span>
                  <span>Admin Validation</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3">6️⃣</span>
                  <span>Earn Points!</span>
                </li>
              </ol>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                  Get Started
                </Link>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-indigo-600 mb-4">📱 Key Features</h2>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🎯</span>
                  <span>Location-based task discovery with GPS integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">📱</span>
                  <span>Mobile-first design optimized for on-the-go usage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">📸</span>
                  <span>Photo/video evidence upload with validation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🏆</span>
                  <span>Admin dashboard for task validation and analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🏅</span>
                  <span>Points, achievements, and leaderboards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
    </div>
  )
}