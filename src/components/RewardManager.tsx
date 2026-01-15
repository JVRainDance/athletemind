'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Gift, Plus, Trash2, Edit, Star } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/button'

interface Reward {
  id: string
  reward_name: string
  reward_description: string | null
  stars_required: number
  is_active: boolean
}

export default function RewardManager() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [formData, setFormData] = useState({
    reward_name: '',
    reward_description: '',
    stars_required: 10
  })
  const supabase = createClient()

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('reward_type', 'individual')
        .order('stars_required', { ascending: true })

      setRewards(data || [])
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      if (editingReward) {
        // Update existing reward
        const { error } = await supabase
          .from('rewards')
          .update({
            reward_name: formData.reward_name,
            reward_description: formData.reward_description || null,
            stars_required: formData.stars_required
          })
          .eq('id', editingReward.id)

        if (error) throw error
      } else {
        // Create new reward
        const { error } = await supabase
          .from('rewards')
          .insert({
            user_id: session.user.id,
            reward_name: formData.reward_name,
            reward_description: formData.reward_description || null,
            stars_required: formData.stars_required,
            reward_type: 'individual',
            is_active: true
          })

        if (error) throw error
      }

      setFormData({ reward_name: '', reward_description: '', stars_required: 10 })
      setShowForm(false)
      setEditingReward(null)
      fetchRewards()
    } catch (error) {
      console.error('Error saving reward:', error)
      alert('Error saving reward. Please try again.')
    }
  }

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward)
    setFormData({
      reward_name: reward.reward_name,
      reward_description: reward.reward_description || '',
      stars_required: reward.stars_required
    })
    setShowForm(true)
  }

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId)

      if (error) throw error

      fetchRewards()
    } catch (error) {
      console.error('Error deleting reward:', error)
      alert('Error deleting reward. Please try again.')
    }
  }

  const handleCancel = () => {
    setFormData({ reward_name: '', reward_description: '', stars_required: 10 })
    setShowForm(false)
    setEditingReward(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Loading rewards...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Gift className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Rewards & Motivation
          </h3>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Reward
        </Button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {editingReward ? 'Edit Reward' : 'Add New Reward'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reward Name
              </label>
              <input
                type="text"
                value={formData.reward_name}
                onChange={(e) => setFormData({...formData, reward_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., New rollerblades, movie night..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={formData.reward_description}
                onChange={(e) => setFormData({...formData, reward_description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your reward..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stars Required
              </label>
              <input
                type="number"
                value={formData.stars_required}
                onChange={(e) => setFormData({...formData, stars_required: parseInt(e.target.value) || 10})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                You earn 1 star for each completed training session
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
              >
                {editingReward ? 'Update Reward' : 'Add Reward'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rewards yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first reward to start tracking your progress.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {reward.reward_name}
                  </p>
                  {reward.reward_description && (
                    <p className="text-sm text-gray-500">
                      {reward.reward_description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {reward.stars_required} stars required
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <IconButton
                  icon={<Edit className="w-4 h-4" />}
                  label="Edit reward"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(reward)}
                />
                <IconButton
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Delete reward"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(reward.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

