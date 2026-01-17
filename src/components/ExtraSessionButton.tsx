'use client'

import { useState } from 'react'
import ExtraSessionModal from './ExtraSessionModal'
import { Plus } from 'lucide-react'

interface ExtraSessionButtonProps {
  athleteId: string
}

export default function ExtraSessionButton({ athleteId }: ExtraSessionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSessionScheduled = () => {
    // Optionally refresh data on the dashboard or show a success message
    console.log('Extra session scheduled successfully!')
    // The modal will handle closing and page refresh
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full sm:w-auto sm:flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 min-h-[44px] transition-colors"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add an extra session
      </button>
      <ExtraSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        athleteId={athleteId}
      />
    </>
  )
}









