'use client'

import { useState } from 'react'
import { EnhancedRichTextEditor } from './enhanced-rich-text-editor'

/**
 * Example usage of the EnhancedRichTextEditor component
 *
 * This component demonstrates how to use the enhanced rich text editor
 * in different configurations.
 */
export function EnhancedEditorExample() {
  const [content1, setContent1] = useState('<p>Start typing here...</p>')
  const [content2, setContent2] = useState('<p>This is a minimal editor with only basic features.</p>')

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Full-Featured Editor</h2>
        <p className="text-gray-600 mb-4">
          This editor includes all formatting options: text colors, highlighting,
          tables, images, links, alignment, and more.
        </p>
        <EnhancedRichTextEditor
          value={content1}
          onChange={setContent1}
          placeholder="Start typing here..."
          minHeight="400px"
          showAllFeatures={true}
        />
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-sm font-semibold mb-2">HTML Output:</h3>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{content1}</pre>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Minimal Editor</h2>
        <p className="text-gray-600 mb-4">
          This editor has only basic formatting: bold, italic, lists, and variables.
          Perfect for simple text fields like email templates.
        </p>
        <EnhancedRichTextEditor
          value={content2}
          onChange={setContent2}
          placeholder="Type your message..."
          minHeight="200px"
          showAllFeatures={false}
        />
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-sm font-semibold mb-2">HTML Output:</h3>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{content2}</pre>
        </div>
      </div>
    </div>
  )
}

/**
 * Usage in other components:
 *
 * import { EnhancedRichTextEditor } from '@/components/ui/enhanced-rich-text-editor'
 *
 * // In your component:
 * const [emailBody, setEmailBody] = useState('')
 *
 * <EnhancedRichTextEditor
 *   value={emailBody}
 *   onChange={setEmailBody}
 *   placeholder="Write your email..."
 *   minHeight="300px"
 *   showAllFeatures={true}
 * />
 *
 * // Available props:
 * - value: string - The HTML content
 * - onChange: (html: string) => void - Callback when content changes
 * - placeholder?: string - Placeholder text
 * - className?: string - Additional CSS classes
 * - minHeight?: string - Minimum editor height (default: '200px')
 * - showAllFeatures?: boolean - Show all toolbar features (default: true)
 */