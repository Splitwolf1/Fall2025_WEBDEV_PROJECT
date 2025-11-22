'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Truck,
  MapPin,
  Search,
  ClipboardCheck,
  Calendar,
  FileText,
  AlertTriangle,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface SidebarProps {
  userRole: 'farmer' | 'restaurant' | 'distributor' | 'inspector';
  isCollapsed?: boolean;
}

const navigationConfig: Record<string, NavItem[]> = {
  farmer: [
    { label: 'Dashboard', href: '/farmer', icon: LayoutDashboard },
    { label: 'Inventory', href: '/farmer/inventory', icon: Package },
    { label: 'Orders', href: '/farmer/orders', icon: ShoppingCart, badge: '8' },
    { label: 'Deliveries', href: '/farmer/deliveries', icon: Truck },
    { label: 'Analytics', href: '/farmer/analytics', icon: TrendingUp },
    { label: 'Customers', href: '/farmer/customers', icon: Users },
  ],
  restaurant: [
    { label: 'Dashboard', href: '/restaurant', icon: LayoutDashboard },
    { label: 'Browse Products', href: '/restaurant/browse', icon: Search },
    { label: 'My Orders', href: '/restaurant/orders', icon: ShoppingCart, badge: '5' },
    { label: 'Track Delivery', href: '/restaurant/tracking', icon: MapPin },
    { label: 'Suppliers', href: '/restaurant/suppliers', icon: Heart },
    { label: 'Chat Support', href: '/restaurant/chat', icon: MessageSquare },
  ],
  distributor: [
    { label: 'Dashboard', href: '/distributor', icon: LayoutDashboard },
    { label: 'Available Deliveries', href: '/distributor/routes', icon: MapPin, badge: '8' },
    { label: 'Deliveries', href: '/distributor/deliveries', icon: Truck },
    { label: 'Fleet Management', href: '/distributor/fleet', icon: Package },
    { label: 'Schedule', href: '/distributor/schedule', icon: Calendar },
    { label: 'Performance', href: '/distributor/performance', icon: TrendingUp },
  ],
  inspector: [
    { label: 'Dashboard', href: '/inspector', icon: LayoutDashboard },
    { label: 'Inspections', href: '/inspector/inspections', icon: ClipboardCheck, badge: '6' },
    { label: 'Schedule', href: '/inspector/schedule', icon: Calendar },
    { label: 'Reports', href: '/inspector/reports', icon: FileText },
    { label: 'Violations', href: '/inspector/violations', icon: AlertTriangle, badge: '3' },
    { label: 'Compliance', href: '/inspector/compliance', icon: TrendingUp },
  ],
};

export default function Sidebar({ userRole, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navigationConfig[userRole] || [];

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 relative',
                    isActive && 'bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-green-700')} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 px-2 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
