'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Package,
  Calendar,
  DollarSign,
  Eye,
  XCircle,
  Clock,
  CheckCircle,
  Truck,
  Download,
  MessageSquare,
  Loader2,
  Star,
  StarIcon,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { socketClient } from '@/lib/socket-client';

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  farmerId: string;
  farmerName: string;
  customerType: string;
  items: Array<{
    productId: string;
    farmerId?: string;
    productName?: string;
    name?: string; // Backend uses 'name'
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice?: number; // Legacy field
    subtotal: number; // Backend uses 'subtotal'
  }>;
  totalAmount: number;
  status: string;
  deliveryAddress: any;
  notes?: string;
  distributorId?: string;
  ratings?: {
    farmerRated: boolean;
    deliveryRated: boolean;
    canRate: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

type OrderStatus = 'all' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';

export default function RestaurantOrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [avgDeliveryTime, setAvgDeliveryTime] = useState<string>('0 days');
  
  // Rating state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingType, setRatingType] = useState<'farmer' | 'delivery'>('farmer');
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Load orders on mount and listen for real-time updates
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    fetchOrders(currentUser.id);

    // Listen for real-time order updates via Socket.io
    const handleNotification = (notification: any) => {
      // Refresh orders when order/delivery notifications arrive
      if (notification.type === 'order' || notification.type === 'delivery') {
        fetchOrders(currentUser.id);
      }
    };

    socketClient.onNotification(handleNotification);

    // Cleanup
    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router]);

  const fetchOrders = async (customerId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response: any = await apiClient.getOrders({ customerId });

      if (response.success && response.orders) {
        setOrders(response.orders);
        
        // Calculate average delivery time from deliveries
        await calculateAvgDeliveryTime(response.orders);
      } else {
        setOrders([]);
        setAvgDeliveryTime('0 days');
      }
    } catch (err: any) {
      setError('Failed to load orders');
      setOrders([]);
      setAvgDeliveryTime('0 days');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAvgDeliveryTime = async (ordersList: Order[]) => {
    try {
      // Get delivered orders
      const deliveredOrders = ordersList.filter(
        (o: Order) => o.status === 'delivered' || o.status === 'completed'
      );

      if (deliveredOrders.length === 0) {
        setAvgDeliveryTime('0 days');
        return;
      }

      // Fetch deliveries for delivered orders
      const deliveryTimes: number[] = [];
      for (const order of deliveredOrders) {
        try {
          const deliveryResponse: any = await apiClient.getDeliveries({ orderId: order._id });
          if (deliveryResponse.success && deliveryResponse.deliveries && deliveryResponse.deliveries.length > 0) {
            const delivery = deliveryResponse.deliveries[0];
            
            // Calculate delivery time: from order creation to delivery completion
            const orderDate = new Date(order.createdAt);
            const deliveryDate = delivery.route?.delivery?.actualTime 
              ? new Date(delivery.route.delivery.actualTime)
              : delivery.updatedAt 
              ? new Date(delivery.updatedAt)
              : null;
            
            if (deliveryDate && deliveryDate > orderDate) {
              const diffMs = deliveryDate.getTime() - orderDate.getTime();
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              deliveryTimes.push(diffDays);
            }
          }
        } catch (err) {
          // Skip if delivery not found
        }
      }

      if (deliveryTimes.length > 0) {
        const avgDays = deliveryTimes.reduce((sum, days) => sum + days, 0) / deliveryTimes.length;
        setAvgDeliveryTime(avgDays < 1 ? `${(avgDays * 24).toFixed(1)} hours` : `${avgDays.toFixed(1)} days`);
      } else {
        setAvgDeliveryTime('0 days');
      }
    } catch (err) {
      setAvgDeliveryTime('0 days');
    }
  };

  const handleRateOrder = (order: Order, type: 'farmer' | 'delivery') => {
    setRatingOrder(order);
    setRatingType(type);
    setRating(0);
    setRatingComment('');
    setShowRatingDialog(true);
  };

  const submitRating = async () => {
    if (!ratingOrder || !rating || rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars');
      return;
    }

    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      setError('You must be logged in to submit a rating');
      return;
    }

    try {
      setIsSubmittingRating(true);
      setError('');

      const ratingData = {
        orderId: ratingOrder._id,
        raterId: currentUser.id,
        ratedUserId: ratingType === 'farmer' ? ratingOrder.farmerId : ratingOrder.distributorId || '',
        type: ratingType,
        rating,
        comment: ratingComment.trim(),
        isAnonymous: false,
      };

      if (ratingType === 'delivery' && !ratingOrder.distributorId) {
        setError('No delivery service associated with this order');
        return;
      }

      const response: any = await apiClient.createRating(ratingData);

      if (response.success) {
        setShowRatingDialog(false);
        setRatingOrder(null);
        // Refresh orders to update rating status
        await fetchOrders();
        // Show success message
        alert(`Thank you for rating the ${ratingType}!`);
      } else {
        setError(response.message || 'Failed to submit rating');
      }
    } catch (err: any) {
      console.error('Rating submission error:', err);
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    in_transit: orders.filter(o => o.status === 'in_transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmed</Badge>;
      case 'in_transit':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">In Transit</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage your produce orders</p>
        </div>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Browse Products
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.confirmed + statusCounts.in_transit}
            </div>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.delivered}</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">All orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{avgDeliveryTime}</div>
            <p className="text-xs text-gray-500 mt-1">Average time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by order ID or farm name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Order Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus)}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({statusCounts.confirmed})</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit ({statusCounts.in_transit})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({statusCounts.delivered})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Status Icon */}
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full flex-shrink-0">
                      {getStatusIcon(order.status)}
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-500">Order #{order._id.slice(0, 8)}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}: {order.items.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-40">
                      <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {order.status === 'delivered' && (
                        <>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Invoice
                          </Button>
                          
                          {/* Rating Buttons */}
                          {order.ratings?.canRate && (
                            <div className="flex gap-2">
                              {!order.ratings?.farmerRated && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleRateOrder(order, 'farmer')}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate Farmer
                                </Button>
                              )}
                              
                              {order.distributorId && !order.ratings?.deliveryRated && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                  onClick={() => handleRateOrder(order, 'delivery')}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate Delivery
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Complete order information</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              {/* Order Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Order Date</label>
                  <p className="mt-1 text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-gray-900">{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                <p className="mt-1 text-gray-900">
                  {selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} {selectedOrder.deliveryAddress?.zipCode}
                </p>
              </div>

              {/* Items */}
              <div>
                <label className="text-sm font-medium text-gray-700">Order Items</label>
                <div className="mt-2 border rounded-lg divide-y">
                  {selectedOrder.items.map((item, idx) => {
                    const itemName = item.productName || item.name || 'Product';
                    const itemPrice = item.subtotal || item.totalPrice || (item.pricePerUnit * item.quantity);
                    return (
                      <div key={idx} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{itemName}</p>
                          <p className="text-sm text-gray-500">{item.quantity} {item.unit} @ ${item.pricePerUnit?.toFixed(2) || '0.00'}/{item.unit}</p>
                        </div>
                        <p className="font-semibold">${itemPrice.toFixed(2)}</p>
                      </div>
                    );
                  })}
                  <div className="p-3 flex justify-between font-semibold text-lg bg-gray-50">
                    <span>Total</span>
                    <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Order Notes</label>
                  <p className="mt-1 text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedOrder?.status === 'delivered' && (
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Rate {ratingType === 'farmer' ? 'Farmer' : 'Delivery Service'}
            </DialogTitle>
            <DialogDescription>
              Share your experience with {ratingType === 'farmer' ? ratingOrder?.farmerName : 'the delivery service'} for order #{ratingOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder={`Share your experience with the ${ratingType}...`}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{ratingComment.length}/500 characters</p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
              disabled={isSubmittingRating}
            >
              Cancel
            </Button>
            <Button
              onClick={submitRating}
              disabled={rating === 0 || isSubmittingRating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmittingRating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
