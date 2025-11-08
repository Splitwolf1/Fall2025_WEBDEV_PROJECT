'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Truck,
  Clock,
  Navigation,
  Plus,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState('ROUTE-301');

  // Mock routes data
  const routes = [
    {
      id: 'ROUTE-301',
      name: 'Morning Route A',
      driver: 'John Smith',
      vehicle: 'VAN-042',
      status: 'in_progress',
      startTime: '8:00 AM',
      estimatedEnd: '2:30 PM',
      totalDistance: '45 miles',
      totalStops: 5,
      completedStops: 2,
      stops: [
        {
          id: 1,
          type: 'pickup',
          name: 'Green Valley Farm',
          address: '123 Farm Road, Greenville',
          time: '8:00 AM - 8:30 AM',
          status: 'completed',
          items: ['Tomatoes (50 lbs)', 'Lettuce (30 lbs)'],
          notes: 'Check cold storage temperature',
        },
        {
          id: 2,
          type: 'delivery',
          name: 'Fresh Bistro',
          address: '456 Main St, Downtown',
          time: '9:00 AM - 9:15 AM',
          status: 'completed',
          items: ['Tomatoes (15 lbs)', 'Lettuce (10 lbs)'],
          notes: 'Back entrance delivery',
        },
        {
          id: 3,
          type: 'delivery',
          name: 'Organic Kitchen',
          address: '789 Oak Avenue, Midtown',
          time: '10:00 AM - 10:15 AM',
          status: 'in_progress',
          items: ['Tomatoes (20 lbs)', 'Lettuce (15 lbs)'],
          notes: 'Contact manager on arrival',
        },
        {
          id: 4,
          type: 'delivery',
          name: 'Downtown Market',
          address: '321 Market Street, City Center',
          time: '11:30 AM - 11:45 AM',
          status: 'pending',
          items: ['Tomatoes (10 lbs)', 'Lettuce (5 lbs)'],
          notes: '',
        },
        {
          id: 5,
          type: 'pickup',
          name: 'Sunrise Organics',
          address: '555 Organic Lane, Farmtown',
          time: '1:00 PM - 1:30 PM',
          status: 'pending',
          items: ['Mixed Vegetables (100 lbs)'],
          notes: 'Refrigerated truck required',
        },
      ],
    },
    {
      id: 'ROUTE-302',
      name: 'Afternoon Route B',
      driver: 'Sarah Johnson',
      vehicle: 'TRUCK-015',
      status: 'scheduled',
      startTime: '2:00 PM',
      estimatedEnd: '6:00 PM',
      totalDistance: '38 miles',
      totalStops: 4,
      completedStops: 0,
      stops: [
        {
          id: 1,
          type: 'pickup',
          name: 'Harvest Hills',
          address: '777 Hill Road, Countryside',
          time: '2:00 PM - 2:30 PM',
          status: 'pending',
          items: ['Corn (150 lbs)', 'Potatoes (200 lbs)'],
          notes: '',
        },
        {
          id: 2,
          type: 'delivery',
          name: 'City Grill',
          address: '888 Restaurant Row, Downtown',
          time: '3:15 PM - 3:30 PM',
          status: 'pending',
          items: ['Corn (50 lbs)', 'Potatoes (75 lbs)'],
          notes: '',
        },
        {
          id: 3,
          type: 'delivery',
          name: 'Fresh Express Market',
          address: '999 Plaza Drive, Shopping District',
          time: '4:30 PM - 4:45 PM',
          status: 'pending',
          items: ['Corn (100 lbs)', 'Potatoes (125 lbs)'],
          notes: 'Loading dock access',
        },
        {
          id: 4,
          type: 'pickup',
          name: 'Berry Best Farm',
          address: '222 Berry Lane, Farmland',
          time: '5:15 PM - 5:45 PM',
          status: 'pending',
          items: ['Strawberries (50 lbs)'],
          notes: 'Handle with care',
        },
      ],
    },
  ];

  const currentRoute = routes.find(r => r.id === selectedRoute) || routes[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'pending':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStopIcon = (type: string) => {
    return type === 'pickup' ? (
      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
        <MapPin className="h-4 w-4 text-green-600" />
      </div>
    ) : (
      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
        <MapPin className="h-4 w-4 text-blue-600" />
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Route Planning</h1>
            <p className="text-gray-500 mt-1">Manage delivery routes and optimize schedules</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Plan New Route
          </Button>
        </div>

        {/* Route Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select Route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name} - {route.driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge className={getStatusColor(currentRoute.status)} variant="secondary">
                {currentRoute.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Route Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Route Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Driver</span>
                  </div>
                  <span className="font-medium">{currentRoute.driver}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Vehicle</span>
                  </div>
                  <span className="font-medium">{currentRoute.vehicle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Start Time</span>
                  </div>
                  <span className="font-medium">{currentRoute.startTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Est. End</span>
                  </div>
                  <span className="font-medium">{currentRoute.estimatedEnd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Distance</span>
                  </div>
                  <span className="font-medium">{currentRoute.totalDistance}</span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {currentRoute.completedStops}/{currentRoute.totalStops} stops
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{
                        width: `${(currentRoute.completedStops / currentRoute.totalStops) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {currentRoute.status === 'in_progress' ? (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Pause className="h-3 w-3" />
                      Pause
                    </Button>
                    <Button size="sm" className="flex-1 gap-1">
                      <Navigation className="h-3 w-3" />
                      Navigate
                    </Button>
                  </div>
                ) : currentRoute.status === 'scheduled' ? (
                  <Button className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Start Route
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {/* Map Preview */}
            <Card>
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Route Map</p>
                    <p className="text-xs text-gray-500 mt-1">{currentRoute.totalDistance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stop List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Route Stops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentRoute.stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className={`border rounded-lg p-4 ${
                        stop.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : stop.status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            {getStopIcon(stop.type)}
                            {stop.status === 'completed' && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          {index < currentRoute.stops.length - 1 && (
                            <div
                              className={`w-0.5 h-16 mt-2 ${
                                stop.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">
                                  Stop #{stop.id}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={
                                    stop.type === 'pickup'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {stop.type}
                                </Badge>
                                <Badge className={getStatusColor(stop.status)}>
                                  {stop.status}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-gray-900 mt-1">{stop.name}</h4>
                              <p className="text-sm text-gray-500">{stop.address}</p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{stop.time}</span>
                            </div>

                            {stop.notes && (
                              <div className="flex items-start gap-2 text-gray-600">
                                <AlertCircle className="h-4 w-4 mt-0.5" />
                                <span className="italic">{stop.notes}</span>
                              </div>
                            )}

                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500 mb-1">Items:</p>
                              <ul className="text-sm space-y-1">
                                {stop.items.map((item, i) => (
                                  <li key={i} className="text-gray-700">
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {stop.status === 'in_progress' && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Mark Complete
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Navigation className="h-3 w-3" />
                                Navigate
                              </Button>
                            </div>
                          )}

                          {stop.status === 'pending' && currentRoute.status === 'in_progress' && (
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" className="gap-1">
                                <Navigation className="h-3 w-3" />
                                Get Directions
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
