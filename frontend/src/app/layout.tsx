import './globals.css'

export const metadata = {
  title: 'Task Hub - Complete Tasks, Earn Points',
  description: 'Location-based task management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-lg border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-indigo-600">🗺️ TaskHub</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Login
                  </a>
                  <a href="/register" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                    Sign Up
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}