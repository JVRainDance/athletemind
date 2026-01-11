/**
 * useRewardClaiming Hook
 * Manages reward claiming state and logic
 */

'use client'

import { useState } from 'react'

interface Reward {
  id: string
  user_id: string
  reward_name: string
  reward_description: string | null
  stars_required: number
  created_at: string
}

export function useRewardClaiming() {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openClaimModal = (reward: Reward) => {
    setSelectedReward(reward)
    setIsModalOpen(true)
  }

  const closeClaimModal = () => {
    setIsModalOpen(false)
    // Clear selected reward after animation completes
    setTimeout(() => {
      setSelectedReward(null)
    }, 300)
  }

  return {
    selectedReward,
    isModalOpen,
    openClaimModal,
    closeClaimModal,
  }
}
