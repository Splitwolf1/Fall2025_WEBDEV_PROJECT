'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Truck,
  Clock,
  Navigation,
  Plus,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

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

interface Route {
  id: string;
  name: string;
  driver: string;
  vehicle: string;
  status: string;
  startTime: string;
  estimatedEnd: string;
  totalDistance: string;
  totalStops: number;
  completedStops: number;
  stops: Array<{
    id: number;
    type: string;
    name: string;
    address: string;
    time: string;
    status: string;
    items: string[];
    notes?: string;
  }>;
}

export default function RoutesPage() {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchRoutes(currentUser.id);

    // Listen for real-time updates
    const handleNotification = (notification: any) => {
      if (notification.type === 'delivery' || notification.type === 'order') {
        fetchRoutes(currentUser.id);
      }
    };

    socketClient.onNotification(handleNotification);

    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router]);

  const fetchRoutes = async (distributorId: string) => {
    try {
      setIsLoading(true);
      const deliveriesResponse: any = await apiClient.getDeliveries({ distributorId, limit: '100' });
      const deliveries = deliveriesResponse.success ? deliveriesResponse.deliveries || [] : [];

      // Group deliveries by driver/vehicle to create routes
      const routesMap: { [key: string]: Delivery[] } = {};
      deliveries.forEach((delivery: Delivery) => {
        const key = `${delivery.driverName || 'Unassigned'}-${delivery.vehicleId || 'N/A'}`;
        if (!routesMap[key]) {
          routesMap[key] = [];
        }
        routesMap[key].push(delivery);
      });

      // Convert to routes format
      const routesList: Route[] = await Promise.all(
        Object.entries(routesMap).map(async ([key, routeDeliveries], idx) => {
          const firstDelivery = routeDeliveries[0];
          const routeId = `ROUTE-${firstDelivery._id.slice(-3)}`;
          
          // Fetch order details for stops
          const stops: Route['stops'] = [];
          for (const delivery of routeDeliveries) {
            try {
              const orderResponse: any = await apiClient.getOrder(delivery.orderId);
              if (orderResponse.success && orderResponse.order) {
                const order = orderResponse.order;
                // Pickup stop
                stops.push({
                  id: stops.length + 1,
                  type: 'pickup',
                  name: order.items?.[0]?.farmerName || 'Farm',
                  address: delivery.route?.pickup?.location?.address || 'Address not available',
                  time: delivery.route?.pickup?.scheduledTime
                    ? `${new Date(delivery.route.pickup.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${new Date(new Date(delivery.route.pickup.scheduledTime).getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                    : 'TBD',
                  status: delivery.status === 'delivered' || delivery.status === 'picked_up' || delivery.status === 'in_transit' ? 'completed' : 'pending',
                  items: order.items?.map((item: any) => `${item.productName} (${item.quantity} ${item.unit})`) || [],
                });
                // Delivery stop
                stops.push({
                  id: stops.length + 2,
                  type: 'delivery',
                  name: order.shippingAddress?.split(',')[0] || 'Restaurant',
                  address: delivery.route?.delivery?.location?.address || order.shippingAddress || 'Address not available',
                  time: delivery.route?.delivery?.scheduledTime
                    ? `${new Date(delivery.route.delivery.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${new Date(new Date(delivery.route.delivery.scheduledTime).getTime() + 15 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                    : 'TBD',
                  status: delivery.status === 'delivered' ? 'completed' : delivery.status === 'in_transit' ? 'in_progress' : 'pending',
                  items: order.items?.map((item: any) => `${item.productName} (${item.quantity} ${item.unit})`) || [],
                });
              }
            } catch (err) {
              // Skip if order not found
            }
          }

          const completedStops = stops.filter(s => s.status === 'completed').length;
          const hasInProgress = routeDeliveries.some(d => d.status === 'picked_up' || d.status === 'in_transit');
          const allCompleted = routeDeliveries.every(d => d.status === 'delivered');

          return {
            id: routeId,
            name: `${firstDelivery.driverName || 'Unassigned'} Route`,
            driver: firstDelivery.driverName || 'Unassigned',
            vehicle: firstDelivery.vehicleId || 'N/A',
            status: allCompleted ? 'completed' : hasInProgress ? 'in_progress' : 'scheduled',
            startTime: firstDelivery.route?.pickup?.scheduledTime
              ? new Date(firstDelivery.route.pickup.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : 'TBD',
            estimatedEnd: routeDeliveries[routeDeliveries.length - 1]?.route?.delivery?.scheduledTime
              ? new Date(routeDeliveries[routeDeliveries.length - 1].route.delivery.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : 'TBD',
            totalDistance: 'N/A', // Would need route calculation
            totalStops: stops.length,
            completedStops,
            stops,
          };
        })
      );

      setRoutes(routesList);
      if (routesList.length > 0 && !selectedRoute) {
        setSelectedRoute(routesList[0].id);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoute = routes.find(r => r.id === selectedRoute) || routes[0] || null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'pending':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStopIcon = (type: string) => {
    return type === 'pickup' ? (
      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
        <MapPin className="h-4 w-4 text-green-600" />
      </div>
    ) : (
      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
        <MapPin className="h-4 w-4 text-blue-600" />
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Route Planning</h1>
            <p className="text-gray-500 mt-1">Manage delivery routes and optimize schedules</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Plan New Route
          </Button>
        </div>

        {/* Route Selector */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading routes...</span>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No routes available</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select Route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} - {route.driver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentRoute && (
                  <Badge className={getStatusColor(currentRoute.status)} variant="secondary">
                    {currentRoute.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!currentRoute ? (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No route selected</h3>
              <p className="text-gray-500 mt-1">Select a route from the dropdown above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Route Overview */}
            <div className="lg:col-span-1 space-y-6">
              {/* Route Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Route Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Driver</span>
                  </div>
                  <span className="font-medium">{currentRoute.driver}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Vehicle</span>
                  </div>
                  <span className="font-medium">{currentRoute.vehicle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Start Time</span>
                  </div>
                  <span className="font-medium">{currentRoute.startTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Est. End</span>
                  </div>
                  <span className="font-medium">{currentRoute.estimatedEnd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Distance</span>
                  </div>
                  <span className="font-medium">{currentRoute.totalDistance}</span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {currentRoute.completedStops}/{currentRoute.totalStops} stops
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{
                        width: `${(currentRoute.completedStops / currentRoute.totalStops) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {currentRoute.status === 'in_progress' ? (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Pause className="h-3 w-3" />
                      Pause
                    </Button>
                    <Button size="sm" className="flex-1 gap-1">
                      <Navigation className="h-3 w-3" />
                      Navigate
                    </Button>
                  </div>
                ) : currentRoute.status === 'scheduled' ? (
                  <Button className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Start Route
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {/* Map Preview */}
            <Card>
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Route Map</p>
                    <p className="text-xs text-gray-500 mt-1">{currentRoute.totalDistance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stop List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Route Stops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentRoute.stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className={`border rounded-lg p-4 ${
                        stop.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : stop.status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            {getStopIcon(stop.type)}
                            {stop.status === 'completed' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          {index < currentRoute.stops.length - 1 && (
                            <div
                              className={`w-0.5 h-16 mt-2 ${
                                stop.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">
                                  Stop #{stop.id}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={
                                    stop.type === 'pickup'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {stop.type}
                                </Badge>
                                <Badge className={getStatusColor(stop.status)}>
                                  {stop.status}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-gray-900 mt-1">{stop.name}</h4>
                              <p className="text-sm text-gray-500">{stop.address}</p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{stop.time}</span>
                            </div>

                            {stop.notes && (
                              <div className="flex items-start gap-2 text-gray-600">
                                <AlertCircle className="h-4 w-4 mt-0.5" />
                                <span className="italic">{stop.notes}</span>
                              </div>
                            )}

                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500 mb-1">Items:</p>
                              <ul className="text-sm space-y-1">
                                {stop.items.map((item, i) => (
                                  <li key={i} className="text-gray-700">
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {stop.status === 'in_progress' && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Mark Complete
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Navigation className="h-3 w-3" />
                                Navigate
                              </Button>
                            </div>
                          )}

                          {stop.status === 'pending' && currentRoute.status === 'in_progress' && (
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" className="gap-1">
                                <Navigation className="h-3 w-3" />
                                Get Directions
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
