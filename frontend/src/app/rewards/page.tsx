export default function RewardsPage() {
  const rewards = [
    {
      id: 1,
      title: 'Coffee Shop Voucher',
      points: 500,
      description: '$5 coffee voucher at local coffee shop',
      icon: '☕',
      available: true
    },
    {
      id: 2,
      title: 'Movie Ticket',
      points: 800,
      description: 'Free movie ticket at local cinema',
      icon: '🎬',
      available: true
    },
    {
      id: 3,
      title: 'Restaurant Discount',
      points: 1200,
      description: '20% off at partner restaurants',
      icon: '🍽️',
      available: true
    },
    {
      id: 4,
      title: 'Gym Day Pass',
      points: 2000,
      description: 'One day pass at local fitness center',
      icon: '🏋️',
      available: true
    },
    {
      id: 5,
      title: 'Gift Card $25',
      points: 2500,
      description: '$25 gift card for popular retailers',
      icon: '🎁',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎁 Rewards</h1>
          <p className="mt-2 text-lg text-gray-600">Redeem your points for exciting rewards!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{reward.icon}</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{reward.title}</h3>
                      <p className="text-sm text-gray-500">{reward.description}</p>
                    </div>
                  </div>
                  {reward.available ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Available
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{reward.points}</div>
                    <div className="text-sm text-gray-500">points needed</div>
                  </div>
                  {reward.available ? (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Redeem
                    </button>
                  ) : (
                    <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Points Summary */}
        <div className="mt-12 bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Points Balance</h2>
          <div className="text-5xl font-bold text-indigo-600">1,500</div>
          <p className="mt-2 text-gray-600">Complete more tasks to earn points!</p>
        </div>
      </div>
    </div>
  )
}