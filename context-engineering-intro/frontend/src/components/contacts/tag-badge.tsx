"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagBadgeProps {
  name: string
  color: string
  onRemove?: () => void
  size?: "sm" | "md" | "lg"
  className?: string
}

export function TagBadge({ name, color, onRemove, size = "md", className }: TagBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base"
  }

  // Convert hex color to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const rgb = hexToRgb(color)
  const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : 'rgba(0, 0, 0, 0.1)'

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium gap-1",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: bgColor,
        borderColor: color,
        borderWidth: '1px',
        borderStyle: 'solid',
        color: color
      }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 hover:opacity-70 transition-opacity"
          aria-label={`Remove ${name} tag`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
