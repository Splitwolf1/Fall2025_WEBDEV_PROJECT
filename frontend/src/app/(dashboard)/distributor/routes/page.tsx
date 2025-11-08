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
  Package,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

interface Delivery {
  _id: string;
  distributorId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  route: {
    pickup: {
      farmId: string;
      farmName: string;
      location: { lat: number; lng: number };
      address: string;
      scheduledTime: string;
      actualTime?: string;
    };
    delivery: {
      restaurantId: string;
      restaurantName: string;
      location: { lat: number; lng: number };
      address: string;
      scheduledTime: string;
      actualTime?: string;
    };
  };
  driverName?: string;
  vehicleInfo?: {
    type: string;
    plateNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  totalAmount: number;
  customerName?: string;
}

export default function AvailableDeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<{ [key: string]: Order }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingDelivery, setAcceptingDelivery] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchAvailableDeliveries();

    // Listen for real-time updates
    const handleNotification = (notification: any) => {
      if (notification.type === 'delivery' || notification.type === 'order') {
        fetchAvailableDeliveries();
      }
    };

    socketClient.onNotification(handleNotification);

    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router]);

  const fetchAvailableDeliveries = async () => {
    try {
      setIsLoading(true);
      // Fetch ALL deliveries that are ready for pickup (pickup_pending)
      // Don't filter by distributorId - these are available for any distributor to accept
      const deliveriesResponse: any = await apiClient.getDeliveries({ 
        status: 'pickup_pending',
        limit: '100' 
      });
      
      let deliveriesList = deliveriesResponse.success ? deliveriesResponse.deliveries || [] : [];
      
      console.log(`[Available Deliveries] Found ${deliveriesList.length} pickup_pending deliveries`);
      
      // If no pickup_pending, also check scheduled deliveries (fallback)
      if (deliveriesList.length === 0) {
        const scheduledResponse: any = await apiClient.getDeliveries({ 
          status: 'scheduled',
          limit: '100' 
        });
        deliveriesList = scheduledResponse.success ? scheduledResponse.deliveries || [] : [];
        console.log(`[Available Deliveries] Found ${deliveriesList.length} scheduled deliveries (fallback)`);
      }

      // Fetch order details for each delivery
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
      console.error('Error fetching available deliveries:', error);
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      setAcceptingDelivery(deliveryId);
      
      // Update delivery status to picked_up (driver accepts and goes to pickup)
      const response: any = await apiClient.updateDeliveryStatus(deliveryId, 'picked_up', 'Driver accepted delivery');
      
      if (response.success) {
        // Remove from available deliveries
        setDeliveries(prev => prev.filter(d => d._id !== deliveryId));
        // Navigate to active deliveries
        router.push('/distributor/deliveries');
      } else {
        alert('Failed to accept delivery. Please try again.');
      }
    } catch (error: any) {
      console.error('Error accepting delivery:', error);
      alert(error.message || 'Failed to accept delivery');
    } finally {
      setAcceptingDelivery(null);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    // Simple distance calculation (Haversine formula approximation)
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance < 1 ? `${Math.round(distance * 10) / 10} mi` : `${Math.round(distance)} mi`;
  };

  const getEstimatedTime = (delivery: Delivery): string => {
    const pickupTime = new Date(delivery.route.pickup.scheduledTime);
    const deliveryTime = new Date(delivery.route.delivery.scheduledTime);
    const totalMinutes = Math.round((deliveryTime.getTime() - pickupTime.getTime()) / 60000);
    return `${totalMinutes} min`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Deliveries</h1>
        <p className="text-gray-600 mt-1">Pick up fresh produce from farms and deliver to restaurants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveries.length}</div>
            <p className="text-xs text-gray-500 mt-1">Ready for pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {deliveries.length > 0
                ? calculateDistance(
                    deliveries[0].route.pickup.location.lat,
                    deliveries[0].route.pickup.location.lng,
                    deliveries[0].route.delivery.location.lat,
                    deliveries[0].route.delivery.location.lng
                  )
                : '0 mi'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {deliveries.length > 0 ? getEstimatedTime(deliveries[0]) : '0 min'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Deliveries List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading available deliveries...</span>
          </CardContent>
        </Card>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No deliveries available</h3>
            <p className="text-gray-500 mt-1">Check back soon for new delivery opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveries.map((delivery) => {
            const order = orders[delivery.orderId];
            const distance = calculateDistance(
              delivery.route.pickup.location.lat,
              delivery.route.pickup.location.lng,
              delivery.route.delivery.location.lat,
              delivery.route.delivery.location.lng
            );
            const estimatedTime = getEstimatedTime(delivery);
            const pickupTime = new Date(delivery.route.pickup.scheduledTime);
            const isAccepting = acceptingDelivery === delivery._id;

            return (
              <Card key={delivery._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{delivery.orderNumber}</CardTitle>
                      <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
                        Ready for Pickup
                      </Badge>
                    </div>
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pickup Location */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase">Pickup From</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {delivery.route.pickup.farmName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{delivery.route.pickup.address}</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>

                    {/* Delivery Location */}
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase">Deliver To</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {delivery.route.delivery.restaurantName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{delivery.route.delivery.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  {order && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">Order Items</p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity} {item.unit} {item.name}
                            </span>
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Pickup by</span>
                      </div>
                      <span className="font-medium">
                        {pickupTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Navigation className="h-4 w-4" />
                        <span>Distance</span>
                      </div>
                      <span className="font-medium">{distance}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Truck className="h-4 w-4" />
                        <span>Est. Time</span>
                      </div>
                      <span className="font-medium">{estimatedTime}</span>
                    </div>
                  </div>

                  {/* Accept Button */}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleAcceptDelivery(delivery._id)}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Delivery
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
