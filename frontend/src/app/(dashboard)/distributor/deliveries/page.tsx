'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone,
  Navigation,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

type DeliveryStatus = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'picked_up' | 'in_transit' | 'delivered';

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
  updatedAt?: string;
}

interface Order {
  _id: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
    farmerName?: string;
  }>;
  shippingAddress?: string;
}

export default function DistributorDeliveriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus>('all');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<{ [key: string]: Order }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchDeliveries(currentUser.id);

    // Listen for real-time updates via Socket.io
    const handleNotification = (notification: any) => {
      if (notification.type === 'delivery' || notification.type === 'order') {
        fetchDeliveries(currentUser.id);
      }
    };

    socketClient.onNotification(handleNotification);

    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router]);

  const fetchDeliveries = async (distributorId: string) => {
    try {
      setIsLoading(true);
      // Fetch all deliveries for this distributor (we'll filter active ones client-side)
      const deliveriesResponse: any = await apiClient.getDeliveries({ 
        distributorId, 
        limit: '100' 
      });
      let deliveriesList = deliveriesResponse.success ? deliveriesResponse.deliveries || [] : [];
      
      // Filter to show active deliveries (picked_up, in_transit) by default
      // But keep all for filtering options
      
      // Fetch orders for each delivery
      const ordersMap: { [key: string]: Order } = {};
      for (const delivery of deliveriesList) {
        try {
          const orderResponse: any = await apiClient.getOrder(delivery.orderId);
          if (orderResponse.success && orderResponse.order) {
            ordersMap[delivery.orderId] = orderResponse.order;
          }
        } catch (err) {
          // Skip if order not found
        }
      }
      
      setDeliveries(deliveriesList);
      setOrders(ordersMap);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const order = orders[delivery.orderId];
    const matchesSearch =
      delivery._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delivery.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (delivery.vehicleId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order?.items?.[0]?.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'in_progress') {
      matchesStatus = delivery.status === 'picked_up' || delivery.status === 'in_transit';
    } else if (statusFilter === 'completed') {
      matchesStatus = delivery.status === 'delivered';
    } else {
      matchesStatus = delivery.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: deliveries.length,
    scheduled: deliveries.filter(d => d.status === 'scheduled').length,
    in_progress: deliveries.filter(d => d.status === 'picked_up' || d.status === 'in_transit').length,
    completed: deliveries.filter(d => d.status === 'delivered').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'picked_up':
      case 'in_transit':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">In Progress</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStopStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Deliveries</h1>
        <p className="text-gray-600 mt-1">Monitor and manage ongoing delivery routes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.scheduled}</div>
            <p className="text-xs text-gray-500 mt-1">Ready to start</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.in_progress}</div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Stops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {deliveries.length * 2}
            </div>
            <p className="text-xs text-gray-500 mt-1">All routes today</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by delivery ID, route, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as DeliveryStatus)}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({statusCounts.scheduled})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-12 w-12 text-gray-300 mx-auto mb-3 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900">Loading deliveries...</h3>
              </CardContent>
            </Card>
          ) : filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No deliveries found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredDeliveries.map((delivery) => {
              const order = orders[delivery.orderId];
              const isInProgress = delivery.status === 'picked_up' || delivery.status === 'in_transit';
              const isCompleted = delivery.status === 'delivered';
              
              // Calculate progress
              let progress = 0;
              if (isCompleted) {
                progress = 100;
              } else if (isInProgress) {
                progress = 50;
              }
              
              // Get stops (pickup and delivery)
              const stops = [
                {
                  name: order?.items?.[0]?.farmerName || 'Farm',
                  type: 'pickup',
                  status: delivery.status === 'delivered' || isInProgress ? 'completed' : 'pending',
                  time: delivery.route?.pickup?.scheduledTime
                    ? new Date(delivery.route.pickup.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : 'TBD',
                },
                {
                  name: order?.shippingAddress?.split(',')[0] || 'Restaurant',
                  type: 'delivery',
                  status: isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'pending',
                  time: delivery.route?.delivery?.scheduledTime
                    ? new Date(delivery.route.delivery.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : 'TBD',
                },
              ];
              
              return (
              <Card key={delivery._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">DEL-{delivery._id.slice(-6)}</h3>
                          {getStatusBadge(delivery.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Order {delivery.orderId.slice(-6)}</p>
                      </div>
                      {delivery.status === 'scheduled' && (
                        <Button>
                          <Play className="h-4 w-4 mr-2" />
                          Start Route
                        </Button>
                      )}
                      {isInProgress && (
                        <Button variant="outline">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Route
                        </Button>
                      )}
                    </div>

                    {/* Driver & Vehicle Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="h-4 w-4" />
                        <span>Driver: {delivery.driverName || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Navigation className="h-4 w-4" />
                        <span>Vehicle: {delivery.vehicleId || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {new Date(delivery.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-gray-500">Pickup Time</p>
                        <p className="font-medium text-gray-900">
                          {delivery.route?.pickup?.scheduledTime
                            ? new Date(delivery.route.pickup.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : 'TBD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">
                          {isCompleted ? 'Delivered At' : 'Est. Delivery'}
                        </p>
                        <p className="font-medium text-gray-900">
                          {isCompleted && delivery.route?.delivery?.actualTime
                            ? new Date(delivery.route.delivery.actualTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : delivery.route?.delivery?.scheduledTime
                            ? new Date(delivery.route.delivery.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : 'TBD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stops Progress</p>
                        <p className="font-medium text-gray-900">
                          {isCompleted ? '2' : isInProgress ? '1' : '0'} / 2 completed
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {delivery.status !== 'scheduled' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Route Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Stops List */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Stops (2)
                      </h4>
                      <div className="space-y-2">
                        {stops.map((stop, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              stop.status === 'in_progress'
                                ? 'bg-orange-50 border-orange-200'
                                : stop.status === 'completed'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {getStopStatusIcon(stop.status)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {idx + 1}. {stop.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      stop.type === 'pickup'
                                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                                        : 'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}
                                  >
                                    {stop.type === 'pickup' ? 'Pickup' : 'Delivery'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500">{stop.time}</p>
                              </div>
                            </div>
                            {stop.status === 'in_progress' && (
                              <Button size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Stop
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Driver
                      </Button>
                      {delivery.status === 'completed' && (
                        <Button variant="outline" size="sm" className="flex-1">
                          <Package className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
