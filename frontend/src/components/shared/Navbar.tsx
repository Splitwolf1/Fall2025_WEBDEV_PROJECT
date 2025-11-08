'use client';

import { Search, Settings, User, LogOut, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import NotificationDropdown from './NotificationDropdown';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

interface NavbarProps {
  userRole: 'farmer' | 'restaurant' | 'distributor' | 'inspector';
  userName: string;
}

export default function Navbar({ userRole, userName }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'farmer':
        return '🌾';
      case 'restaurant':
        return '🍽️';
      case 'distributor':
        return '🚚';
      case 'inspector':
        return '🔍';
      default:
        return '👤';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-6 flex-1">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              <span className="hidden sm:block text-xl font-bold text-green-700">
                Farm-to-Table
              </span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* Search (Mobile) */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Chatbot */}
            <Button variant="ghost" size="icon" className="relative">
              <MessageSquare className="h-5 w-5" />
            </Button>

            {/* Real-Time Notifications */}
            <NotificationDropdown />

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={userName} />
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {getRoleEmoji(userRole)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel(userRole)}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/${userRole}/profile`)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/${userRole}/settings`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
