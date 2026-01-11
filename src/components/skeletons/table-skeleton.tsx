/**
 * Table Skeleton Loader
 * Loading state for data tables
 */

import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      <div className="rounded-md border">
        <div className="w-full">
          {/* Table Header */}
          {showHeader && (
            <div className="border-b bg-gray-50">
              <div className="flex items-center gap-4 p-4">
                {Array.from({ length: columns }).map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
            </div>
          )}

          {/* Table Rows */}
          <div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center gap-4 border-b p-4 last:border-0"
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    className="h-4 flex-1"
                    style={{
                      width: colIndex === 0 ? '30%' : undefined,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}
