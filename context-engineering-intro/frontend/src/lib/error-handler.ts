/**
 * Error handling utilities for API responses
 *
 * Handles different error formats from the backend:
 * - Pydantic validation errors (array of error objects)
 * - Simple error messages (string detail)
 * - Generic errors
 */

interface PydanticValidationError {
  type: string
  loc: (string | number)[]
  msg: string
  input?: any
  ctx?: any
}

/**
 * Format error response from API into user-friendly message
 *
 * @param error - Error object from catch block
 * @returns Formatted error message string
 */
export function formatErrorMessage(error: any): string {
  // Handle axios error responses
  if (error.response?.data) {
    const { detail } = error.response.data

    // Handle Pydantic validation errors (array of errors)
    if (Array.isArray(detail)) {
      return formatValidationErrors(detail)
    }

    // Handle simple string detail
    if (typeof detail === 'string') {
      return detail
    }

    // Handle error object with message
    if (detail && typeof detail === 'object' && 'msg' in detail) {
      return detail.msg
    }
  }

  // Handle error with message property
  if (error.message) {
    return error.message
  }

  // Default fallback
  return 'An unexpected error occurred'
}

/**
 * Format Pydantic validation errors into readable message
 *
 * @param errors - Array of validation error objects
 * @returns Formatted error message
 */
function formatValidationErrors(errors: PydanticValidationError[]): string {
  if (errors.length === 0) {
    return 'Validation error occurred'
  }

  if (errors.length === 1) {
    const error = errors[0]
    const field = formatFieldPath(error.loc)
    return `${field}: ${error.msg}`
  }

  // Multiple errors - format as bullet list
  const formattedErrors = errors.map((error) => {
    const field = formatFieldPath(error.loc)
    return `• ${field}: ${error.msg}`
  })

  return formattedErrors.join('\n')
}

/**
 * Format field path from validation error location array
 *
 * @param loc - Location array from Pydantic error
 * @returns Formatted field name
 */
function formatFieldPath(loc: (string | number)[]): string {
  if (loc.length === 0) {
    return 'Field'
  }

  // Remove 'body' prefix if present (common in FastAPI)
  const filtered = loc.filter((part) => part !== 'body')

  if (filtered.length === 0) {
    return 'Field'
  }

  // Convert to readable format
  return filtered
    .map((part) => {
      if (typeof part === 'string') {
        // Convert snake_case to Title Case
        return part
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
      return String(part)
    })
    .join(' → ')
}

/**
 * Extract validation errors for specific field
 *
 * @param error - Error object from API
 * @param fieldName - Field name to extract errors for
 * @returns Error message for field or null
 */
export function getFieldError(error: any, fieldName: string): string | null {
  if (!error.response?.data?.detail || !Array.isArray(error.response.data.detail)) {
    return null
  }

  const fieldErrors = error.response.data.detail.filter((err: PydanticValidationError) =>
    err.loc.includes(fieldName)
  )

  if (fieldErrors.length === 0) {
    return null
  }

  return fieldErrors.map((err: PydanticValidationError) => err.msg).join(', ')
}
