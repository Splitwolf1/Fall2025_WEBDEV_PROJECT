'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  Package,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Navigation,
  DollarSign,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface Delivery {
  _id: string;
  distributorId: string;
  orderId: string;
  status: string;
  route: {
    pickup: {
      location: any;
      scheduledTime: string;
      actualTime?: string;
    };
    delivery: {
      location: any;
      scheduledTime: string;
      actualTime?: string;
    };
  };
  driverName?: string;
  vehicleId?: string;
  createdAt: string;
}

interface Order {
  _id: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
  }>;
  totalAmount: number;
}

export default function DistributorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    activeDeliveries: { value: '0', status: '0 in progress' },
    completedToday: { value: '0', onTime: '0 on-time' },
    totalRevenue: { value: '$0', change: '0%' },
    avgDeliveryTime: { value: '0 min', status: 'N/A' },
  });
  const [activeRoutes, setActiveRoutes] = useState<any[]>([]);
  const [upcomingPickups, setUpcomingPickups] = useState<any[]>([]);
  const [fleetStatus, setFleetStatus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchDashboardData(currentUser.id);
  }, [router]);

  const fetchDashboardData = async (distributorId: string) => {
    try {
      setIsLoading(true);

      // Fetch user profile
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
      }

      // Fetch deliveries
      const deliveriesResponse: any = await apiClient.getDeliveries({ distributorId, limit: '50' });
      const deliveries = deliveriesResponse.success ? deliveriesResponse.deliveries || [] : [];

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Filter active deliveries
      const activeDeliveriesList = deliveries.filter(
        (d: Delivery) => d.status === 'scheduled' || d.status === 'picked_up' || d.status === 'in_transit'
      );

      const inProgressDeliveries = deliveries.filter(
        (d: Delivery) => d.status === 'picked_up' || d.status === 'in_transit'
      );

      // Filter today's completed deliveries
      const todayCompleted = deliveries.filter((d: Delivery) => {
        if (d.status !== 'delivered') return false;
        const deliveredDate = d.route?.delivery?.actualTime 
          ? new Date(d.route.delivery.actualTime)
          : new Date(d.createdAt);
        return deliveredDate >= today && deliveredDate <= todayEnd;
      });

      // Calculate on-time deliveries (would need scheduled vs actual time comparison)
      const onTimeDeliveries = todayCompleted.filter((d: Delivery) => {
        // Simplified - would need actual comparison logic
        return true; // Placeholder
      });

      // Calculate today's revenue from completed deliveries
      const todayRevenue = todayCompleted.reduce((sum: number, d: Delivery) => {
        // Would need to fetch order details for accurate revenue
        return sum + 0; // Placeholder
      }, 0);

      // Format active routes
      const formattedRoutes = activeDeliveriesList.slice(0, 3).map((delivery: Delivery) => {
        // Fetch order details to get items
        // For now, using placeholder data
        const items = ['Items loading...'];
        
        return {
          id: `ROUTE-${delivery._id.slice(-3)}`,
          driver: delivery.driverName || 'Unassigned',
          vehicle: delivery.vehicleId || 'N/A',
          stops: 1, // Would need route details
          completed: delivery.status === 'delivered' ? 1 : 0,
          currentStop: 'Loading...', // Would need current location
          eta: 'TBD',
          status: delivery.status === 'in_transit' ? 'on_time' : 
                  delivery.status === 'picked_up' ? 'picking_up' : 'scheduled',
          pickupTime: delivery.route?.pickup?.scheduledTime 
            ? new Date(delivery.route.pickup.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : 'TBD',
          items,
          deliveryId: delivery._id,
        };
      });

      // Get upcoming pickups (scheduled deliveries)
      const upcomingDeliveries = deliveries
        .filter((d: Delivery) => d.status === 'scheduled')
        .sort((a: Delivery, b: Delivery) => 
          new Date(a.route?.pickup?.scheduledTime || a.createdAt).getTime() - 
          new Date(b.route?.pickup?.scheduledTime || b.createdAt).getTime()
        )
        .slice(0, 3)
        .map((delivery: Delivery) => {
          const pickupTime = delivery.route?.pickup?.scheduledTime
            ? new Date(delivery.route.pickup.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : 'TBD';
          
          return {
            id: `PICKUP-${delivery._id.slice(-3)}`,
            farm: 'Loading...', // Would need to fetch order -> farmer details
            time: pickupTime,
            items: 'Loading items...', // Would need order details
            destination: 'Loading...', // Would need delivery address
            priority: 'normal',
            deliveryId: delivery._id,
          };
        });

      // Fleet status (simplified - would need fleet management system)
      const uniqueVehicles = new Set<string>();
      deliveries.forEach((d: Delivery) => {
        if (d.vehicleId) uniqueVehicles.add(d.vehicleId);
      });

      const fleetStatusList = Array.from(uniqueVehicles).slice(0, 5).map((vehicleId, idx) => ({
        vehicle: vehicleId,
        driver: deliveries.find((d: Delivery) => d.vehicleId === vehicleId)?.driverName || null,
        status: deliveries.some((d: Delivery) => d.vehicleId === vehicleId && (d.status === 'picked_up' || d.status === 'in_transit'))
          ? 'active'
          : 'available',
        condition: 'good', // Would need fleet management data
        fuel: 'N/A', // Would need fleet management data
      }));

      setStats({
        activeDeliveries: {
          value: activeDeliveriesList.length.toString(),
          status: `${inProgressDeliveries.length} in progress`,
        },
        completedToday: {
          value: todayCompleted.length.toString(),
          onTime: `${onTimeDeliveries.length} on-time`,
        },
        totalRevenue: {
          value: `$${todayRevenue.toFixed(2)}`,
          change: '0%', // Would need previous day comparison
        },
        avgDeliveryTime: {
          value: 'N/A', // Would need delivery time calculation
          status: 'N/A',
        },
      });

      setActiveRoutes(formattedRoutes);
      setUpcomingPickups(upcomingDeliveries);
      setFleetStatus(fleetStatusList.length > 0 ? fleetStatusList : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'picking_up':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'delayed':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'On Time';
      case 'picking_up':
        return 'Picking Up';
      case 'delayed':
        return 'Delayed';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high'
      ? 'bg-red-100 text-red-800 hover:bg-red-100'
      : 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good':
        return 'text-green-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Deliveries
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeDeliveries.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.activeDeliveries.status}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Completed Today
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedToday.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.completedToday.onTime}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Today's Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue.value}</div>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  {stats.totalRevenue.change} vs yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Delivery Time
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgDeliveryTime.value}</div>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  {stats.avgDeliveryTime.status}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Routes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Routes</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeRoutes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active routes</p>
                ) : (
                  activeRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900">{route.id}</p>
                          <Badge className={getStatusColor(route.status)}>
                            {getStatusText(route.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>{route.driver} • {route.vehicle}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Pickup: {route.pickupTime}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Current: {route.currentStop}</span>
                            <span className="text-gray-400">•</span>
                            <span>ETA: {route.eta}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Items: {route.items.join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Stops Completed</span>
                        <span>{route.completed} of {route.stops}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${(route.completed / route.stops) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => router.push(`/distributor/tracking?deliveryId=${route.deliveryId}`)}
                      >
                        <MapPin className="h-3 w-3" />
                        Track Route
                      </Button>
                      <Button variant="outline" size="sm">
                        Contact Driver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/distributor/deliveries`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Pickups & Fleet Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Pickups */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Pickups</CardTitle>
                <Button variant="ghost" size="sm">
                  Schedule
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingPickups.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No upcoming pickups scheduled</p>
                  ) : (
                    upcomingPickups.map((pickup) => (
                    <div
                      key={pickup.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{pickup.farm}</p>
                            {pickup.priority === 'high' && (
                              <Badge className={getPriorityColor(pickup.priority)}>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                High Priority
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{pickup.time}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{pickup.items}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Deliver to: {pickup.destination}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={() => router.push(`/distributor/schedule`)}
                      >
                        Assign Driver
                      </Button>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fleet Status */}
            <Card>
              <CardHeader>
                <CardTitle>Fleet Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fleetStatus.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No fleet data available</p>
                  ) : (
                    fleetStatus.map((vehicle) => (
                    <div
                      key={vehicle.vehicle}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vehicle.vehicle}</p>
                          <p className="text-sm text-gray-500">
                            {vehicle.driver || 'No driver assigned'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={getVehicleStatusColor(vehicle.status)}
                            >
                              {vehicle.status}
                            </Badge>
                            <span className={`text-xs font-medium ${getConditionColor(vehicle.condition)}`}>
                              {vehicle.condition}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Fuel: {vehicle.fuel}
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Navigation className="h-6 w-6" />
                  <span>Plan Route</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span>View Orders</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Truck className="h-6 w-6" />
                  <span>Manage Fleet</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <CheckCircle className="h-6 w-6" />
                  <span>Delivery History</span>
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
