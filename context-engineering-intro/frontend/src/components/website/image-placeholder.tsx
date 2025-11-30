'use client'

interface ImagePlaceholderProps {
  title: string
  subtitle?: string
  width?: number
  height?: number
  type?: 'before' | 'after'
}

export function ImagePlaceholder({
  title,
  subtitle = 'Sample Image - Add Real Photo',
  width = 600,
  height = 600,
  type = 'before'
}: ImagePlaceholderProps) {
  const bgColor = type === 'before' ? '#f1f5f9' : '#e0f2fe'
  const borderColor = type === 'before' ? '#cbd5e1' : '#7dd3fc'
  const textColor = type === 'before' ? '#475569' : '#0369a1'

  return (
    <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width={width} height={height} fill={bgColor} />

      {/* Border */}
      <rect
        x="10"
        y="10"
        width={width - 20}
        height={height - 20}
        fill="none"
        stroke={borderColor}
        strokeWidth="3"
        strokeDasharray="10,5"
      />

      {/* Camera Icon */}
      <g transform={`translate(${width/2 - 40}, ${height/2 - 80})`}>
        <rect x="10" y="20" width="60" height="45" rx="5" fill={borderColor} opacity="0.3" />
        <circle cx="40" cy="42" r="15" fill={borderColor} opacity="0.5" />
        <rect x="30" y="15" width="20" height="8" rx="2" fill={borderColor} opacity="0.3" />
      </g>

      {/* Title */}
      <text
        x={width / 2}
        y={height / 2 + 40}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="600"
        fill={textColor}
        textAnchor="middle"
      >
        {title}
      </text>

      {/* Subtitle */}
      <text
        x={width / 2}
        y={height / 2 + 70}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="16"
        fill={textColor}
        opacity="0.7"
        textAnchor="middle"
      >
        {subtitle}
      </text>

      {/* Type Label */}
      <text
        x={width / 2}
        y={height / 2 + 95}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14"
        fontWeight="500"
        fill={type === 'before' ? '#64748b' : '#0284c7'}
        textAnchor="middle"
      >
        {type.toUpperCase()}
      </text>
    </svg>
  )
}
