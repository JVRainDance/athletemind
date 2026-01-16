/**
 * Athletes List Page Skeleton Loader
 * Loading state for coach athletes list page
 */

import { Skeleton } from '@/components/ui/skeleton'

export function AthletesListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>

      {/* Code Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-72 mb-4" />
        <Skeleton className="h-12 w-32" />
      </div>

      {/* Add by Code */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-64 mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-24" />
        </div>
      </div>

      {/* Athletes Grid */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex space-x-2 ml-3">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
