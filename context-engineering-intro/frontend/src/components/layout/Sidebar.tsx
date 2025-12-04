'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Inbox, Users, CreditCard, Brain, Settings, LogOut, History, Trash2, Flag, Mail, Send, FileText, Megaphone, Zap, Edit3, Bot, ChevronDown, ChevronRight, ChevronLeft, Tag, List, Building2, Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  children?: NavigationItem[]
  visible?: boolean
}

// Base navigation items (children with visible property are role-filtered in getNavigation)
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
      // Users is role-filtered below in getNavigation - only admin/owner can see
      { name: 'Users', href: '/dashboard/settings/users', icon: Users, visible: false },
      { name: 'Email Profiles', href: '/dashboard/settings/email-profiles', icon: Mail, visible: false },
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
  // Deep clone to avoid mutating baseNavigation
  const items = baseNavigation.map(item => ({
    ...item,
    children: item.children ? item.children.map(child => ({ ...child })) : undefined
  }))

  // Add Objects after Contacts (index 3) if user has permission
  // Show for Owner and Admin roles (not regular Users)
  if (role === 'owner' || role === 'admin') {
    items.splice(3, 0, {
      name: 'Objects',
      href: '/dashboard/objects',
      icon: Building2,
      children: undefined,
      visible: true
    })
  }

  if (role === 'owner' || role === 'admin') {
    // Activity Log goes after Objects (or after Contacts if no Objects)
    const insertIndex = items.findIndex(item => item.name === 'Objects') !== -1 ? 4 : 3
    items.splice(insertIndex, 0, { name: 'Activity Log', href: '/dashboard/activity-log', icon: History, children: undefined })
  }

  if (role === 'owner') {
    items.push({ name: 'Deleted Contacts', href: '/dashboard/contacts/deleted', icon: Trash2, children: undefined })
  }

  // Show Users link in Settings only for admin and owner roles
  const settingsItem = items.find(item => item.name === 'Settings')
  if (settingsItem && settingsItem.children) {
    const usersChild = settingsItem.children.find(child => child.name === 'Users')
    if (usersChild) {
      // Only show Users link for admin and owner
      usersChild.visible = role === 'owner' || role === 'admin'
    }

    // Show Email Profiles link in Settings only for owner role
    const emailProfilesChild = settingsItem.children.find(child => child.name === 'Email Profiles')
    if (emailProfilesChild) {
      // Only show Email Profiles link for owner
      emailProfilesChild.visible = role === 'owner'
    }

    // Filter out hidden children
    settingsItem.children = settingsItem.children.filter(child => child.visible !== false)
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // On mobile, start collapsed
      if (mobile && isCollapsed === false) {
        setIsCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const toggleExpanded = (itemName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isCollapsed) {
      setExpandedItems(prev =>
        prev.includes(itemName)
          ? prev.filter(name => name !== itemName)
          : [...prev, itemName]
      )
    }
  }

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed)
    // When collapsing, close all expanded items
    if (!isCollapsed) {
      setExpandedItems([])
    }
  }

  const handleNavClick = () => {
    // On mobile, close the sidebar overlay when navigating
    if (isMobile && isOpen && onClose) {
      onClose()
    }
  }

  return (
    <TooltipProvider>
      <>
        {/* Mobile Overlay - only show when sidebar is open on mobile */}
        {isMobile && isOpen && !isCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Sidebar */}
        <div className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex h-full flex-col border-r border-senova-gray-300 bg-white pt-16 shadow-sm transition-all duration-300",
          // Width classes
          isCollapsed ? "w-16" : "w-64",
          // Mobile visibility
          isMobile ? (
            isOpen ? "translate-x-0" : "-translate-x-full"
          ) : "translate-x-0"
        )}>
          {/* Toggle Button - Always visible */}
          <div className={cn(
            "absolute -right-3 top-20 z-50",
            isMobile && !isOpen && "hidden"
          )}>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCollapsed}
              className="h-6 w-6 rounded-full border-senova-gray-300 bg-white shadow-md hover:bg-senova-sky-50"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3 text-senova-gray-700" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-senova-gray-700" />
              )}
            </Button>
          </div>

          {/* Header */}
          <div className={cn(
            "p-6 transition-all duration-300",
            isCollapsed && "p-3"
          )}>
            {isCollapsed ? (
              <div className="flex justify-center">
                <span className="text-2xl font-bold text-senova-primary">S</span>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-senova-primary">Senova CRM</h1>
                <p className="text-sm text-senova-gray-500">Business Management Platform</p>
              </>
            )}
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
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                // On collapsed mode, clicking expands sidebar first
                                if (isCollapsed) {
                                  setIsCollapsed(false)
                                  setExpandedItems([item.name])
                                }
                              }}
                              className={cn(
                                'w-full flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200',
                                isActive || isChildActive
                                  ? 'bg-senova-sky-500 text-white shadow-md'
                                  : 'text-senova-gray-700 hover:bg-senova-sky-50 hover:text-senova-sky-700'
                              )}
                            >
                              <item.icon className={cn("h-5 w-5", isActive || isChildActive ? "" : "text-senova-sky-500")} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
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
                      )}
                    </div>
                  ) : (
                    isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={handleNavClick}
                            className={cn(
                              'flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-senova-sky-500 text-white shadow-md'
                                : 'text-senova-gray-700 hover:bg-senova-sky-50 hover:text-senova-sky-700'
                            )}
                          >
                            <item.icon className={cn("h-5 w-5", isActive ? "" : "text-senova-sky-500")} />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-senova-sky-500 text-white shadow-md border-l-4 border-senova-primary'
                            : 'text-senova-gray-700 hover:bg-senova-sky-50 hover:text-senova-sky-700 hover:translate-x-1'
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "" : "text-senova-sky-500")} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  )}

                  {/* Children items - only show when not collapsed */}
                  {item.children && isExpanded && !isCollapsed && (
                    <div className="ml-6 space-y-1 animate-fade-in-up">
                      {item.children.map((child) => {
                        const isChildItemActive = pathname === child.href
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={handleNavClick}
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
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full border-senova-primary text-senova-primary hover:bg-senova-primary hover:text-white transition-all duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start border-senova-primary text-senova-primary hover:bg-senova-primary hover:text-white transition-all duration-200"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </>
    </TooltipProvider>
  )
}