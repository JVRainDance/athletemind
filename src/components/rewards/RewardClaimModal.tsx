/**
 * Reward Claim Modal
 * Modal for claiming rewards with confetti celebration
 */

'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { Gift, Star, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase-client'

interface Reward {
  id: string
  user_id: string
  reward_name: string
  reward_description: string | null
  stars_required: number
  created_at: string
}

interface RewardClaimModalProps {
  reward: Reward
  currentStars: number
  isOpen: boolean
  onClose: () => void
  onClaimed: () => void
}

export function RewardClaimModal({
  reward,
  currentStars,
  isOpen,
  onClose,
  onClaimed,
}: RewardClaimModalProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const supabase = createClient()

  const canClaim = currentStars >= reward.stars_required

  const handleClaim = async () => {
    if (!canClaim) {
      toast.error('Not enough stars', {
        description: `You need ${reward.stars_required - currentStars} more stars`,
      })
      return
    }

    setIsClaiming(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create reward claim record
      const { error: claimError } = await supabase.from('reward_claims').insert({
        user_id: user.id,
        reward_id: reward.id,
        stars_spent: reward.stars_required,
      })

      if (claimError) throw claimError

      // Trigger confetti celebration
      triggerConfetti()

      // Show success toast
      toast.reward(reward.reward_name, {
        description: `Congratulations! You spent ${reward.stars_required} stars.`,
      })

      // Call onClaimed callback
      onClaimed()

      // Close modal after a brief delay
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Error claiming reward:', error)
      toast.error('Failed to claim reward', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsClaiming(false)
    }
  }

  const triggerConfetti = () => {
    // Burst of confetti from the center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
    })

    // Multiple bursts for extra celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#22c55e', '#f59e0b'],
      })
    }, 200)

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#22c55e', '#f59e0b'],
      })
    }, 400)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Claim Your Reward</DialogTitle>
          <DialogDescription className="text-center">
            You&apos;re about to claim this amazing reward!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reward Details */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-4 border border-primary-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{reward.reward_name}</h3>
            {reward.reward_description && (
              <p className="text-sm text-gray-600 mb-3">{reward.reward_description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cost:</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-gray-900">{reward.stars_required} stars</span>
              </div>
            </div>
          </div>

          {/* Current Stars */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Your stars:</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-900">{currentStars}</span>
            </div>
          </div>

          {/* Remaining Stars */}
          {canClaim && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm text-green-700">Stars after claiming:</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-green-900">
                  {currentStars - reward.stars_required}
                </span>
              </div>
            </div>
          )}

          {/* Warning if not enough stars */}
          {!canClaim && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                You need <strong>{reward.stars_required - currentStars}</strong> more stars to claim
                this reward.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isClaiming}>
            Cancel
          </Button>
          <Button onClick={handleClaim} disabled={!canClaim || isClaiming} className="gap-2">
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                Claim Reward
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
