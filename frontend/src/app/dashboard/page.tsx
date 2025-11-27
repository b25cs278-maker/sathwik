'use client'

import Link from 'next/link'

export default function DashboardPage() {
  // Mock user data
  const user = {
    name: 'John Doe',
    points: 150,
    completedTasks: 12,
    avatar: null
  }

  // Mock tasks data
  const tasks = [
    {
      id: 1,
      title: 'Plant a Tree in Central Park',
      points: 50,
      category: 'Environment',
      distance: '0.8 km away',
      status: 'available'
    },
    {
      id: 2,
      title: 'Clean Community Garden',
      points: 30,
      category: 'Community',
      distance: '1.2 km away',
      status: 'available'
    },
    {
      id: 3,
      title: 'Take Photos of Local Landmark',
      points: 40,
      category: 'Photography',
      distance: '2.1 km away',
      status: 'available'
    },
    {
      id: 4,
      title: 'Help at Food Bank',
      points: 75,
      category: 'Volunteer',
      distance: '3.5 km away',
      status: 'available'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Stats Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name.split(' ').map(n => n[0]).toUpperCase()}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-lg font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.points} points earned</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 gap-4 p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.points}</div>
                <div className="text-sm text-gray-500">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.completedTasks}</div>
                <div className="text-sm text-gray-500">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">🎯</div>
                <div className="text-sm text-gray-500">Current Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Available Tasks Near You</h2>
          </div>
          <div className="space-y-4 p-6">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                    <div className="mt-1 flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{task.category}</span>
                      <span className="text-sm text-gray-500">{task.distance}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold text-indigo-600">{task.points}</span>
                    <span className="text-sm text-gray-500">points</span>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="mt-2 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Start Task
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}