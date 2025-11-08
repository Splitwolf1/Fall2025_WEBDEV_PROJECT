'use client';

import { useState } from 'react';
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
  Pause
} from 'lucide-react';

// Mock delivery data
const mockDeliveries = [
  {
    id: 'DEL-101',
    routeId: 'RT-301',
    driver: 'John Smith',
    driverPhone: '(555) 123-4567',
    vehicle: 'Truck #3 (ABC-1234)',
    status: 'in_progress',
    progress: 40,
    currentStop: 2,
    totalStops: 5,
    startTime: '7:00 AM',
    estimatedCompletion: '2:30 PM',
    stops: [
      { name: 'Green Valley Farm', type: 'pickup', status: 'completed', time: '7:30 AM' },
      { name: 'Sunny Acres', type: 'pickup', status: 'completed', time: '8:45 AM' },
      { name: 'Fresh Bistro', type: 'delivery', status: 'in_progress', time: '10:00 AM' },
      { name: 'Green Leaf Restaurant', type: 'delivery', status: 'pending', time: '11:30 AM' },
      { name: 'Farm Table Cafe', type: 'delivery', status: 'pending', time: '1:00 PM' },
    ],
  },
  {
    id: 'DEL-102',
    routeId: 'RT-302',
    driver: 'Sarah Johnson',
    driverPhone: '(555) 234-5678',
    vehicle: 'Van #5 (XYZ-5678)',
    status: 'scheduled',
    progress: 0,
    currentStop: 0,
    totalStops: 4,
    startTime: '8:30 AM',
    estimatedCompletion: '1:00 PM',
    stops: [
      { name: 'Harvest Hill Farm', type: 'pickup', status: 'pending', time: '9:00 AM' },
      { name: 'Organic Meadows', type: 'pickup', status: 'pending', time: '10:15 AM' },
      { name: 'Urban Kitchen', type: 'delivery', status: 'pending', time: '11:45 AM' },
      { name: 'Harvest Moon Grill', type: 'delivery', status: 'pending', time: '12:30 PM' },
    ],
  },
  {
    id: 'DEL-103',
    routeId: 'RT-303',
    driver: 'Mike Davis',
    driverPhone: '(555) 345-6789',
    vehicle: 'Truck #1 (LMN-9012)',
    status: 'completed',
    progress: 100,
    currentStop: 6,
    totalStops: 6,
    startTime: '6:00 AM',
    estimatedCompletion: '1:00 PM',
    completedAt: '12:45 PM',
    stops: [
      { name: 'Green Valley Farm', type: 'pickup', status: 'completed', time: '6:30 AM' },
      { name: 'Sunny Acres', type: 'pickup', status: 'completed', time: '7:45 AM' },
      { name: 'Fresh Bistro', type: 'delivery', status: 'completed', time: '9:00 AM' },
      { name: 'Urban Kitchen', type: 'delivery', status: 'completed', time: '10:30 AM' },
      { name: 'Green Leaf Restaurant', type: 'delivery', status: 'completed', time: '11:45 AM' },
      { name: 'Farm Table Cafe', type: 'delivery', status: 'completed', time: '12:30 PM' },
    ],
  },
];

type DeliveryStatus = 'all' | 'scheduled' | 'in_progress' | 'completed';

export default function DistributorDeliveriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus>('all');

  const filteredDeliveries = mockDeliveries.filter(delivery => {
    const matchesSearch =
      delivery.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: mockDeliveries.length,
    scheduled: mockDeliveries.filter(d => d.status === 'scheduled').length,
    in_progress: mockDeliveries.filter(d => d.status === 'in_progress').length,
    completed: mockDeliveries.filter(d => d.status === 'completed').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">In Progress</Badge>;
      case 'completed':
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
              {mockDeliveries.reduce((sum, d) => sum + d.totalStops, 0)}
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
          {filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No deliveries found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredDeliveries.map((delivery) => (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{delivery.id}</h3>
                          {getStatusBadge(delivery.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Route {delivery.routeId}</p>
                      </div>
                      {delivery.status === 'scheduled' && (
                        <Button>
                          <Play className="h-4 w-4 mr-2" />
                          Start Route
                        </Button>
                      )}
                      {delivery.status === 'in_progress' && (
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
                        <span>Driver: {delivery.driver}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{delivery.driverPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Navigation className="h-4 w-4" />
                        <span>{delivery.vehicle}</span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-gray-500">Start Time</p>
                        <p className="font-medium text-gray-900">{delivery.startTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">
                          {delivery.status === 'completed' ? 'Completed At' : 'Est. Completion'}
                        </p>
                        <p className="font-medium text-gray-900">
                          {delivery.status === 'completed'
                            ? delivery.completedAt
                            : delivery.estimatedCompletion}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stops Progress</p>
                        <p className="font-medium text-gray-900">
                          {delivery.currentStop} / {delivery.totalStops} completed
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {delivery.status !== 'scheduled' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Route Progress</span>
                          <span>{delivery.progress}%</span>
                        </div>
                        <Progress value={delivery.progress} className="h-2" />
                      </div>
                    )}

                    {/* Stops List */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Stops ({delivery.totalStops})
                      </h4>
                      <div className="space-y-2">
                        {delivery.stops.map((stop, idx) => (
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
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
