'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Package,
  Truck,
  Plus,
  Eye
} from 'lucide-react';

// Mock schedule data
const mockSchedule = [
  {
    id: 'SCH-001',
    date: '2025-11-06',
    timeSlot: '7:00 AM - 2:00 PM',
    type: 'pickup',
    location: 'Green Valley Farm',
    address: '123 Farm Rd, Portland, OR',
    driver: 'John Smith',
    vehicle: 'Truck #3',
    items: ['Tomatoes (50 lbs)', 'Lettuce (30 lbs)'],
    notes: 'Early morning pickup preferred',
    status: 'scheduled',
  },
  {
    id: 'SCH-002',
    date: '2025-11-06',
    timeSlot: '10:00 AM - 12:00 PM',
    type: 'delivery',
    location: 'Fresh Bistro',
    address: '456 Main St, Portland, OR',
    driver: 'John Smith',
    vehicle: 'Truck #3',
    items: ['Tomatoes (15 lbs)', 'Lettuce (10 lbs)'],
    notes: 'Use back entrance',
    status: 'scheduled',
  },
  {
    id: 'SCH-003',
    date: '2025-11-06',
    timeSlot: '8:30 AM - 10:30 AM',
    type: 'pickup',
    location: 'Sunny Acres',
    address: '789 Oak Ave, Beaverton, OR',
    driver: 'Sarah Johnson',
    vehicle: 'Van #5',
    items: ['Carrots (40 lbs)', 'Peppers (20 lbs)'],
    notes: '',
    status: 'scheduled',
  },
  {
    id: 'SCH-004',
    date: '2025-11-07',
    timeSlot: '9:00 AM - 11:00 AM',
    type: 'pickup',
    location: 'Harvest Hill Farm',
    address: '321 Hill Rd, Hillsboro, OR',
    driver: 'Mike Davis',
    vehicle: 'Truck #1',
    items: ['Spinach (25 lbs)', 'Kale (20 lbs)'],
    notes: 'Contact farm manager on arrival',
    status: 'confirmed',
  },
  {
    id: 'SCH-005',
    date: '2025-11-07',
    timeSlot: '7:00 AM - 9:00 AM',
    type: 'delivery',
    location: 'Urban Kitchen',
    address: '654 Pine Rd, Portland, OR',
    driver: 'Lisa Brown',
    vehicle: 'Van #2',
    items: ['Mixed Greens (15 lbs)', 'Herbs (5 lbs)'],
    notes: 'Deliver to chef directly',
    status: 'confirmed',
  },
];

export default function DistributorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 10, 6));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<typeof mockSchedule[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const getScheduleForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockSchedule.filter(sch => sch.date === dateStr);
  };

  const selectedDateSchedules = selectedDate ? getScheduleForDate(selectedDate) : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'pickup' ? (
      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
        Pickup
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
        Delivery
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">Plan and manage pickup and delivery schedules</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {selectedDateSchedules.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total stops</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {selectedDateSchedules.filter(s => s.type === 'pickup').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Scheduled pickups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {selectedDateSchedules.filter(s => s.type === 'delivery').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Scheduled deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{mockSchedule.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total schedules</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="text-gray-600">Selected Date</span>
                <span className="font-semibold">
                  {selectedDate?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Schedules</span>
                <span className="font-semibold">{selectedDateSchedules.length} items</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Schedules for {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateSchedules.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No schedules</h3>
                <p className="text-gray-500 mt-1">No pickups or deliveries scheduled for this date</p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSchedules.map((schedule) => (
                  <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeBadge(schedule.type)}
                              {getStatusBadge(schedule.status)}
                            </div>
                            <h4 className="font-semibold text-gray-900">{schedule.location}</h4>
                            <p className="text-sm text-gray-500">{schedule.address}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Time & Details */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{schedule.timeSlot}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>{schedule.driver}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>{schedule.items.length} items</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{schedule.vehicle}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                          {schedule.items.join(', ')}
                        </div>

                        {/* Notes */}
                        {schedule.notes && (
                          <div className="bg-yellow-50 p-2 rounded text-xs text-gray-700 border border-yellow-200">
                            <strong>Note:</strong> {schedule.notes}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Schedule</DialogTitle>
            <DialogDescription>Create a new pickup or delivery schedule</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Type</Label>
              <Select defaultValue="pickup">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" defaultValue="2025-11-06" />
            </div>
            <div>
              <Label>Time Slot</Label>
              <Input placeholder="e.g., 9:00 AM - 11:00 AM" />
            </div>
            <div className="col-span-2">
              <Label>Location Name</Label>
              <Input placeholder="e.g., Green Valley Farm" />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input placeholder="Full address" />
            </div>
            <div>
              <Label>Driver</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Smith</SelectItem>
                  <SelectItem value="sarah">Sarah Johnson</SelectItem>
                  <SelectItem value="mike">Mike Davis</SelectItem>
                  <SelectItem value="lisa">Lisa Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck1">Truck #1</SelectItem>
                  <SelectItem value="truck3">Truck #3</SelectItem>
                  <SelectItem value="van2">Van #2</SelectItem>
                  <SelectItem value="van5">Van #5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notes (Optional)</Label>
              <Input placeholder="Any special instructions..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowAddDialog(false)}>Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getTypeBadge(selectedSchedule.type)}
                {getStatusBadge(selectedSchedule.status)}
              </div>
              <div>
                <Label>Location</Label>
                <p className="text-gray-900 mt-1">{selectedSchedule.location}</p>
                <p className="text-sm text-gray-500">{selectedSchedule.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-gray-900 mt-1">{selectedSchedule.date}</p>
                </div>
                <div>
                  <Label>Time Slot</Label>
                  <p className="text-gray-900 mt-1">{selectedSchedule.timeSlot}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Driver</Label>
                  <p className="text-gray-900 mt-1">{selectedSchedule.driver}</p>
                </div>
                <div>
                  <Label>Vehicle</Label>
                  <p className="text-gray-900 mt-1">{selectedSchedule.vehicle}</p>
                </div>
              </div>
              <div>
                <Label>Items</Label>
                <ul className="mt-2 space-y-1">
                  {selectedSchedule.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700">• {item}</li>
                  ))}
                </ul>
              </div>
              {selectedSchedule.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
                    {selectedSchedule.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
