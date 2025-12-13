'use client';

import { useState, useEffect } from 'react';
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
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';
import { auth } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarProps {
  userRole: 'farmer' | 'restaurant' | 'distributor' | 'inspector';
  isCollapsed?: boolean;
}

const navigationConfig: Record<string, NavItem[]> = {
  farmer: [
    { label: 'Dashboard', href: '/farmer', icon: LayoutDashboard },
    { label: 'Inventory', href: '/farmer/inventory', icon: Package },
    { label: 'Orders', href: '/farmer/orders', icon: ShoppingCart },
    { label: 'Deliveries', href: '/farmer/deliveries', icon: Truck },
    { label: 'Analytics', href: '/farmer/analytics', icon: TrendingUp },
    { label: 'Customers', href: '/farmer/customers', icon: Users },
  ],
  restaurant: [
    { label: 'Dashboard', href: '/restaurant', icon: LayoutDashboard },
    { label: 'Browse Products', href: '/restaurant/browse', icon: Search },
    { label: 'My Orders', href: '/restaurant/orders', icon: ShoppingCart },
    { label: 'Track Delivery', href: '/restaurant/tracking', icon: MapPin },
    { label: 'Suppliers', href: '/restaurant/suppliers', icon: Heart },
    { label: 'Chat Support', href: '/restaurant/chat', icon: MessageSquare },
  ],
  distributor: [
    { label: 'Dashboard', href: '/distributor', icon: LayoutDashboard },
    { label: 'Available Deliveries', href: '/distributor/routes', icon: MapPin },
    { label: 'Deliveries', href: '/distributor/deliveries', icon: Truck },
    { label: 'Fleet Management', href: '/distributor/fleet', icon: Package },
    { label: 'Schedule', href: '/distributor/schedule', icon: Calendar },
    { label: 'Performance', href: '/distributor/performance', icon: TrendingUp },
  ],
  inspector: [
    { label: 'Dashboard', href: '/inspector', icon: LayoutDashboard },
    { label: 'Inspections', href: '/inspector/inspections', icon: ClipboardCheck },
    { label: 'Schedule', href: '/inspector/schedule', icon: Calendar },
    { label: 'Reports', href: '/inspector/reports', icon: FileText },
    { label: 'Violations', href: '/inspector/violations', icon: AlertTriangle },
    { label: 'Compliance', href: '/inspector/compliance', icon: TrendingUp },
  ],
};

export default function Sidebar({ userRole, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, string>>({});

  const navItems = navigationConfig[userRole] || [];

  useEffect(() => {
    const fetchBadges = async () => {
      const user = auth.getCurrentUser();
      if (!user) return;

      try {
        const counts: Record<string, string> = {};

        if (userRole === 'farmer') {
          // Pending orders count
          const res: any = await apiClient.getOrders({ farmerId: user.id, status: 'pending', limit: 1 });
          if (res.success && res.pagination?.total > 0) {
            counts['/farmer/orders'] = res.pagination.total.toString();
          }
        } else if (userRole === 'restaurant') {
          // Active orders count (confirmed, preparing, or in_transit)
          // We'll fetch all active and count them on client since API might not support multiple statuses easily in one go
          // Or just fetch 'active' logic if backend supports it. For now let's query 'active' status if supported?
          // Actually, let's just count 'in_transit' as it's the most urgent
          const res: any = await apiClient.getOrders({ customerId: user.id, status: 'in_transit', limit: 1 });
          if (res.success && res.pagination?.total > 0) {
            counts['/restaurant/orders'] = res.pagination.total.toString();
          }
        } else if (userRole === 'distributor') {
          // Available deliveries (ready_for_pickup)
          const res: any = await apiClient.getDeliveries({ status: 'ready_for_pickup', limit: 1 });
          if (res.success && res.pagination?.total > 0) {
            counts['/distributor/routes'] = res.pagination.total.toString();
          }
        } else if (userRole === 'inspector') {
          // Scheduled inspections
          const res: any = await apiClient.getInspections({ inspectorId: user.id, result: 'pending', limit: 1 });
          if (res.success && res.pagination?.total > 0) {
            counts['/inspector/inspections'] = res.pagination.total.toString();
          }
        }

        setBadgeCounts(counts);
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    fetchBadges();

    // Set up real-time listener
    const handleNotification = () => {
      fetchBadges();
    };

    socketClient.onNotification(handleNotification);

    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [userRole]);

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
            const badge = badgeCounts[item.href];

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
                      {badge && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 px-2 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && badge && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {badge}
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
