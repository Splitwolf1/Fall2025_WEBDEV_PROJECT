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
  Car,
  User,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

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
      // Fetch ONLY deliveries that are ready for pickup (pickup_pending)
      // Exclude scheduled, picked_up, in_transit, delivered - those appear in Active Deliveries
      const deliveriesResponse: any = await apiClient.getDeliveries({ 
        status: 'pickup_pending',
        limit: '100' 
      });
      
      let deliveriesList = deliveriesResponse.success ? deliveriesResponse.deliveries || [] : [];
      
      // Double-check: filter out any deliveries that are not pickup_pending
      deliveriesList = deliveriesList.filter((d: any) => 
        d.status === 'pickup_pending' || d.status === 'ready_for_pickup'
      );
      
      console.log(`[Available Deliveries] Found ${deliveriesList.length} pickup_pending deliveries`);

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

  const handleAssignVehicle = async (delivery: Delivery) => {
    try {
      setAcceptingDelivery(delivery._id);
      const user = auth.getCurrentUser();
      if (!user || !user.id) {
        alert('Please log in to assign vehicles');
        return;
      }

      // Fetch available vehicles and drivers
      const [vehiclesResponse, driversResponse, offDutyDriversResponse] = await Promise.all([
        apiClient.getVehicles(user.id, 'available'),
        apiClient.getDrivers(user.id, 'available'), // Fetch drivers with 'available' status
        apiClient.getDrivers(user.id, 'off_duty'), // Fallback: also fetch off_duty drivers
      ]);

      const availableVehicles = vehiclesResponse.success ? vehiclesResponse.vehicles || [] : [];
      let availableDrivers = driversResponse.success ? driversResponse.drivers || [] : [];
      
      // If no available drivers, use off_duty as fallback
      if (availableDrivers.length === 0 && offDutyDriversResponse.success) {
        availableDrivers = offDutyDriversResponse.drivers || [];
        console.log('[Available Deliveries] No available drivers, using off_duty drivers as fallback');
      }
      
      console.log('[Available Deliveries] Fetched vehicles:', availableVehicles.length);
      console.log('[Available Deliveries] Fetched drivers:', availableDrivers.length);
      console.log('[Available Deliveries] Driver response:', driversResponse);

      setVehicles(availableVehicles);
      setDrivers(availableDrivers);
      setSelectedDelivery(delivery);
      setSelectedVehicleId('');
      setSelectedDriverId('');
      setShowAssignDialog(true);
    } catch (error: any) {
      console.error('Error fetching vehicles/drivers:', error);
      alert('Failed to load vehicles and drivers');
    } finally {
      setAcceptingDelivery(null);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedDelivery || !selectedVehicleId || !selectedDriverId) {
      alert('Please select both a vehicle and a driver');
      return;
    }

    try {
      setIsAssigning(true);
      const user = auth.getCurrentUser();
      if (!user || !user.id) {
        alert('Please log in to assign vehicles');
        return;
      }

      // Get selected vehicle and driver details
      const vehicle = vehicles.find(v => v._id === selectedVehicleId);
      const driver = drivers.find(d => d._id === selectedDriverId);

      if (!vehicle || !driver) {
        alert('Selected vehicle or driver not found');
        return;
      }

      // Update delivery with vehicle, driver, and distributor assignment
      const response: any = await apiClient.updateDeliveryStatus(
        selectedDelivery._id,
        'scheduled', // Change status to scheduled (assigned and ready)
        `Assigned to ${driver.name} with ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
        undefined,
        user.id, // distributorId
        selectedVehicleId,
        selectedDriverId,
        {
          type: `${vehicle.make} ${vehicle.model}`,
          plateNumber: vehicle.licensePlate,
        },
        {
          name: driver.name,
          phone: driver.phone,
        }
      );

      if (response.success) {
        // Update vehicle and driver status
        await Promise.all([
          apiClient.updateVehicle(selectedVehicleId, { 
            status: 'active',
            currentDriver: selectedDriverId,
          }),
          apiClient.updateDriver(selectedDriverId, {
            status: 'scheduled',
            vehicleAssigned: selectedVehicleId,
          }),
        ]);

        // Remove from available deliveries immediately
        setDeliveries(prev => prev.filter(d => d._id !== selectedDelivery._id));
        setShowAssignDialog(false);
        setSelectedDelivery(null);
        setSelectedVehicleId('');
        setSelectedDriverId('');
        
        // Refresh the list to ensure it's up to date
        await fetchAvailableDeliveries();
        
        // Show success message
        alert('Delivery assigned successfully! It will now appear in Active Deliveries.');
        
        // Optionally navigate to active deliveries
        // router.push('/distributor/deliveries');
      } else {
        alert('Failed to assign vehicle and driver. Please try again.');
      }
    } catch (error: any) {
      console.error('Error assigning vehicle/driver:', error);
      alert(error.message || 'Failed to assign vehicle and driver');
    } finally {
      setIsAssigning(false);
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

                  {/* Assign Vehicle Button */}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleAssignVehicle(delivery)}
                    disabled={acceptingDelivery === delivery._id}
                  >
                    {acceptingDelivery === delivery._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Car className="h-4 w-4 mr-2" />
                        Assign Vehicle
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Vehicle & Driver Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Vehicle & Driver</DialogTitle>
            <DialogDescription>
              Select a vehicle and driver for this delivery
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <SelectItem value="none" disabled>No available vehicles</SelectItem>
                  ) : (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate}) - {vehicle.capacity}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Driver Selection */}
            <div className="space-y-2">
              <Label htmlFor="driver">Driver *</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.length === 0 ? (
                    <SelectItem value="none" disabled>No available drivers. Update driver status to "available" in Fleet Management.</SelectItem>
                  ) : (
                    drivers.map((driver: any) => (
                      <SelectItem key={driver._id || driver.id} value={driver._id || driver.id}>
                        {driver.name} - {driver.phone} ({driver.deliveriesCompleted || 0} deliveries) [{driver.status || 'N/A'}]
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedDelivery && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Order:</strong> {selectedDelivery.orderNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>From:</strong> {selectedDelivery.route.pickup.farmName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>To:</strong> {selectedDelivery.route.delivery.restaurantName}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setSelectedDelivery(null);
                setSelectedVehicleId('');
                setSelectedDriverId('');
              }}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAssignment}
              disabled={!selectedVehicleId || !selectedDriverId || isAssigning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign & Accept
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
