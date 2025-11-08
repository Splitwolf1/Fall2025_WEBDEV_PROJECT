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
  Eye,
  Plus,
  CheckCircle,
  AlertCircle,
  Building
} from 'lucide-react';

// Mock inspection schedule data
const mockInspections = [
  {
    id: 'INS-001',
    date: '2025-11-06',
    time: '9:00 AM',
    facilityName: 'Green Valley Farm',
    facilityType: 'Farm',
    address: '123 Farm Rd, Portland, OR',
    inspectionType: 'Routine',
    inspector: 'You',
    status: 'scheduled',
    priority: 'normal',
  },
  {
    id: 'INS-002',
    date: '2025-11-06',
    time: '2:00 PM',
    facilityName: 'Fresh Distribution Center',
    facilityType: 'Distributor',
    address: '456 Industrial Way, Portland, OR',
    inspectionType: 'Routine',
    inspector: 'You',
    status: 'scheduled',
    priority: 'normal',
  },
  {
    id: 'INS-003',
    date: '2025-11-07',
    time: '10:00 AM',
    facilityName: 'Sunny Acres',
    facilityType: 'Farm',
    address: '789 Oak Ave, Beaverton, OR',
    inspectionType: 'Follow-up',
    inspector: 'You',
    status: 'scheduled',
    priority: 'high',
    notes: 'Follow-up on previous violation',
  },
  {
    id: 'INS-004',
    date: '2025-11-07',
    time: '3:00 PM',
    facilityName: 'Harvest Hill Farm',
    facilityType: 'Farm',
    address: '321 Hill Rd, Hillsboro, OR',
    inspectionType: 'Complaint-based',
    inspector: 'You',
    status: 'scheduled',
    priority: 'urgent',
    notes: 'Customer complaint received',
  },
  {
    id: 'INS-005',
    date: '2025-11-08',
    time: '11:00 AM',
    facilityName: 'Fresh Bistro',
    facilityType: 'Restaurant',
    address: '123 Main St, Portland, OR',
    inspectionType: 'Routine',
    inspector: 'You',
    status: 'scheduled',
    priority: 'normal',
  },
];

export default function InspectorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 10, 6));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<typeof mockInspections[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const getInspectionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockInspections.filter(ins => ins.date === dateStr);
  };

  const selectedDateInspections = selectedDate ? getInspectionsForDate(selectedDate) : [];

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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
      case 'normal':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Normal</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getFacilityIcon = (type: string) => {
    return <Building className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspection Schedule</h1>
          <p className="text-gray-600 mt-1">Manage your inspection calendar</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Inspection
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {selectedDateInspections.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mockInspections.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total inspections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockInspections.filter(i => i.priority === 'urgent').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Priority cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mockInspections.filter(i => i.inspectionType === 'Follow-up').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
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
                <span className="text-gray-600">Inspections</span>
                <span className="font-semibold">{selectedDateInspections.length} scheduled</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <p className="text-xs font-medium text-gray-700">Priority Legend</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Urgent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600">High Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">Normal</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspection List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Inspections for {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateInspections.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No inspections scheduled</h3>
                <p className="text-gray-500 mt-1">No inspections scheduled for this date</p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Inspection
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateInspections
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((inspection) => (
                    <Card
                      key={inspection.id}
                      className={`hover:shadow-md transition-shadow ${
                        inspection.priority === 'urgent'
                          ? 'border-l-4 border-l-red-500'
                          : inspection.priority === 'high'
                          ? 'border-l-4 border-l-orange-500'
                          : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{inspection.inspectionType}</Badge>
                                {getPriorityBadge(inspection.priority)}
                                {getStatusBadge(inspection.status)}
                              </div>
                              <h4 className="font-semibold text-gray-900">{inspection.facilityName}</h4>
                              <p className="text-sm text-gray-500">{inspection.address}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInspection(inspection);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{inspection.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              {getFacilityIcon(inspection.facilityType)}
                              <span>{inspection.facilityType}</span>
                            </div>
                          </div>

                          {/* Notes */}
                          {inspection.notes && (
                            <div className="bg-yellow-50 p-2 rounded text-xs text-gray-700 border border-yellow-200 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <span>{inspection.notes}</span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Start Inspection
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <MapPin className="h-4 w-4 mr-2" />
                              Get Directions
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Inspection Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Inspection</DialogTitle>
            <DialogDescription>Create a new inspection appointment</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" defaultValue="2025-11-06" />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" defaultValue="09:00" />
            </div>
            <div className="col-span-2">
              <Label>Facility Name</Label>
              <Input placeholder="e.g., Green Valley Farm" />
            </div>
            <div>
              <Label>Facility Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farm">Farm</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inspection Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="complaint">Complaint-based</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input placeholder="Full address" />
            </div>
            <div className="col-span-2">
              <Label>Priority</Label>
              <Select defaultValue="normal">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notes (Optional)</Label>
              <Input placeholder="Any special notes or instructions..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowAddDialog(false)}>Schedule Inspection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{selectedInspection.inspectionType}</Badge>
                {getPriorityBadge(selectedInspection.priority)}
                {getStatusBadge(selectedInspection.status)}
              </div>
              <div>
                <Label>Facility</Label>
                <p className="text-gray-900 mt-1 font-semibold">{selectedInspection.facilityName}</p>
                <p className="text-sm text-gray-500">{selectedInspection.facilityType}</p>
              </div>
              <div>
                <Label>Address</Label>
                <p className="text-gray-900 mt-1">{selectedInspection.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-gray-900 mt-1">{selectedInspection.date}</p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p className="text-gray-900 mt-1">{selectedInspection.time}</p>
                </div>
              </div>
              <div>
                <Label>Inspector</Label>
                <p className="text-gray-900 mt-1">{selectedInspection.inspector}</p>
              </div>
              {selectedInspection.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
                    {selectedInspection.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            <Button onClick={() => setShowDetailDialog(false)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Start Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
