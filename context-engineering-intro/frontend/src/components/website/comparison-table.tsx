import { Check, X } from 'lucide-react'

interface ComparisonRow {
  feature: string
  basic: string
  enterprise: string
  senova: string
}

interface ComparisonTableProps {
  headline?: string
  subheadline?: string
  headers: string[]
  rows: ComparisonRow[]
  className?: string
}

export function ComparisonTable({
  headline,
  subheadline,
  headers,
  rows,
  className = ''
}: ComparisonTableProps) {
  const renderCell = (value: string) => {
    if (value.startsWith('✓')) {
      return (
        <div className="flex items-center">
          <Check className="h-5 w-5 mr-2" style={{ color: 'var(--color-success)' }} />
          <span>{value.replace('✓', '').trim()}</span>
        </div>
      )
    }
    if (value === '❌' || value === 'None') {
      return (
        <div className="flex items-center text-gray-400">
          <X className="h-5 w-5 mr-2" />
          <span>None</span>
        </div>
      )
    }
    return <span>{value}</span>
  }

  return (
    <section className={`section-padding ${className}`}>
      <div className="container">
        {(headline || subheadline) && (
          <div className="mx-auto max-w-3xl text-center mb-12">
            {headline && (
              <h2 className="heading-2 mb-4">
                {headline}
              </h2>
            )}
            {subheadline && (
              <p className="text-lead">
                {subheadline}
              </p>
            )}
          </div>
        )}

        <div className="max-w-5xl mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className={`px-6 py-4 text-left text-sm font-semibold text-gray-900 ${
                        index === headers.length - 1
                          ? 'bg-gradient-to-b from-[rgba(180,249,178,0.2)] to-[rgba(180,249,178,0.1)]'
                          : ''
                      }`}
                    >
                      {header}
                      {index === headers.length - 1 && (
                        <span
                          className="ml-2 rounded-full px-2 py-1 text-xs"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white'
                          }}
                        >
                          Recommended
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 border-t">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 border-t">
                      {renderCell(row.basic)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 border-t">
                      {renderCell(row.enterprise)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium border-t bg-gradient-to-b from-[rgba(180,249,178,0.1)] to-[rgba(180,249,178,0.05)]">
                      {renderCell(row.senova)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}