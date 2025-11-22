'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Star,
  StarIcon,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
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
  driverId?: string;
  driverName?: string;
  ratings?: {
    farmerRated: boolean;
    deliveryRated: boolean;
    driverRated: boolean;
    canRate: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

type OrderStatus = 'all' | 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'completed';

export default function FarmerOrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState<'accept' | 'reject' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Rating state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Load user and orders
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchOrders(currentUser.id);
  }, [router]);

  const fetchOrders = async (farmerId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch orders where farmer's products are included
      const response: any = await apiClient.getOrders({ farmerId });

      if (response.success && response.orders) {
        setOrders(response.orders);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, note?: string) => {
    if (!user) return;

    try {
      const response: any = await apiClient.updateOrderStatus(orderId, newStatus, note);

      if (response.success) {
        // Refresh orders
        fetchOrders(user.id);
        setActionDialog(null);
        setActionNote('');
        setShowDetailDialog(false);
      }
    } catch (err: any) {
      console.error('Error updating order:', err);
      alert(err.message || 'Failed to update order');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Count by status
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready_for_pickup: orders.filter(o => o.status === 'ready_for_pickup').length,
    completed: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmed</Badge>;
      case 'preparing':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Preparing</Badge>;
      case 'ready_for_pickup':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ready for Pickup</Badge>;
      case 'in_transit':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">In Transit</Badge>;
      case 'delivered':
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  const handleAccept = (order: Order) => {
    setSelectedOrder(order);
    setActionDialog('accept');
  };

  const handleReject = (order: Order) => {
    setSelectedOrder(order);
    setActionDialog('reject');
  };

  const handleActionSubmit = () => {
    if (!selectedOrder) return;

    const newStatus = actionDialog === 'accept' ? 'confirmed' : 'cancelled';
    handleUpdateOrderStatus(selectedOrder._id, newStatus, actionNote);
  };

  // Rating functions
  const openRatingDialog = (order: Order) => {
    setRatingOrder(order);
    setRating(0);
    setRatingComment('');
    setShowRatingDialog(true);
  };

  const closeRatingDialog = () => {
    setShowRatingDialog(false);
    setRatingOrder(null);
    setRating(0);
    setRatingComment('');
    setIsSubmittingRating(false);
  };

  const submitRating = async () => {
    if (!ratingOrder || rating === 0) return;

    if (!user) return;

    try {
      setIsSubmittingRating(true);

      const ratingData = {
        orderId: ratingOrder._id,
        raterId: user.id,
        ratedUserId: ratingOrder.driverId || 'unknown',
        type: 'driver' as const,
        rating,
        comment: ratingComment.trim(),
      };

      const response = await apiClient.createRating(ratingData);
      
      if (response.success) {
        // Close dialog
        closeRatingDialog();
        
        // Refresh orders to update rating status
        fetchOrders(user.id);
        
        // Show success feedback (you could add a toast here)
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      alert(error.message || 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage incoming orders from restaurants</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <p className="text-xs text-gray-500 mt-1">Needs your action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.confirmed}</div>
            <p className="text-xs text-gray-500 mt-1">Being prepared</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.preparing}</div>
            <p className="text-xs text-gray-500 mt-1">In preparation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ready for Pickup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.ready_for_pickup}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting collection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">All orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by order ID or restaurant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders ({statusCounts.all})</SelectItem>
                  <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                  <SelectItem value="confirmed">Confirmed ({statusCounts.confirmed})</SelectItem>
                  <SelectItem value="preparing">Preparing ({statusCounts.preparing})</SelectItem>
                  <SelectItem value="ready_for_pickup">Ready for Pickup ({statusCounts.ready_for_pickup})</SelectItem>
                  <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Orders Table */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left: Order Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">Customer {order.customerId.slice(0, 8)}...</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Ordered {new Date(order.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}: {order.items.map(i => `${i.quantity} ${i.unit} ${i.productName || i.name || 'Product'}`).join(', ')}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 md:items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(order)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(order)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'ready_for_pickup', 'Order is ready for pickup')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Ready for Pickup
                          </Button>
                        )}
                        {(order.status === 'delivered' || order.status === 'completed') && order.driverId && !order.ratings?.driverRated && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => openRatingDialog(order)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Rate Driver
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Complete order information and customer details</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer</label>
                  <p className="mt-1 text-gray-900">{selectedOrder.customerType}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customerId.slice(0, 12)}...</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Order Date</label>
                  <p className="mt-1 text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Location
                </label>
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
                  <div className="p-3 flex justify-between items-center bg-gray-50 font-semibold">
                    <span>Total</span>
                    <span className="text-lg">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedOrder?.status === 'pending' && (
              <>
                <Button onClick={() => {
                  setShowDetailDialog(false);
                  handleAccept(selectedOrder);
                }} className="bg-green-600 hover:bg-green-700">
                  Accept Order
                </Button>
                <Button variant="destructive" onClick={() => {
                  setShowDetailDialog(false);
                  handleReject(selectedOrder);
                }}>
                  Reject Order
                </Button>
              </>
            )}
            {selectedOrder?.status === 'confirmed' && (
              <Button onClick={() => {
                setShowDetailDialog(false);
                handleUpdateOrderStatus(selectedOrder._id, 'preparing');
              }} className="bg-purple-600 hover:bg-purple-700">
                <Package className="h-4 w-4 mr-2" />
                Start Preparing
              </Button>
            )}
            {selectedOrder?.status === 'preparing' && (
              <Button onClick={() => {
                setShowDetailDialog(false);
                handleUpdateOrderStatus(selectedOrder._id, 'ready_for_pickup', 'Order is ready for pickup');
              }} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Ready for Pickup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept/Reject Action Dialog */}
      <Dialog open={actionDialog !== null} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'accept' ? 'Accept Order' : 'Reject Order'} - {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === 'accept'
                ? 'Confirm that you can fulfill this order by the scheduled pickup time.'
                : 'Please provide a reason for rejecting this order.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={actionDialog === 'accept' ? 'Add notes (optional)...' : 'Reason for rejection...'}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActionDialog(null);
              setActionNote('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              className={actionDialog === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionDialog === 'reject' ? 'destructive' : 'default'}
            >
              {actionDialog === 'accept' ? 'Confirm Accept' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Driver</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                How was your experience with {ratingOrder?.driverName || 'the driver'} for order {ratingOrder?.orderNumber}?
              </p>
              
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <StarIcon
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="rating-comment" className="text-sm font-medium">
                Additional Comments (Optional)
              </label>
              <Textarea
                id="rating-comment"
                placeholder="Share your experience with the driver..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={3}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {ratingComment.length}/500 characters
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeRatingDialog}>
              Cancel
            </Button>
            <Button
              onClick={submitRating}
              disabled={rating === 0 || isSubmittingRating}
              className="min-w-[100px]"
            >
              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
