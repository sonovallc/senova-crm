'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Inbox, Users, CreditCard, Brain, Settings, LogOut, History, Trash2, Flag, Mail, Send, FileText, Megaphone, Zap, Edit3, Bot, ChevronDown, ChevronRight, Tag, List, Building2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types'
import { useState } from 'react'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  children?: NavigationItem[]
  visible?: boolean
}

const baseNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  {
    name: 'Email',
    href: '/dashboard/email/compose',
    icon: Mail,
    children: [
      { name: 'Compose', href: '/dashboard/email/compose', icon: Edit3 },
      { name: 'Templates', href: '/dashboard/email/templates', icon: FileText },
      { name: 'Campaigns', href: '/dashboard/email/campaigns', icon: Megaphone },
      { name: 'Autoresponders', href: '/dashboard/email/autoresponders', icon: Zap },
    ]
  },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'AI Tools', href: '/dashboard/ai', icon: Brain },
  // Calendar page exists but hidden from navigation for now
  // { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      { name: 'Users', href: '/dashboard/settings/users', icon: Users },
      { name: 'Tags', href: '/dashboard/settings/tags', icon: Tag },
      { name: 'Fields', href: '/dashboard/settings/fields', icon: List },
      // Feature Flags hidden - admin/developer feature not for production
      // { name: 'Feature Flags', href: '/dashboard/settings/feature-flags', icon: Flag },
      { name: 'Mailgun', href: '/dashboard/settings/integrations/mailgun', icon: Send },
      { name: 'Closebot', href: '/dashboard/settings/integrations/closebot', icon: Bot },
    ]
  },
]

function getNavigation(role?: UserRole | null): NavigationItem[] {
  const items = [...baseNavigation]

  // Add Objects after Contacts (index 3) if user has permission
  // Show for Owner and Admin roles (not regular Users)
  if (role === 'owner' || role === 'admin') {
    items.splice(3, 0, {
      name: 'Objects',
      href: '/dashboard/objects',
      icon: Building2,
      visible: true
    })
  }

  if (role === 'owner' || role === 'admin') {
    // Activity Log goes after Objects (or after Contacts if no Objects)
    const insertIndex = items.findIndex(item => item.name === 'Objects') !== -1 ? 4 : 3
    items.splice(insertIndex, 0, { name: 'Activity Log', href: '/dashboard/activity-log', icon: History })
  }

  if (role === 'owner') {
    items.push({ name: 'Deleted Contacts', href: '/dashboard/contacts/deleted', icon: Trash2 })
  }

  // Feature Flags is already hidden from navigation for all users
  // No need to filter since it's commented out in baseNavigation

  return items.filter(item => item.visible !== false)
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])


  const handleLogout = async () => {
    await logout()
  }

  const toggleExpanded = (itemName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-senova-gray-300 bg-white pt-16 shadow-sm animate-slide-in transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-senova-primary">Senova CRM</h1>
        <p className="text-sm text-senova-gray-500">Business Management Platform</p>
      </div>

      <Separator className="bg-senova-gray-300" />

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto min-h-0">
        {getNavigation(user?.role).map((item) => {
          const isActive = pathname === item.href
          const isChildActive = item.children?.some(child => pathname === child.href)
          const isExpanded = expandedItems.includes(item.name) || isActive || isChildActive

          return (
            <div key={item.name} className="space-y-1">
              {item.children ? (
                <div>
                  <button
                    onClick={(e) => toggleExpanded(item.name, e)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isActive || isChildActive
                        ? 'bg-senova-sky-500 text-white shadow-md border-l-4 border-senova-primary'
                        : 'text-senova-gray-700 hover:bg-senova-sky-50 hover:text-senova-sky-700 hover:translate-x-1'
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive || isChildActive ? "" : "text-senova-sky-500")} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive || isChildActive
                      ? 'bg-senova-sky-500 text-white shadow-md border-l-4 border-senova-primary'
                      : 'text-senova-gray-700 hover:bg-senova-sky-50 hover:text-senova-sky-700 hover:translate-x-1'
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive || isChildActive ? "" : "text-senova-sky-500")} />
                  {item.name}
                </Link>
              )}

              {item.children && isExpanded && (
                <div className="ml-6 space-y-1 animate-fade-in-up">
                  {item.children.map((child) => {
                    const isChildItemActive = pathname === child.href
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all duration-200',
                          isChildItemActive
                            ? 'bg-senova-sky-100 text-senova-sky-700 font-medium border-l-2 border-senova-sky-500'
                            : 'text-senova-gray-500 hover:bg-senova-sky-50 hover:text-senova-sky-600 hover:translate-x-1'
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <Separator className="bg-senova-gray-300" />

      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start border-senova-primary text-senova-primary hover:bg-senova-primary hover:text-white transition-all duration-200"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
      </div>
    </>
  )
}
