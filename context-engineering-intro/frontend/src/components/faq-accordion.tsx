'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItemProps {
  question: string
  answer: string
}

export function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 pb-6">
      <button
        className="flex w-full items-start justify-between text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-base font-semibold leading-7">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 flex-none text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 flex-none text-gray-400" />
        )}
      </button>
      {isOpen && (
        <p className="mt-2 text-base leading-7 text-gray-600">{answer}</p>
      )}
    </div>
  )
}