export default function ProfilePage() {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    points: 1500,
    joined: 'January 2024',
    completedTasks: 25,
    level: 5,
    avatar: null
  }

  const achievements = [
    {
      id: 1,
      title: 'First Task',
      description: 'Completed your first task',
      icon: '🎯',
      earned: 'January 15, 2024',
      points: 10
    },
    {
      id: 2,
      title: 'Task Master',
      description: 'Completed 10 tasks',
      icon: '🏆',
      earned: 'January 28, 2024',
      points: 50
    },
    {
      id: 3,
      title: 'Eco Warrior',
      description: 'Completed 5 environment tasks',
      icon: '🌱',
      earned: 'February 10, 2024',
      points: 100
    },
    {
      id: 4,
      title: '7-Day Streak',
      description: 'Completed tasks for 7 consecutive days',
      icon: '🔥',
      earned: 'February 17, 2024',
      points: 25
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Info Card */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.split(' ').map(n => n[0]).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                <p className="text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">Member since {user.joined}</p>
              </div>
              <button className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-indigo-600">{user.points}</div>
            <div className="text-sm text-gray-500">Total Points</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-green-600">{user.completedTasks}</div>
            <div className="text-sm text-gray-500">Tasks Completed</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-purple-600">Level {user.level}</div>
            <div className="text-sm text-gray-500">Current Level</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">🏆 Achievements</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div>
                      <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">Earned {achievement.earned}</span>
                        <span className="text-sm font-bold text-green-600">+{achievement.points} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}