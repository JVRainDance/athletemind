'use client'

import { useState } from 'react'
import AbsenceModal from './AbsenceModal'

interface AbsenceButtonProps {
  athleteId: string
}

export default function AbsenceButton({ athleteId }: AbsenceButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full sm:w-auto sm:flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[44px] transition-colors"
      >
        Record an absence
      </button>
      
      <AbsenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        athleteId={athleteId}
      />
    </>
  )
}









