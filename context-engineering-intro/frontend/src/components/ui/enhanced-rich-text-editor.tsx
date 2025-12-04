'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlock from '@tiptap/extension-code-block'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Code2,
  Undo,
  Redo,
  ChevronDown,
  Palette,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Pilcrow
} from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface EnhancedRichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  showAllFeatures?: boolean
  'data-testid'?: string
}

const colors = [
  '#000000', // Black
  '#6B7280', // Gray
  '#DC2626', // Red
  '#EA580C', // Orange
  '#F59E0B', // Amber
  '#16A34A', // Green
  '#0EA5E9', // Light Blue
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#EC4899', // Pink
]

const highlightColors = [
  'transparent', // No highlight
  '#FEF3C7', // Yellow
  '#DBEAFE', // Light Blue
  '#D1FAE5', // Light Green
  '#FED7AA', // Light Orange
  '#FECACA', // Light Red
  '#E9D5FF', // Light Purple
  '#FCE7F3', // Light Pink
  '#E5E7EB', // Light Gray
]

export function EnhancedRichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = '200px',
  showAllFeatures = true,
  'data-testid': dataTestId
}: EnhancedRichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use the separate CodeBlock extension
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded p-3 my-2 overflow-x-auto',
        },
      }),
      Color,
      TextStyle,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none p-3',
          `min-h-[${minHeight}]`
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  })

  // Update content when value changes externally
  useEffect(() => {
    if (!editor) return

    const normalizeHtml = (html: string) => {
      if (!html || html === '<p></p>' || html === '<p><br></p>' || html.trim() === '') {
        return ''
      }
      return html.trim()
    }

    const normalizedValue = normalizeHtml(value)
    const normalizedCurrent = normalizeHtml(editor.getHTML())

    if (normalizedValue !== normalizedCurrent) {
      const attemptSetContent = (attempt = 1) => {
        if (editor.isDestroyed) return

        try {
          editor.commands.setContent(value || '')
          const afterSet = normalizeHtml(editor.getHTML())
          if (afterSet !== normalizedValue && attempt < 3) {
            setTimeout(() => attemptSetContent(attempt + 1), 100 * attempt)
          }
        } catch (e) {
          console.warn('EnhancedRichTextEditor setContent failed:', e)
          if (attempt < 3) {
            setTimeout(() => attemptSetContent(attempt + 1), 100 * attempt)
          }
        }
      }

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

  const addLink = () => {
    if (linkUrl && editor) {
      if (editor.state.selection.empty) {
        // If no text is selected, insert the URL as link text
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run()
      } else {
        // Add link to selected text
        editor.chain().focus().setLink({ href: linkUrl }).run()
      }
      setLinkUrl('')
      setIsLinkDialogOpen(false)
    }
  }

  const addImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setIsImageDialogOpen(false)
    }
  }

  const insertTable = () => {
    if (editor && tableRows > 0 && tableCols > 0) {
      editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run()
      setIsTableDialogOpen(false)
      setTableRows(3)
      setTableCols(3)
    }
  }

  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title?: string
    children: React.ReactNode
  }) => (
    <Button
      size="sm"
      variant="ghost"
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-slate-200'
      )}
      title={title}
    >
      {children}
    </Button>
  )

  const Separator = () => <div className="w-px bg-slate-300 mx-1" />

  return (
    <div className={cn('enhanced-rich-text-editor border rounded-md', className)} data-testid={dataTestId || 'enhanced-rich-text-editor'}>
      {/* Toolbar */}
      <div className="toolbar border-b p-2 bg-slate-50" data-testid={dataTestId ? `${dataTestId}-toolbar` : 'enhanced-rich-text-toolbar'}>
        <div className="flex gap-1 flex-wrap items-center">
          {/* Headings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="h-8 px-2 text-xs gap-1"
              >
                <Type className="h-4 w-4" />
                Format
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                <Pilcrow className="h-4 w-4 mr-2" />
                Normal Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="h-4 w-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="h-4 w-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="h-4 w-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <Separator />

          {/* Colors */}
          {showAllFeatures && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    className="h-8 w-8 p-0"
                    title="Text Color"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => editor.chain().focus().setColor(color).run()}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    className="h-8 w-8 p-0"
                    title="Highlight Color"
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {highlightColors.map((color, index) => (
                      <button
                        key={color}
                        onClick={() => {
                          if (color === 'transparent') {
                            editor.chain().focus().unsetHighlight().run()
                          } else {
                            editor.chain().focus().toggleHighlight({ color }).run()
                          }
                        }}
                        className={cn(
                          "w-6 h-6 rounded border hover:scale-110 transition-transform",
                          color === 'transparent' ? 'border-gray-400' : 'border-gray-300'
                        )}
                        style={{ backgroundColor: color }}
                        title={index === 0 ? 'Remove highlight' : color}
                      >
                        {color === 'transparent' && (
                          <span className="text-xs">×</span>
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Separator />
            </>
          )}

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <Separator />

          {/* Alignment */}
          {showAllFeatures && (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>

              <Separator />
            </>
          )}

          {/* Insert Elements */}
          {showAllFeatures && (
            <>
              <ToolbarButton
                onClick={() => setIsLinkDialogOpen(true)}
                title="Insert Link"
              >
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setIsImageDialogOpen(true)}
                title="Insert Image"
              >
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setIsTableDialogOpen(true)}
                title="Insert Table"
              >
                <TableIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                title="Code Block"
              >
                <Code2 className="h-4 w-4" />
              </ToolbarButton>

              <Separator />
            </>
          )}

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <Separator />

          {/* Variables Dropdown (from original) */}
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
              <DropdownMenuItem onClick={() => insertVariable('{{first_name}}')}>
                <span className="font-mono text-xs">{"{{first_name}}"}</span>
                <span className="ml-auto text-xs text-muted-foreground">First Name</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertVariable('{{last_name}}')}>
                <span className="font-mono text-xs">{"{{last_name}}"}</span>
                <span className="ml-auto text-xs text-muted-foreground">Last Name</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertVariable('{{email}}')}>
                <span className="font-mono text-xs">{"{{email}}"}</span>
                <span className="ml-auto text-xs text-muted-foreground">Email</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertVariable('{{company}}')}>
                <span className="font-mono text-xs">{"{{company}}"}</span>
                <span className="ml-auto text-xs text-muted-foreground">Company</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Contact Information */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <span>Contact Information</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-64 max-h-[400px] overflow-y-auto">
                  <DropdownMenuItem onClick={() => insertVariable('{{phone}}')}>
                    <span className="font-mono text-xs">{"{{phone}}"}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Phone</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable('{{mobile_phone}}')}>
                    <span className="font-mono text-xs">{"{{mobile_phone}}"}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Mobile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertVariable('{{job_title}}')}>
                    <span className="font-mono text-xs">{"{{job_title}}"}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Job Title</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Add more categories as needed */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor */}
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Enter the URL for the link. Select text first to link existing text, or the URL will be inserted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-url" className="text-right">
                URL
              </Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addLink}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Enter the URL for the image you want to insert.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-url" className="text-right">
                Image URL
              </Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addImage}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
            <DialogDescription>
              Choose the number of rows and columns for your table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-rows" className="text-right">
                Rows
              </Label>
              <Input
                id="table-rows"
                type="number"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
                className="col-span-3"
                min="1"
                max="20"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-cols" className="text-right">
                Columns
              </Label>
              <Input
                id="table-cols"
                type="number"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
                className="col-span-3"
                min="1"
                max="20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertTable}>Insert Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}