"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Plus, Search } from "lucide-react"

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_empty"
  | "is_not_empty"
  | "in"

export interface ContactFilter {
  field: string
  operator: FilterOperator
  value?: string
}

export interface ContactFilterRequest {
  filters: ContactFilter[]
  logic: "and" | "or"
  page: number
  page_size: number
}

interface ContactFilterBuilderProps {
  onSearch: (filterRequest: ContactFilterRequest) => void
  onClear: () => void
}

// Available contact fields for filtering
// IMPORTANT: These must match the actual database column names
const CONTACT_FIELDS = [
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "status", label: "Status" },
  { value: "source", label: "Source" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip_code", label: "Zip Code" },
  { value: "country", label: "Country" },
  { value: "age_range", label: "Age Range" },
  { value: "gender", label: "Gender" },
  { value: "homeowner", label: "Homeowner" },
  { value: "married", label: "Married" },
  { value: "income_range", label: "Income Range" },
  { value: "net_worth", label: "Net Worth" },
]

// Filter operators with labels
const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
  { value: "in", label: "In List (comma-separated)" },
]

export function ContactFilterBuilder({ onSearch, onClear }: ContactFilterBuilderProps) {
  const [filters, setFilters] = useState<ContactFilter[]>([
    { field: "status", operator: "equals", value: "" },
  ])
  const [logic, setLogic] = useState<"and" | "or">("and")

  const addFilter = () => {
    setFilters([...filters, { field: "first_name", operator: "contains", value: "" }])
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const updateFilter = (index: number, updates: Partial<ContactFilter>) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    setFilters(newFilters)
  }

  const handleSearch = () => {
    // Filter out empty filters (no value for operators that require one)
    const validFilters = filters.filter((filter) => {
      // is_empty and is_not_empty don't need a value
      if (filter.operator === "is_empty" || filter.operator === "is_not_empty") {
        return true
      }
      // All other operators need a value
      return filter.value && filter.value.trim() !== ""
    })

    if (validFilters.length === 0) {
      // No valid filters, just clear
      onClear()
      return
    }

    const filterRequest: ContactFilterRequest = {
      filters: validFilters,
      logic,
      page: 1,
      page_size: 20,
    }

    onSearch(filterRequest)
  }

  const handleClear = () => {
    setFilters([{ field: "status", operator: "equals", value: "" }])
    setLogic("and")
    onClear()
  }

  // Check if operator requires value input
  const requiresValue = (operator: FilterOperator): boolean => {
    return operator !== "is_empty" && operator !== "is_not_empty"
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Advanced Filters</h3>
        <Select value={logic} onValueChange={(value: "and" | "or") => setLogic(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">Match All (AND)</SelectItem>
            <SelectItem value="or">Match Any (OR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filters.map((filter, index) => (
          <div key={index} className="flex items-center gap-2" data-testid={`filter-row-${index}`}>
            {/* Field Selector */}
            <Select
              value={filter.field}
              onValueChange={(value) => updateFilter(index, { field: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_FIELDS.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator Selector */}
            <Select
              value={filter.operator}
              onValueChange={(value: FilterOperator) => updateFilter(index, { operator: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value Input (conditional based on operator) */}
            {requiresValue(filter.operator) && (
              <Input
                placeholder="Enter value"
                value={filter.value || ""}
                onChange={(e) => updateFilter(index, { value: e.target.value })}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
              />
            )}

            {/* Remove Filter Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFilter(index)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addFilter}>
          <Plus className="h-4 w-4 mr-1" />
          Add Filter
        </Button>

        <div className="flex-1" />

        <Button variant="outline" onClick={handleClear}>
          Clear Filters
        </Button>

        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  )
}
