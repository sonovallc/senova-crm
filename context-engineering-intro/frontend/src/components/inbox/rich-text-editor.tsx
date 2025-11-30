'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Undo, Redo, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  'data-testid'?: string
}

export function RichTextEditor({ value, onChange, placeholder, className, 'data-testid': dataTestId }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false, // Fix SSR hydration issue with Next.js 15
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3',
      },
    },
  })

  // Update content when value changes externally (e.g., reset or template selection)
  // BUG FIX #6, #10, #14: Synchronize external value changes with TipTap editor
  useEffect(() => {
    if (!editor) return

    // Normalize for comparison - handle various empty states
    const normalizeHtml = (html: string) => {
      if (!html || html === '<p></p>' || html === '<p><br></p>' || html.trim() === '') {
        return ''
      }
      return html.trim()
    }

    const normalizedValue = normalizeHtml(value)
    const normalizedCurrent = normalizeHtml(editor.getHTML())

    // Only update if content actually differs
    if (normalizedValue !== normalizedCurrent) {
      // Use multiple deferred attempts to ensure TipTap is ready
      // This handles race conditions during modal open / component mount
      const attemptSetContent = (attempt = 1) => {
        if (editor.isDestroyed) return

        try {
          editor.commands.setContent(value || '')
          // Verify it worked
          const afterSet = normalizeHtml(editor.getHTML())
          if (afterSet !== normalizedValue && attempt < 3) {
            // Retry with longer delay if first attempt didn't work
            setTimeout(() => attemptSetContent(attempt + 1), 100 * attempt)
          }
        } catch (e) {
          console.warn('RichTextEditor setContent failed:', e)
          if (attempt < 3) {
            setTimeout(() => attemptSetContent(attempt + 1), 100 * attempt)
          }
        }
      }

      // Initial attempt after a short delay to let TipTap initialize
      const timeout = setTimeout(() => {
        requestAnimationFrame(() => attemptSetContent(1))
      }, 50)

      return () => clearTimeout(timeout)
    }
  }, [value, editor])

  const insertVariable = (variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(variable + ' ').run()
    }
  }

  if (!editor) return null

  return (
    <div className={cn('rich-text-editor border rounded-md', className)} data-testid={dataTestId || 'rich-text-editor'}>
      {/* Toolbar */}
      <div className="toolbar border-b p-2 flex gap-1 bg-slate-50" data-testid={dataTestId ? `${dataTestId}-toolbar` : 'rich-text-toolbar'}>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bold') && 'bg-slate-200'
          )}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('italic') && 'bg-slate-200'
          )}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px bg-slate-300 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bulletList') && 'bg-slate-200'
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('orderedList') && 'bg-slate-200'
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px bg-slate-300 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <div className="w-px bg-slate-300 mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              className="h-8 px-2 text-xs"
              title="Insert Field Variable"
              data-testid="variables-dropdown-trigger"
            >
              Variables <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-[500px] overflow-y-auto" data-testid="variables-dropdown-menu">
            {/* Common/Most Used Variables */}
            <DropdownMenuLabel className="text-xs font-semibold text-slate-500">Most Used</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => insertVariable('{{first_name}}')} data-testid="variable-first-name">
              <span className="font-mono text-xs">{"{{first_name}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">First Name</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{last_name}}')} data-testid="variable-last-name">
              <span className="font-mono text-xs">{"{{last_name}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Last Name</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{email}}')} data-testid="variable-email">
              <span className="font-mono text-xs">{"{{email}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{company}}')} data-testid="variable-company">
              <span className="font-mono text-xs">{"{{company}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Company</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{phone}}')} data-testid="variable-phone">
              <span className="font-mono text-xs">{"{{phone}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Phone</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Contact Information */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <span>Contact Information</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 max-h-[400px] overflow-y-auto">
                <DropdownMenuItem onClick={() => insertVariable('{{first_name}}')} data-testid="variable-contact-first-name">
                  <span className="font-mono text-xs">{"{{first_name}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">First Name</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{last_name}}')} data-testid="variable-contact-last-name">
                  <span className="font-mono text-xs">{"{{last_name}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Last Name</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{email}}')} data-testid="variable-contact-email">
                  <span className="font-mono text-xs">{"{{email}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{phone}}')} data-testid="variable-contact-phone">
                  <span className="font-mono text-xs">{"{{phone}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Phone</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{mobile_phone}}')} data-testid="variable-mobile-phone">
                  <span className="font-mono text-xs">{"{{mobile_phone}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Mobile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{personal_phone}}')} data-testid="variable-personal-phone">
                  <span className="font-mono text-xs">{"{{personal_phone}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Personal Phone</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{direct_number}}')} data-testid="variable-direct-number">
                  <span className="font-mono text-xs">{"{{direct_number}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Direct Number</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{business_email}}')} data-testid="variable-business-email">
                  <span className="font-mono text-xs">{"{{business_email}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Business Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{personal_email}}')} data-testid="variable-personal-email">
                  <span className="font-mono text-xs">{"{{personal_email}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Personal Email</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Address Information */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <span>Address</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuItem onClick={() => insertVariable('{{street_address}}')} data-testid="variable-street-address">
                  <span className="font-mono text-xs">{"{{street_address}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Street</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{city}}')} data-testid="variable-city">
                  <span className="font-mono text-xs">{"{{city}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">City</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{state}}')} data-testid="variable-state">
                  <span className="font-mono text-xs">{"{{state}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">State</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{zip_code}}')} data-testid="variable-zip">
                  <span className="font-mono text-xs">{"{{zip_code}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">ZIP Code</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{country}}')} data-testid="variable-country">
                  <span className="font-mono text-xs">{"{{country}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Country</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => insertVariable('{{personal_address}}')} data-testid="variable-personal-address">
                  <span className="font-mono text-xs">{"{{personal_address}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Personal Street</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{personal_city}}')} data-testid="variable-personal-city">
                  <span className="font-mono text-xs">{"{{personal_city}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Personal City</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{personal_state}}')} data-testid="variable-personal-state">
                  <span className="font-mono text-xs">{"{{personal_state}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Personal State</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{personal_zip}}')} data-testid="variable-personal-zip">
                  <span className="font-mono text-xs">{"{{personal_zip}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Personal ZIP</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Company Information */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <span>Company</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 max-h-[400px] overflow-y-auto">
                <DropdownMenuItem onClick={() => insertVariable('{{company}}')} data-testid="variable-company-name">
                  <span className="font-mono text-xs">{"{{company}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company Name</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_name}}')} data-testid="variable-company-name-alt">
                  <span className="font-mono text-xs">{"{{company_name}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company Name</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{job_title}}')} data-testid="variable-job-title">
                  <span className="font-mono text-xs">{"{{job_title}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Job Title</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{department}}')} data-testid="variable-department">
                  <span className="font-mono text-xs">{"{{department}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Department</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{seniority_level}}')} data-testid="variable-seniority">
                  <span className="font-mono text-xs">{"{{seniority_level}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Seniority</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => insertVariable('{{company_address}}')} data-testid="variable-company-address">
                  <span className="font-mono text-xs">{"{{company_address}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company Address</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_city}}')} data-testid="variable-company-city">
                  <span className="font-mono text-xs">{"{{company_city}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company City</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_state}}')} data-testid="variable-company-state">
                  <span className="font-mono text-xs">{"{{company_state}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company State</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_zip}}')} data-testid="variable-company-zip">
                  <span className="font-mono text-xs">{"{{company_zip}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company ZIP</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_phone}}')} data-testid="variable-company-phone">
                  <span className="font-mono text-xs">{"{{company_phone}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company Phone</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_domain}}')} data-testid="variable-company-domain">
                  <span className="font-mono text-xs">{"{{company_domain}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Website Domain</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_industry}}')} data-testid="variable-company-industry">
                  <span className="font-mono text-xs">{"{{company_industry}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Industry</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_employee_count}}')} data-testid="variable-company-employees">
                  <span className="font-mono text-xs">{"{{company_employee_count}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Employee Count</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_revenue}}')} data-testid="variable-company-revenue">
                  <span className="font-mono text-xs">{"{{company_revenue}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Revenue</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* CRM/Status Information */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <span>CRM Status</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuItem onClick={() => insertVariable('{{status}}')} data-testid="variable-status">
                  <span className="font-mono text-xs">{"{{status}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Contact Status</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{source}}')} data-testid="variable-source">
                  <span className="font-mono text-xs">{"{{source}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Lead Source</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{pipeline_stage}}')} data-testid="variable-pipeline-stage">
                  <span className="font-mono text-xs">{"{{pipeline_stage}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Pipeline Stage</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{tags}}')} data-testid="variable-tags">
                  <span className="font-mono text-xs">{"{{tags}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Tags</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{lead_score}}')} data-testid="variable-lead-score">
                  <span className="font-mono text-xs">{"{{lead_score}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Lead Score</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Personal Details */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <span>Personal Details</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuItem onClick={() => insertVariable('{{age_range}}')} data-testid="variable-age-range">
                  <span className="font-mono text-xs">{"{{age_range}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Age Range</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{gender}}')} data-testid="variable-gender">
                  <span className="font-mono text-xs">{"{{gender}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Gender</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{married}}')} data-testid="variable-married">
                  <span className="font-mono text-xs">{"{{married}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Marital Status</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{children}}')} data-testid="variable-children">
                  <span className="font-mono text-xs">{"{{children}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Children</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{homeowner}}')} data-testid="variable-homeowner">
                  <span className="font-mono text-xs">{"{{homeowner}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Homeowner</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{income_range}}')} data-testid="variable-income-range">
                  <span className="font-mono text-xs">{"{{income_range}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Income Range</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{net_worth}}')} data-testid="variable-net-worth">
                  <span className="font-mono text-xs">{"{{net_worth}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Net Worth</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Social Media */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <span>Social Media</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuItem onClick={() => insertVariable('{{linkedin_url}}')} data-testid="variable-linkedin">
                  <span className="font-mono text-xs">{"{{linkedin_url}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">LinkedIn</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{facebook_url}}')} data-testid="variable-facebook">
                  <span className="font-mono text-xs">{"{{facebook_url}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{twitter_url}}')} data-testid="variable-twitter">
                  <span className="font-mono text-xs">{"{{twitter_url}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{company_linkedin_url}}')} data-testid="variable-company-linkedin">
                  <span className="font-mono text-xs">{"{{company_linkedin_url}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Company LinkedIn</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Dates */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <span>Dates</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuItem onClick={() => insertVariable('{{created_at}}')} data-testid="variable-created-at">
                  <span className="font-mono text-xs">{"{{created_at}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Date Added</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertVariable('{{updated_at}}')} data-testid="variable-updated-at">
                  <span className="font-mono text-xs">{"{{updated_at}}"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Last Updated</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Sender Information */}
            <DropdownMenuLabel className="text-xs font-semibold text-slate-500">Sender Info</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => insertVariable('{{user_first_name}}')} data-testid="variable-user-first-name">
              <span className="font-mono text-xs">{"{{user_first_name}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Your First Name</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{user_last_name}}')} data-testid="variable-user-last-name">
              <span className="font-mono text-xs">{"{{user_last_name}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Your Last Name</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{user_full_name}}')} data-testid="variable-user-full-name">
              <span className="font-mono text-xs">{"{{user_full_name}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Your Full Name</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{user_email}}')} data-testid="variable-user-email">
              <span className="font-mono text-xs">{"{{user_email}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Your Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertVariable('{{user_department}}')} data-testid="variable-user-department">
              <span className="font-mono text-xs">{"{{user_department}}"}</span>
              <span className="ml-auto text-xs text-muted-foreground">Your Department</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
