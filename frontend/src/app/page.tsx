export default function HomePage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Task Hub 🗺️
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Complete tasks in your area and earn rewards!
      </p>
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🚀 Get Started
          </h2>
          <div className="space-y-4">
            <a
              href="/login"
              className="w-full flex justify-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Login
            </a>
            <a
              href="/register"
              className="w-full flex justify-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📱 How It Works
          </h2>
          <div className="space-y-3 text-left">
            <div className="flex items-start">
              <span className="text-2xl mr-3">1️⃣</span>
              <div>
                <h3 className="font-semibold text-gray-900">Login & Enable Location</h3>
                <p className="text-gray-600">Sign up and allow location access to see nearby tasks</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">2️⃣</span>
              <div>
                <h3 className="font-semibold text-gray-900">Find Tasks</h3>
                <p className="text-gray-600">Browse tasks available in your local area</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">3️⃣</span>
              <div>
                <h3 className="font-semibold text-gray-900">Complete & Upload</h3>
                <p className="text-gray-600">Finish tasks and upload photo/video evidence</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">4️⃣</span>
              <div>
                <h3 className="font-semibold text-gray-900">Get Validated</h3>
                <p className="text-gray-600">Admin reviews your submission and approves it</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">5️⃣</span>
              <div>
                <h3 className="font-semibold text-gray-900">Earn Points</h3>
                <p className="text-gray-600">Receive points and climb the leaderboard!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}