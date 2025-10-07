'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User, Target, Gift, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AthleteMind',
    description: 'Let\'s get you set up with your training journey. This will only take a few minutes.',
    icon: <User className="w-8 h-8 text-blue-500" />
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Tell us about yourself so we can personalize your experience.',
    icon: <User className="w-8 h-8 text-green-500" />
  },
  {
    id: 'goals',
    title: 'Training Goals',
    description: 'What do you want to achieve in your training?',
    icon: <Target className="w-8 h-8 text-purple-500" />
  },
  {
    id: 'rewards',
    title: 'Rewards & Motivation',
    description: 'Set up rewards to keep you motivated on your journey.',
    icon: <Gift className="w-8 h-8 text-orange-500" />
  }
]

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    trainingGoals: '',
    rewardName: '',
    rewardDescription: '',
    starsRequired: 10
  })
  const router = useRouter()
  const supabase = createClient()

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Update profile if needed
      if (formData.firstName || formData.lastName) {
        await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName
          })
          .eq('id', session.user.id)
      }

      // Create initial reward if provided
      if (formData.rewardName) {
        await supabase
          .from('rewards')
          .insert({
            user_id: session.user.id,
            reward_name: formData.rewardName,
            reward_description: formData.rewardDescription,
            stars_required: formData.starsRequired,
            reward_type: 'individual',
            is_active: true
          })
      }

      // Mark setup as complete
      await supabase
        .from('profiles')
        .update({ setup_completed: true })
        .eq('id', session.user.id)

      router.push('/dashboard/athlete')
    } catch (error) {
      console.error('Error completing setup:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (SETUP_STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              {SETUP_STEPS[currentStep].icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {SETUP_STEPS[currentStep].title}
            </h2>
            <p className="text-gray-600 mb-8">
              {SETUP_STEPS[currentStep].description}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">What you'll be able to do:</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Set and track your training goals</li>
                <li>• Log your training sessions and reflections</li>
                <li>• Earn stars and unlock rewards</li>
                <li>• Track your progress over time</li>
              </ul>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              {SETUP_STEPS[currentStep].icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {SETUP_STEPS[currentStep].title}
            </h2>
            <p className="text-gray-600 mb-6">
              {SETUP_STEPS[currentStep].description}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                />
              </div>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div>
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              {SETUP_STEPS[currentStep].icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {SETUP_STEPS[currentStep].title}
            </h2>
            <p className="text-gray-600 mb-6">
              {SETUP_STEPS[currentStep].description}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are your main training goals?
              </label>
              <textarea
                value={formData.trainingGoals}
                onChange={(e) => setFormData({...formData, trainingGoals: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="e.g., Improve my back handspring, increase flexibility, build strength..."
              />
            </div>
          </div>
        )

      case 'rewards':
        return (
          <div>
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              {SETUP_STEPS[currentStep].icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {SETUP_STEPS[currentStep].title}
            </h2>
            <p className="text-gray-600 mb-6">
              {SETUP_STEPS[currentStep].description}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Name
                </label>
                <input
                  type="text"
                  value={formData.rewardName}
                  onChange={(e) => setFormData({...formData, rewardName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., New rollerblades, movie night, special treat..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.rewardDescription}
                  onChange={(e) => setFormData({...formData, rewardDescription: e.target.value})}
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
                  value={formData.starsRequired}
                  onChange={(e) => setFormData({...formData, starsRequired: parseInt(e.target.value) || 10})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  You earn 1 star for each completed training session
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white shadow-xl rounded-lg">
          {/* Progress Bar */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                Step {currentStep + 1} of {SETUP_STEPS.length}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {Math.round(((currentStep + 1) / SETUP_STEPS.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / SETUP_STEPS.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 py-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {currentStep === SETUP_STEPS.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

