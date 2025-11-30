'use client'

import Link from 'next/link'
import { User, LogOut, Settings, Menu } from 'lucide-react'
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

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-senova-gray-300 bg-white flex items-center justify-between px-6 shadow-sm animate-fade-in-up">
      {/* Mobile Menu Button + Logo */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-senova-sky-50"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5 text-senova-gray-700" />
        </Button>
        {/* Logo/Branding - Links to website home */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 hover:scale-105">
          <div className="text-xl font-bold text-senova-primary">Senova</div>
          <div className="text-xs text-senova-primary-light bg-senova-primary px-2 py-0.5 rounded-full">CRM</div>
        </Link>
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-senova-sky-50 transition-all duration-200">
            <div className="h-8 w-8 rounded-full bg-senova-sky-100 flex items-center justify-center">
              <User className="h-4 w-4 text-senova-sky-600" />
            </div>
            <span className="text-sm text-senova-gray-700 font-medium">{user?.first_name || 'User'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-senova-gray-300 shadow-lg animate-fade-in-up">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-senova-gray-900">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-xs text-senova-gray-500">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-senova-gray-300" />
          <DropdownMenuItem asChild className="hover:bg-senova-sky-50">
            <Link href="/dashboard/settings" className="cursor-pointer text-senova-gray-700">
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-senova-gray-300" />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-senova-warning hover:bg-red-50">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
