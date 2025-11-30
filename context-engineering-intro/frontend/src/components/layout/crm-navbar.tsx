'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Inbox, Users, Settings, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function CRMNavbar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo/Branding - Links to website home */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="text-2xl font-bold text-primary">Eve</div>
          <div className="text-sm text-muted-foreground">CRM</div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user?.first_name || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
