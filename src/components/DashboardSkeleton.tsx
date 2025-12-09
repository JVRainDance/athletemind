'use client'

import { Skeleton, SkeletonText } from './Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton variant="text" width="40%" height={32} className="mb-2" />
            <Skeleton variant="text" width="60%" height={20} />
          </div>
          <Skeleton variant="circular" width={64} height={64} />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="circular" width={40} height={40} />
            </div>
            <Skeleton variant="text" width="30%" height={32} />
          </div>
        ))}
      </div>

      {/* Next Session Card Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Skeleton variant="circular" width={48} height={48} className="mr-4" />
          <div className="flex-1">
            <Skeleton variant="text" width="40%" height={24} className="mb-2" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={44} />
        </div>
      </div>

      {/* Recent Sessions Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Skeleton variant="text" width="30%" height={24} className="mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton variant="text" width="50%" className="mb-2" />
                  <Skeleton variant="text" width="70%" />
                </div>
                <Skeleton variant="rectangular" width={80} height={32} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SessionsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Skeleton variant="text" width="40%" height={24} className="mb-2" />
              <Skeleton variant="text" width="60%" />
            </div>
            <Skeleton variant="rectangular" width={100} height={32} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {[1, 2, 3, 4].map((j) => (
              <div key={j}>
                <Skeleton variant="text" width="60%" className="mb-1" />
                <Skeleton variant="text" width="80%" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProgressChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="rectangular" width={120} height={36} />
      </div>
      <div className="space-y-4">
        <Skeleton variant="rectangular" height={300} />
        <div className="flex justify-center space-x-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="text" width={80} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ScheduleCalendarSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="30%" height={28} />
        <div className="flex space-x-2">
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </div>
      </div>

      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center">
            <Skeleton variant="text" width="100%" />
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={60} />
        ))}
      </div>
    </div>
  )
}

export function GoalsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Skeleton variant="text" width="60%" height={24} className="mb-2" />
              <Skeleton variant="text" width="80%" />
            </div>
            <Skeleton variant="rectangular" width={24} height={24} />
          </div>
          <div className="space-y-2">
            <Skeleton variant="rectangular" height={8} />
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="20%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
