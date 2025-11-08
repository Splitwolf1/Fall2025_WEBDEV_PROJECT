'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Truck,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  Package,
  Navigation,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Delivery {
  _id: string;
  orderId: string;
  status: string;
  route?: {
    delivery?: {
      actualTime?: string;
    };
  };
  updatedAt: string;
  createdAt: string;
}

interface TrackingOrder {
  id: string;
  orderNumber: string;
  status: string;
  farm: string;
  driver: string;
  driverPhone: string | null;
  vehicle: string | null;
  items: Array<{ name: string; quantity: number; unit: string }>;
  total: number;
  estimatedArrival: string | null;
  deliveredAt: string | null;
  currentLocation: { lat: number; lng: number } | null;
  progress: number;
  timeline: Array<{
    status: string;
    label: string;
    time: string;
    completed: boolean;
    active?: boolean;
  }>;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    fetchTrackingData(currentUser.id);

    // Listen for real-time delivery updates via Socket.io
    const handleNotification = (notification: any) => {
      // Refresh tracking data when delivery notifications arrive
      if (notification.type === 'delivery' || notification.type === 'order') {
        fetchTrackingData(currentUser.id);
      }
    };

    socketClient.onNotification(handleNotification);

    // Cleanup
    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router]);

  const fetchTrackingData = async (customerId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch orders
      const ordersResponse: any = await apiClient.getOrders({ customerId });
      const ordersList: Order[] = ordersResponse.success ? ordersResponse.orders || [] : [];

      // Build tracking orders with delivery data
      const trackingOrders: TrackingOrder[] = [];

      for (const order of ordersList) {
        // Fetch delivery for this order
        let delivery: Delivery | null = null;
        try {
          const deliveryResponse: any = await apiClient.getDeliveries({ orderId: order._id });
          if (deliveryResponse.success && deliveryResponse.deliveries && deliveryResponse.deliveries.length > 0) {
            delivery = deliveryResponse.deliveries[0];
          }
        } catch (err) {
          // No delivery found for this order
        }

        // Build timeline based on order status and delivery
        const orderDate = new Date(order.createdAt);
        const timeline = [];
        
        timeline.push({
          status: 'placed',
          label: 'Order Placed',
          time: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
        });

        if (order.status !== 'pending') {
          timeline.push({
            status: 'confirmed',
            label: 'Confirmed by Farm',
            time: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
          });
        }

        if (order.status === 'preparing' || order.status === 'in_transit' || order.status === 'delivered') {
          timeline.push({
            status: 'preparing',
            label: 'Preparing Order',
            time: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
            active: order.status === 'preparing',
          });
        }

        if (order.status === 'in_transit' || order.status === 'delivered') {
          timeline.push({
            status: 'picked_up',
            label: 'Picked Up',
            time: delivery?.createdAt 
              ? new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'TBD',
            completed: true,
          });
        }

        if (order.status === 'in_transit' || order.status === 'delivered') {
          timeline.push({
            status: 'in_transit',
            label: 'In Transit',
            time: delivery?.updatedAt 
              ? new Date(delivery.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'TBD',
            completed: order.status === 'delivered',
            active: order.status === 'in_transit',
          });
        }

        if (order.status === 'delivered') {
          const deliveredTime = delivery?.route?.delivery?.actualTime 
            ? new Date(delivery.route.delivery.actualTime)
            : delivery?.updatedAt 
            ? new Date(delivery.updatedAt)
            : new Date(order.updatedAt);
          
          timeline.push({
            status: 'delivered',
            label: 'Delivered',
            time: deliveredTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
            active: true,
          });
        }

        // Calculate progress
        let progress = 0;
        if (order.status === 'confirmed') progress = 25;
        else if (order.status === 'preparing') progress = 50;
        else if (order.status === 'in_transit') progress = 75;
        else if (order.status === 'delivered') progress = 100;

        // Get supplier name from first item
        const supplierName = order.items?.[0]?.productName ? 'Supplier' : 'Farm';

        trackingOrders.push({
          id: order._id,
          orderNumber: order.orderNumber || order._id.slice(0, 8),
          status: order.status,
          farm: supplierName,
          driver: order.status === 'in_transit' || order.status === 'delivered' ? 'Driver Assigned' : 'Not assigned',
          driverPhone: order.status === 'in_transit' || order.status === 'delivered' ? '(555) 000-0000' : null,
          vehicle: order.status === 'in_transit' || order.status === 'delivered' ? 'VAN-XXX' : null,
          items: order.items?.map((item: any) => ({
            name: item.productName || 'Product',
            quantity: item.quantity || 0,
            unit: item.unit || 'unit',
          })) || [],
          total: order.totalAmount || 0,
          estimatedArrival: order.status !== 'delivered' ? 'TBD' : null,
          deliveredAt: order.status === 'delivered' 
            ? (delivery?.route?.delivery?.actualTime 
                ? new Date(delivery.route.delivery.actualTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            : null,
          currentLocation: order.status === 'in_transit' ? { lat: 0, lng: 0 } : null,
          progress,
          timeline,
        });
      }

      setOrders(trackingOrders);
      if (trackingOrders.length > 0 && !selectedOrder) {
        setSelectedOrder(trackingOrders[0].id);
      }
    } catch (err: any) {
      setError('Failed to load tracking data');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock order data (fallback - not used)
  const mockOrders = [
    {
      id: 'ORD-2001',
      status: 'in_transit',
      farm: 'Green Valley Farm',
      driver: 'John Smith',
      driverPhone: '(555) 123-4567',
      vehicle: 'VAN-042',
      items: [
        { name: 'Organic Tomatoes', quantity: 15, unit: 'lbs' },
        { name: 'Fresh Lettuce', quantity: 10, unit: 'lbs' },
      ],
      total: 99.50,
      estimatedArrival: '2:30 PM',
      currentLocation: { lat: 40.7128, lng: -74.0060 },
      progress: 75,
      timeline: [
        { status: 'placed', label: 'Order Placed', time: '10:00 AM', completed: true },
        { status: 'confirmed', label: 'Confirmed by Farm', time: '10:15 AM', completed: true },
        { status: 'preparing', label: 'Preparing Order', time: '11:00 AM', completed: true },
        { status: 'picked_up', label: 'Picked Up', time: '12:30 PM', completed: true },
        { status: 'in_transit', label: 'In Transit', time: '1:45 PM', completed: true, active: true },
        { status: 'delivered', label: 'Delivered', time: 'Est. 2:30 PM', completed: false },
      ],
    },
    {
      id: 'ORD-2002',
      status: 'preparing',
      farm: 'Sunrise Organics',
      driver: 'Not assigned',
      driverPhone: null,
      vehicle: null,
      items: [
        { name: 'Organic Carrots', quantity: 20, unit: 'lbs' },
        { name: 'Fresh Herbs', quantity: 5, unit: 'lbs' },
      ],
      total: 110.00,
      estimatedArrival: '4:00 PM',
      currentLocation: null,
      progress: 40,
      timeline: [
        { status: 'placed', label: 'Order Placed', time: '1:00 PM', completed: true },
        { status: 'confirmed', label: 'Confirmed by Farm', time: '1:10 PM', completed: true },
        { status: 'preparing', label: 'Preparing Order', time: '1:30 PM', completed: true, active: true },
        { status: 'picked_up', label: 'Ready for Pickup', time: 'Est. 3:00 PM', completed: false },
        { status: 'in_transit', label: 'In Transit', time: 'Est. 3:15 PM', completed: false },
        { status: 'delivered', label: 'Delivered', time: 'Est. 4:00 PM', completed: false },
      ],
    },
    {
      id: 'ORD-2003',
      status: 'delivered',
      farm: 'Fresh Fields Co.',
      driver: 'Mike Davis',
      driverPhone: '(555) 789-0123',
      vehicle: 'VAN-038',
      items: [
        { name: 'Strawberries', quantity: 8, unit: 'lbs' },
        { name: 'Potatoes', quantity: 12, unit: 'lbs' },
      ],
      total: 78.40,
      estimatedArrival: null,
      deliveredAt: '11:45 AM',
      currentLocation: null,
      progress: 100,
      timeline: [
        { status: 'placed', label: 'Order Placed', time: '8:00 AM', completed: true },
        { status: 'confirmed', label: 'Confirmed by Farm', time: '8:10 AM', completed: true },
        { status: 'preparing', label: 'Preparing Order', time: '8:30 AM', completed: true },
        { status: 'picked_up', label: 'Picked Up', time: '10:00 AM', completed: true },
        { status: 'in_transit', label: 'In Transit', time: '10:45 AM', completed: true },
        { status: 'delivered', label: 'Delivered', time: '11:45 AM', completed: true, active: true },
      ],
    },
  ];

  const currentOrder = orders.find(o => o.id === selectedOrder) || (orders.length > 0 ? orders[0] : null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'In Transit';
      case 'preparing':
        return 'Preparing';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Track Your Orders</h1>
          <p className="text-gray-500 mt-1">Real-time delivery tracking and order updates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900">No orders to track</h3>
                  <p className="text-xs text-gray-500 mt-1">Place an order to see tracking information</p>
                  {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedOrder === order.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-gray-900">{order.id}</div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium">{order.farm}</p>
                      <div className="flex items-center gap-1">
                        {order.status === 'delivered' ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Delivered {order.deliveredAt}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>ETA: {order.estimatedArrival}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details & Tracking */}
          {!currentOrder ? (
            <div className="lg:col-span-2 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No order selected</h3>
                <p className="text-gray-500 mt-2">Select an order from the list to view tracking details</p>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 space-y-6">
              {/* Map View */}
              {currentOrder.status !== 'delivered' && currentOrder.status !== 'preparing' && (
              <Card>
                <CardContent className="p-6">
                  <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Navigation className="h-16 w-16 text-green-600 mx-auto mb-4 animate-pulse" />
                      <p className="text-lg font-semibold text-gray-900">Live Tracking Active</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Your delivery is {currentOrder.progress}% complete
                      </p>
                      <div className="mt-4 max-w-xs mx-auto">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full transition-all"
                            style={{ width: `${currentOrder.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Order {currentOrder.id}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">From {currentOrder.farm}</p>
                  </div>
                  <Badge className={getStatusColor(currentOrder.status)} variant="secondary">
                    {getStatusText(currentOrder.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Delivery Info */}
                {currentOrder.driver !== 'Not assigned' && (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Driver Information</h4>
                      <p className="text-sm text-gray-600 mt-1">{currentOrder.driver}</p>
                      <p className="text-sm text-gray-500">Vehicle: {currentOrder.vehicle}</p>
                      {currentOrder.driverPhone && (
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Phone className="h-3 w-3" />
                            Call
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Message
                          </Button>
                        </div>
                      )}
                    </div>
                    {currentOrder.estimatedArrival && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">ETA</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {currentOrder.estimatedArrival}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {currentOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{item.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-green-600">
                      ${currentOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Delivery Timeline</h4>
                  <div className="space-y-4">
                    {currentOrder.timeline.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              step.completed
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            } ${step.active ? 'ring-4 ring-green-100' : ''}`}
                          >
                            {step.completed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          {index < currentOrder.timeline.length - 1 && (
                            <div
                              className={`w-0.5 h-12 ${
                                step.completed ? 'bg-green-300' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center justify-between">
                            <p
                              className={`font-medium ${
                                step.active ? 'text-green-600' : 'text-gray-900'
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="text-sm text-gray-500">{step.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {currentOrder.status !== 'delivered' && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                      Cancel Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
