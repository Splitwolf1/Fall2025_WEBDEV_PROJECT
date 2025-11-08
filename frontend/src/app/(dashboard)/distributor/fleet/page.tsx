'use client';

import { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';

// Mock fleet data
const mockVehicles = [
  {
    id: 'VEH-001',
    name: 'Truck #1',
    make: 'Ford',
    model: 'F-350',
    year: 2022,
    licensePlate: 'LMN-9012',
    status: 'active',
    currentDriver: 'Mike Davis',
    currentLocation: 'En route to Urban Kitchen',
    mileage: 45230,
    lastMaintenance: '2025-10-15',
    nextMaintenance: '2025-12-15',
    fuelLevel: 75,
    capacity: '2000 lbs',
    deliveriesToday: 6,
  },
  {
    id: 'VEH-002',
    name: 'Van #2',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2023,
    licensePlate: 'XYZ-3456',
    status: 'active',
    currentDriver: 'Lisa Brown',
    currentLocation: 'Loading at Green Valley Farm',
    mileage: 28450,
    lastMaintenance: '2025-10-28',
    nextMaintenance: '2025-12-28',
    fuelLevel: 92,
    capacity: '1500 lbs',
    deliveriesToday: 4,
  },
  {
    id: 'VEH-003',
    name: 'Truck #3',
    make: 'Ford',
    model: 'F-450',
    year: 2021,
    licensePlate: 'ABC-1234',
    status: 'active',
    currentDriver: 'John Smith',
    currentLocation: 'En route to Fresh Bistro',
    mileage: 67890,
    lastMaintenance: '2025-10-20',
    nextMaintenance: '2025-12-20',
    fuelLevel: 65,
    capacity: '2500 lbs',
    deliveriesToday: 5,
  },
  {
    id: 'VEH-004',
    name: 'Van #4',
    make: 'Ram',
    model: 'ProMaster',
    year: 2023,
    licensePlate: 'DEF-5678',
    status: 'maintenance',
    currentDriver: null,
    currentLocation: 'Service Center - Main St',
    mileage: 15200,
    lastMaintenance: '2025-11-03',
    nextMaintenance: '2026-01-03',
    fuelLevel: 0,
    capacity: '1200 lbs',
    deliveriesToday: 0,
    maintenanceNote: 'Oil change and tire rotation',
  },
  {
    id: 'VEH-005',
    name: 'Van #5',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2022,
    licensePlate: 'GHI-9012',
    status: 'available',
    currentDriver: null,
    currentLocation: 'Fleet Yard - Warehouse',
    mileage: 34560,
    lastMaintenance: '2025-10-18',
    nextMaintenance: '2025-12-18',
    fuelLevel: 100,
    capacity: '1500 lbs',
    deliveriesToday: 0,
  },
];

const mockDrivers = [
  {
    id: 'DRV-001',
    name: 'John Smith',
    phone: '(555) 123-4567',
    email: 'john.smith@delivery.com',
    status: 'on_route',
    vehicleAssigned: 'Truck #3',
    licensedSince: '2018',
    deliveriesCompleted: 1245,
    rating: 4.9,
    deliveriesToday: 5,
  },
  {
    id: 'DRV-002',
    name: 'Sarah Johnson',
    phone: '(555) 234-5678',
    email: 'sarah.j@delivery.com',
    status: 'scheduled',
    vehicleAssigned: 'Van #5',
    licensedSince: '2020',
    deliveriesCompleted: 856,
    rating: 4.8,
    deliveriesToday: 4,
  },
  {
    id: 'DRV-003',
    name: 'Mike Davis',
    phone: '(555) 345-6789',
    email: 'mike.d@delivery.com',
    status: 'on_route',
    vehicleAssigned: 'Truck #1',
    licensedSince: '2017',
    deliveriesCompleted: 1532,
    rating: 5.0,
    deliveriesToday: 6,
  },
  {
    id: 'DRV-004',
    name: 'Lisa Brown',
    phone: '(555) 456-7890',
    email: 'lisa.b@delivery.com',
    status: 'on_route',
    vehicleAssigned: 'Van #2',
    licensedSince: '2019',
    deliveriesCompleted: 1024,
    rating: 4.7,
    deliveriesToday: 4,
  },
  {
    id: 'DRV-005',
    name: 'Tom Wilson',
    phone: '(555) 567-8901',
    email: 'tom.w@delivery.com',
    status: 'off_duty',
    vehicleAssigned: null,
    licensedSince: '2021',
    deliveriesCompleted: 423,
    rating: 4.6,
    deliveriesToday: 0,
  },
];

export default function DistributorFleetPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');

  const filteredVehicles = mockVehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vehicle.currentDriver?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const filteredDrivers = mockDrivers.filter(driver =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vehicleStats = {
    total: mockVehicles.length,
    active: mockVehicles.filter(v => v.status === 'active').length,
    available: mockVehicles.filter(v => v.status === 'available').length,
    maintenance: mockVehicles.filter(v => v.status === 'maintenance').length,
  };

  const driverStats = {
    total: mockDrivers.length,
    onRoute: mockDrivers.filter(d => d.status === 'on_route').length,
    scheduled: mockDrivers.filter(d => d.status === 'scheduled').length,
    offDuty: mockDrivers.filter(d => d.status === 'off_duty').length,
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600 mt-1">Manage vehicles and drivers</p>
      </div>

      {/* Stats Cards */}
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
              {mockVehicles.reduce((sum, v) => sum + v.deliveriesToday, 0)}
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
    </div>
  );
}
