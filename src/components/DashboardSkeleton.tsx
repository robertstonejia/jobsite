'use client'

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-36 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Quick actions skeleton */}
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Tab navigation skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b p-4">
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
                      <div className="flex gap-2 mb-3">
                        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-6">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
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
