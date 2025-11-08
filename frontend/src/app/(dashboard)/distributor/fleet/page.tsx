'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Truck,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Navigation,
  TrendingUp,
  Loader2,
  Plus,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

interface Vehicle {
  _id: string;
  distributorId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: 'active' | 'available' | 'maintenance';
  currentDriver?: string;
  currentLocation?: string;
  mileage: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  capacity: string;
}

interface Driver {
  _id: string;
  distributorId: string;
  name: string;
  phone: string;
  email: string;
  status: 'on_route' | 'scheduled' | 'off_duty';
  vehicleAssigned?: string;
  licensedSince: string;
  deliveriesCompleted: number;
  deliveriesToday: number;
}

export default function DistributorFleetPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    capacity: '',
    status: 'available' as 'active' | 'available' | 'maintenance',
  });

  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    email: '',
    licensedSince: new Date().getFullYear().toString(),
    status: 'off_duty' as 'on_route' | 'scheduled' | 'off_duty',
  });

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
      
      // Fetch vehicles and drivers from backend
      const [vehiclesResponse, driversResponse] = await Promise.all([
        apiClient.getVehicles(distributorId),
        apiClient.getDrivers(distributorId),
      ]);

      if (vehiclesResponse.success) {
        setVehicles(vehiclesResponse.vehicles || []);
      }
      if (driversResponse.success) {
        setDrivers(driversResponse.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching fleet data:', error);
      setVehicles([]);
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        setError('User not found');
        return;
      }

      const vehicleData = {
        ...vehicleForm,
        distributorId: currentUser.id,
        mileage: 0,
      };

      const response: any = await apiClient.createVehicle(vehicleData);
      if (response.success) {
        setSuccess('Vehicle added successfully!');
        setShowAddVehicle(false);
        setVehicleForm({
          name: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
          capacity: '',
          status: 'available',
        });
        await fetchFleetData(currentUser.id);
      } else {
        setError(response.message || 'Failed to add vehicle');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add vehicle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDriver = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        setError('User not found');
        return;
      }

      const driverData = {
        ...driverForm,
        distributorId: currentUser.id,
        deliveriesCompleted: 0,
        deliveriesToday: 0,
      };

      const response: any = await apiClient.createDriver(driverData);
      if (response.success) {
        setSuccess('Driver added successfully!');
        setShowAddDriver(false);
        setDriverForm({
          name: '',
          phone: '',
          email: '',
          licensedSince: new Date().getFullYear().toString(),
          status: 'off_duty',
        });
        await fetchFleetData(currentUser.id);
      } else {
        setError(response.message || 'Failed to add driver');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add driver');
    } finally {
      setIsSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-1">Manage vehicles and drivers</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'vehicles' ? (
            <Button onClick={() => setShowAddVehicle(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          ) : (
            <Button onClick={() => setShowAddDriver(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

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
                  Available Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{vehicleStats.available}</div>
                <p className="text-xs text-gray-500 mt-1">Ready for assignment</p>
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
                  {vehicleStats.total > 0 ? Math.round((vehicleStats.active / vehicleStats.total) * 100) : 0}%
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
              {filteredVehicles.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No vehicles</h3>
                    <p className="text-gray-500 mt-1">Add your first vehicle to get started</p>
                    <Button onClick={() => setShowAddVehicle(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vehicle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <Card key={vehicle._id} className="hover:shadow-md transition-shadow">
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
                              <span className="truncate">{vehicle.currentLocation || 'Fleet Yard'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Navigation className="h-4 w-4" />
                              <span>{vehicle.mileage.toLocaleString()} mi</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Truck className="h-4 w-4" />
                              <span>Capacity: {vehicle.capacity || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Maintenance Info */}
                          {(vehicle.lastMaintenance || vehicle.nextMaintenance) && (
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                              {vehicle.lastMaintenance && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 flex items-center gap-2">
                                    <Wrench className="h-4 w-4" />
                                    Last Maintenance
                                  </span>
                                  <span className="font-medium">
                                    {vehicle.lastMaintenance instanceof Date
                                      ? vehicle.lastMaintenance.toLocaleDateString()
                                      : vehicle.lastMaintenance}
                                  </span>
                                </div>
                              )}
                              {vehicle.nextMaintenance && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Next Maintenance</span>
                                  <span className="font-medium">
                                    {vehicle.nextMaintenance instanceof Date
                                      ? vehicle.nextMaintenance.toLocaleDateString()
                                      : vehicle.nextMaintenance}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {vehicle.status === 'active' && (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                              <CheckCircle className="h-4 w-4" />
                              <span>Currently active</span>
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
                ))
              )}
            </TabsContent>

            {/* Drivers Tab */}
            <TabsContent value="drivers" className="mt-6 space-y-4">
              {filteredDrivers.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No drivers</h3>
                    <p className="text-gray-500 mt-1">Add your first driver to get started</p>
                    <Button onClick={() => setShowAddDriver(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Driver
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredDrivers.map((driver) => (
                  <Card key={driver._id} className="hover:shadow-md transition-shadow">
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

                          <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Total Deliveries</p>
                              <p className="text-lg font-semibold text-gray-900">{driver.deliveriesCompleted}</p>
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
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Add a new vehicle to your fleet</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="vehicleName">Vehicle Name</Label>
              <Input
                id="vehicleName"
                value={vehicleForm.name}
                onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                placeholder="e.g., Delivery Truck #1"
              />
            </div>
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={vehicleForm.make}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                placeholder="e.g., Ford"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                placeholder="e.g., Transit"
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
              />
            </div>
            <div>
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                value={vehicleForm.licensePlate}
                onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value.toUpperCase() })}
                placeholder="e.g., ABC-1234"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                value={vehicleForm.capacity}
                onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                placeholder="e.g., 5000 lbs"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={vehicleForm.status}
                onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="available">Available</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVehicle(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleAddVehicle} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDriver} onOpenChange={setShowAddDriver}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>Add a new driver to your fleet</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="driverName">Full Name</Label>
              <Input
                id="driverName"
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                placeholder="e.g., (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={driverForm.email}
                onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                placeholder="e.g., john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="licensedSince">Licensed Since</Label>
              <Input
                id="licensedSince"
                value={driverForm.licensedSince}
                onChange={(e) => setDriverForm({ ...driverForm, licensedSince: e.target.value })}
                placeholder="e.g., 2020"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="driverStatus">Status</Label>
              <select
                id="driverStatus"
                value={driverForm.status}
                onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="off_duty">Off Duty</option>
                <option value="scheduled">Scheduled</option>
                <option value="on_route">On Route</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDriver(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
