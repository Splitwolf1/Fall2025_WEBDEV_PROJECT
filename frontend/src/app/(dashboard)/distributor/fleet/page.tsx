'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Truck,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Navigation,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

interface Delivery {
  _id: string;
  distributorId: string;
  orderId: string;
  status: string;
  driverName?: string;
  vehicleId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: string;
  currentDriver: string | null;
  currentLocation: string;
  mileage: number;
  lastMaintenance: string;
  nextMaintenance: string;
  fuelLevel: number;
  capacity: string;
  deliveriesToday: number;
  maintenanceNote?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  vehicleAssigned: string | null;
  licensedSince: string;
  deliveriesCompleted: number;
  rating: number;
  deliveriesToday: number;
}

export default function DistributorFleetPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchFleetData(currentUser.id);

    // Listen for real-time updates
    const handleNotification = (notification: any) => {
      if (notification.type === 'delivery' || notification.type === 'order') {
        fetchFleetData(currentUser.id);
      }
    };

    socketClient.onNotification(handleNotification);

    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router]);

  const fetchFleetData = async (distributorId: string) => {
    try {
      setIsLoading(true);
      const deliveriesResponse: any = await apiClient.getDeliveries({ distributorId, limit: '100' });
      const deliveries = deliveriesResponse.success ? deliveriesResponse.deliveries || [] : [];

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Group deliveries by vehicle
      const vehiclesMap: { [key: string]: Delivery[] } = {};
      deliveries.forEach((delivery: Delivery) => {
        if (delivery.vehicleId) {
          if (!vehiclesMap[delivery.vehicleId]) {
            vehiclesMap[delivery.vehicleId] = [];
          }
          vehiclesMap[delivery.vehicleId].push(delivery);
        }
      });

      // Build vehicles list
      const vehiclesList: Vehicle[] = Object.entries(vehiclesMap).map(([vehicleId, vehicleDeliveries]) => {
        const activeDeliveries = vehicleDeliveries.filter(d => d.status === 'picked_up' || d.status === 'in_transit');
        const todayDeliveries = vehicleDeliveries.filter(d => {
          const deliveryDate = new Date(d.createdAt);
          return deliveryDate >= today && deliveryDate <= todayEnd;
        });

        return {
          id: vehicleId,
          name: `Vehicle ${vehicleId.slice(-4)}`,
          make: 'Unknown',
          model: 'Unknown',
          year: new Date().getFullYear(),
          licensePlate: vehicleId.slice(-8).toUpperCase(),
          status: activeDeliveries.length > 0 ? 'active' : 'available',
          currentDriver: vehicleDeliveries[0]?.driverName || null,
          currentLocation: activeDeliveries.length > 0 ? 'On route' : 'Fleet Yard',
          mileage: 0, // Would need vehicle management system
          lastMaintenance: 'N/A',
          nextMaintenance: 'N/A',
          fuelLevel: 100, // Would need vehicle management system
          capacity: 'N/A',
          deliveriesToday: todayDeliveries.length,
        };
      });

      // Group deliveries by driver
      const driversMap: { [key: string]: Delivery[] } = {};
      deliveries.forEach((delivery: Delivery) => {
        if (delivery.driverName) {
          if (!driversMap[delivery.driverName]) {
            driversMap[delivery.driverName] = [];
          }
          driversMap[delivery.driverName].push(delivery);
        }
      });

      // Build drivers list
      const driversList: Driver[] = Object.entries(driversMap).map(([driverName, driverDeliveries]) => {
        const activeDeliveries = driverDeliveries.filter(d => d.status === 'picked_up' || d.status === 'in_transit');
        const todayDeliveries = driverDeliveries.filter(d => {
          const deliveryDate = new Date(d.createdAt);
          return deliveryDate >= today && deliveryDate <= todayEnd;
        });
        const completedDeliveries = driverDeliveries.filter(d => d.status === 'delivered');

        return {
          id: `DRV-${driverName.replace(/\s+/g, '').slice(0, 6)}`,
          name: driverName,
          phone: '(555) 000-0000', // Would need driver profile
          email: `${driverName.toLowerCase().replace(/\s+/g, '.')}@distributor.com`, // Would need driver profile
          status: activeDeliveries.length > 0 ? 'on_route' : 'off_duty',
          vehicleAssigned: driverDeliveries[0]?.vehicleId || null,
          licensedSince: '2020', // Would need driver profile
          deliveriesCompleted: completedDeliveries.length,
          rating: 4.5, // Would need rating system
          deliveriesToday: todayDeliveries.length,
        };
      });

      setVehicles(vehiclesList);
      setDrivers(driversList);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
      setVehicles([]);
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'available':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Available</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDriverStatusBadge = (status: string) => {
    switch (status) {
      case 'on_route':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Route</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'off_duty':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Off Duty</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vehicle.currentDriver?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vehicleStats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    available: vehicles.filter(v => v.status === 'available').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  };

  const driverStats = {
    total: drivers.length,
    onRoute: drivers.filter(d => d.status === 'on_route').length,
    scheduled: drivers.filter(d => d.status === 'scheduled').length,
    offDuty: drivers.filter(d => d.status === 'off_duty').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600 mt-1">Manage vehicles and drivers</p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-gray-300 mx-auto mb-3 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900">Loading fleet data...</h3>
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{vehicleStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">{vehicleStats.active} active now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{driverStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">{driverStats.onRoute} on route</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Deliveries Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vehicles.reduce((sum, v) => sum + v.deliveriesToday, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">All vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Fleet Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((vehicleStats.active / vehicleStats.total) * 100)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Vehicles in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={activeTab === 'vehicles' ? 'Search vehicles...' : 'Search drivers...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'vehicles' | 'drivers')}>
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles ({vehicleStats.total})</TabsTrigger>
          <TabsTrigger value="drivers">Drivers ({driverStats.total})</TabsTrigger>
        </TabsList>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="mt-6 space-y-4">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Vehicle Icon */}
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg flex-shrink-0">
                    <Truck className="h-8 w-8 text-blue-600" />
                  </div>

                  {/* Middle: Vehicle Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                        <p className="text-sm text-gray-500">
                          {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.licensePlate}
                        </p>
                      </div>
                      {getVehicleStatusBadge(vehicle.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {vehicle.currentDriver && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{vehicle.currentDriver}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{vehicle.currentLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Navigation className="h-4 w-4" />
                        <span>{vehicle.mileage.toLocaleString()} mi</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Truck className="h-4 w-4" />
                        <span>Capacity: {vehicle.capacity}</span>
                      </div>
                    </div>

                    {/* Fuel Level */}
                    {vehicle.status !== 'maintenance' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Fuel Level</span>
                          <span>{vehicle.fuelLevel}%</span>
                        </div>
                        <Progress value={vehicle.fuelLevel} className="h-2" />
                      </div>
                    )}

                    {/* Maintenance Info */}
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Last Maintenance
                        </span>
                        <span className="font-medium">{vehicle.lastMaintenance}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Next Maintenance</span>
                        <span className="font-medium">{vehicle.nextMaintenance}</span>
                      </div>
                      {vehicle.maintenanceNote && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600">{vehicle.maintenanceNote}</p>
                        </div>
                      )}
                    </div>

                    {vehicle.status === 'active' && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed {vehicle.deliveriesToday} deliveries today</span>
                      </div>
                    )}

                    {vehicle.status === 'maintenance' && (
                      <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Vehicle is currently under maintenance</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 lg:w-40">
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      Track
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    {vehicle.status === 'available' && (
                      <Button size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Assign Driver
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="mt-6 space-y-4">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Driver Avatar */}
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-lg">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Middle: Driver Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{driver.name}</h3>
                        <p className="text-sm text-gray-500">Licensed since {driver.licensedSince}</p>
                      </div>
                      {getDriverStatusBadge(driver.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{driver.email}</span>
                      </div>
                      {driver.vehicleAssigned && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Truck className="h-4 w-4" />
                          <span>Assigned: {driver.vehicleAssigned}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Deliveries</p>
                        <p className="text-lg font-semibold text-gray-900">{driver.deliveriesCompleted}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Rating</p>
                        <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                          {driver.rating}
                          <span className="text-yellow-500">★</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Today</p>
                        <p className="text-lg font-semibold text-gray-900">{driver.deliveriesToday}</p>
                      </div>
                    </div>

                    {driver.status === 'on_route' && driver.deliveriesToday > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                        <CheckCircle className="h-4 w-4" />
                        <span>Currently on route with {driver.deliveriesToday} deliveries</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 lg:w-40">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    {driver.status === 'off_duty' && (
                      <Button size="sm">
                        <Truck className="h-4 w-4 mr-2" />
                        Assign Vehicle
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
}
