'use client'

import { useParams, useRouter } from 'next/navigation'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id

  // Mock task data
  const task = {
    id: taskId,
    title: 'Plant a Tree in Central Park',
    description: 'Help make our city greener by planting a tree in Central Park. You\'ll need to take photos of the location before and after planting, and include GPS coordinates.',
    points: 50,
    category: 'Environment',
    location: 'Central Park, Main Entrance',
    requirements: ['Photo of location', 'Photo of tree planted', 'GPS coordinates'],
    difficulty: 'Easy',
    estimatedTime: '30 minutes',
    deadline: '2 days remaining'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Task "${task.title}" submitted! (Demo Mode)`)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Task Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  {task.category}
                </span>
                <span className="text-lg font-bold text-indigo-600">{task.points} pts</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            <p className="text-gray-700">{task.description}</p>
          </div>
        </div>

        {/* Task Requirements */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">📋 Task Requirements</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {task.requirements.map((requirement, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-700">{requirement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Details */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">ℹ️ Task Details</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">📍</div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-medium text-gray-900">{task.location}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">⏱️</div>
                <div className="text-sm text-gray-500">Est. Time</div>
                <div className="font-medium text-gray-900">{task.estimatedTime}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">⚡</div>
                <div className="text-sm text-gray-500">Difficulty</div>
                <div className="font-medium text-gray-900">{task.difficulty}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">⏰</div>
                <div className="text-sm text-gray-500">Deadline</div>
                <div className="font-medium text-orange-600">{task.deadline}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Task Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">📸 Submit Task Evidence</h2>
          </div>
          <form className="px-6 py-4 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                Upload Photos/Videos
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <div className="text-6xl text-gray-400 mb-2">📷</div>
                  <div className="text-sm text-gray-600">
                    <p>Click to upload photos</p>
                    <p>Max file size: 10MB</p>
                    <p>Supported: JPG, PNG, MP4</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Add any notes about your completion..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}