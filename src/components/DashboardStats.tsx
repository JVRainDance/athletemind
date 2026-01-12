'use client'

import { Star, TrendingUp, CheckCircle, Calendar } from 'lucide-react'

interface DashboardStatsProps {
  totalStars: number
  currentStreak?: number
  completionRate?: number
  totalSessions?: number
}

export default function DashboardStats({
  totalStars,
  currentStreak = 0,
  completionRate = 0,
  totalSessions = 0
}: DashboardStatsProps) {
  const stats = [
    {
      name: 'Total Stars',
      value: totalStars,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      name: 'Current Streak',
      value: `${currentStreak} days`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      name: 'Completion Rate',
      value: `${completionRate}%`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Total Sessions',
      value: totalSessions,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.name}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} rounded-full p-2`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
