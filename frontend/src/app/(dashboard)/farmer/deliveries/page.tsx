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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  Truck,
  Package,
  MapPin,
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Navigation,
  Star,
  StarIcon
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface Delivery {
  _id: string;
  orderId: string;
  orderNumber: string;
  distributorId: string;
  driverName: string;
  driverPhone?: string;
  vehicleInfo: {
    type: string;
    plateNumber: string;
  };
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
  status: string;
  driverId?: string;
  currentLocation?: { lat: number; lng: number };
  estimatedArrivalTime?: string;
  createdAt: string;
  updatedAt: string;
}

type DeliveryStatus = 'all' | 'scheduled' | 'picked_up' | 'in_transit' | 'delivered';

export default function FarmerDeliveriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus>('all');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rating state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingDelivery, setRatingDelivery] = useState<Delivery | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchDeliveries(currentUser.id);
  }, [router]);

  const fetchDeliveries = async (farmerId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // First, fetch orders for this farmer
      const ordersResponse: any = await apiClient.getOrders({ farmerId });
      if (!ordersResponse.success || !ordersResponse.orders) {
        setDeliveries([]);
        return;
      }

      const orders = ordersResponse.orders;
      const orderIds = orders.map((order: any) => order._id);

      if (orderIds.length === 0) {
        setDeliveries([]);
        return;
      }

      // Fetch deliveries for all orders
      const allDeliveries: Delivery[] = [];
      for (const orderId of orderIds) {
        try {
          const deliveryResponse: any = await apiClient.getDeliveries({ orderId });
          if (deliveryResponse.success && deliveryResponse.deliveries) {
            allDeliveries.push(...deliveryResponse.deliveries);
          }
        } catch (err) {
          // Continue if delivery doesn't exist for this order
          console.log(`No delivery found for order ${orderId}`);
        }
      }

      setDeliveries(allDeliveries);
    } catch (err: any) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to load deliveries');
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const calculateProgress = (delivery: Delivery) => {
    switch (delivery.status) {
      case 'scheduled':
      case 'pickup_pending':
        return 0;
      case 'picked_up':
        return 30;
      case 'in_transit':
        return 65;
      case 'arrived':
        return 90;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  const getETA = (delivery: Delivery) => {
    if (delivery.status === 'delivered') {
      return 'Completed';
    }
    if (delivery.estimatedArrivalTime) {
      const eta = new Date(delivery.estimatedArrivalTime);
      const now = new Date();
      const diffMs = eta.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) {
        return `${diffMins} mins`;
      }
      const hours = Math.floor(diffMins / 60);
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    }
    return 'TBD';
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch =
      delivery.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.route.delivery.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.driverName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Map delivery status to filter status
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'scheduled') {
      matchesStatus = delivery.status === 'scheduled' || delivery.status === 'pickup_pending';
    } else if (statusFilter === 'picked_up') {
      matchesStatus = delivery.status === 'picked_up';
    } else if (statusFilter === 'in_transit') {
      matchesStatus = delivery.status === 'in_transit' || delivery.status === 'arrived';
    } else if (statusFilter === 'delivered') {
      matchesStatus = delivery.status === 'delivered';
    }
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: deliveries.length,
    scheduled: deliveries.filter(d => d.status === 'scheduled' || d.status === 'pickup_pending').length,
    picked_up: deliveries.filter(d => d.status === 'picked_up').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit' || d.status === 'arrived').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pickup_pending':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'picked_up':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Picked Up</Badge>;
      case 'in_transit':
      case 'arrived':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">In Transit</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pickup_pending':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'picked_up':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'in_transit':
      case 'arrived':
        return <Truck className="h-5 w-5 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  // Rating functions
  const openRatingDialog = (delivery: Delivery) => {
    setRatingDelivery(delivery);
    setRating(0);
    setRatingComment('');
    setShowRatingDialog(true);
  };

  const closeRatingDialog = () => {
    setShowRatingDialog(false);
    setRatingDelivery(null);
    setRating(0);
    setRatingComment('');
    setIsSubmittingRating(false);
  };

  const submitRating = async () => {
    if (!ratingDelivery || rating === 0) return;

    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    try {
      setIsSubmittingRating(true);

      const ratingData = {
        orderId: ratingDelivery.orderId,
        raterId: currentUser.id,
        ratedUserId: ratingDelivery.driverId || 'unknown',
        type: 'driver' as const,
        rating,
        comment: ratingComment.trim(),
        deliveryId: ratingDelivery._id,
      };

      const response = await apiClient.createRating(ratingData);
      
      if (response.success) {
        // Close dialog
        closeRatingDialog();
        
        // Refresh deliveries to update rating status
        fetchDeliveries(currentUser.id);
        
        // Show success feedback (you could add a toast here)
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      alert(error.message || 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Schedule</h1>
        <p className="text-gray-600 mt-1">Track pickups and deliveries for your orders</p>
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
            <p className="text-xs text-gray-500 mt-1">Awaiting pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.in_transit}</div>
            <p className="text-xs text-gray-500 mt-1">On the way</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Delivered Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.delivered}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {deliveries.length > 0
                ? Math.round(
                    (deliveries.filter(d => d.status === 'delivered' && d.route.delivery.actualTime).length /
                      deliveries.filter(d => d.status === 'delivered').length) *
                      100 || 0
                  )
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by delivery ID, restaurant, or driver..."
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
          <TabsTrigger value="in_transit">In Transit ({statusCounts.in_transit})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({statusCounts.delivered})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6 space-y-4">
          {error && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Error loading deliveries</h3>
                <p className="text-gray-500 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}
          {!error && filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No deliveries found</h3>
                <p className="text-gray-500 mt-1">
                  {deliveries.length === 0
                    ? 'No deliveries have been scheduled for your orders yet'
                    : 'Try adjusting your search or filters'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDeliveries.map((delivery) => {
              const progress = calculateProgress(delivery);
              const eta = getETA(delivery);
              return (
                <Card key={delivery._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Left: Status Icon */}
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full flex-shrink-0">
                        {getStatusIcon(delivery.status)}
                      </div>

                      {/* Middle: Delivery Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">{delivery.orderNumber}</h3>
                            <p className="text-sm text-gray-500">Order ID: {delivery.orderId.slice(-6)}</p>
                          </div>
                          {getStatusBadge(delivery.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">{delivery.route.delivery.restaurantName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{delivery.route.delivery.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>Driver: {delivery.driverName || 'Not assigned'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Navigation className="h-4 w-4" />
                            <span>
                              Vehicle: {delivery.vehicleInfo?.plateNumber
                                ? `${delivery.vehicleInfo.type} ${delivery.vehicleInfo.plateNumber}`
                                : 'Not assigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(delivery.route.delivery.scheduledTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              Pickup: {formatTime(delivery.route.pickup.scheduledTime)} • Delivery:{' '}
                              {formatTime(delivery.route.delivery.scheduledTime)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {delivery.status !== 'scheduled' &&
                          delivery.status !== 'pickup_pending' &&
                          delivery.status !== 'delivered' &&
                          delivery.status !== 'failed' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Delivery Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                        {delivery.status === 'delivered' && delivery.route.delivery.actualTime && (
                          <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Delivered successfully on {formatDate(delivery.route.delivery.actualTime)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: ETA & Actions */}
                      <div className="flex flex-col items-end gap-3 lg:w-40">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">ETA</p>
                          <p className="text-lg font-bold text-gray-900">{eta}</p>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <Button variant="outline" size="sm" className="w-full">
                            <MapPin className="h-4 w-4 mr-2" />
                            Track
                          </Button>
                          {delivery.status === 'delivered' && delivery.driverId && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => openRatingDialog(delivery)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Rate Driver
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Driver</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                How was your experience with {ratingDelivery?.driverName || 'the driver'}?
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
