'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  Plus,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InspectionsPage() {
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('today');

  // Mock inspection data
  const inspections = {
    today: [
      {
        id: 'INS-701',
        facility: 'Green Valley Farm',
        address: '123 Farm Road, Greenville',
        type: 'Routine',
        scheduledTime: '9:00 AM',
        status: 'completed',
        result: 'pass',
        inspector: 'Sarah Johnson',
        completedAt: '10:30 AM',
      },
      {
        id: 'INS-702',
        facility: 'Sunrise Organics',
        address: '456 Organic Lane, Farmtown',
        type: 'Follow-up',
        scheduledTime: '11:30 AM',
        status: 'completed',
        result: 'pass_warning',
        inspector: 'Sarah Johnson',
        completedAt: '1:00 PM',
      },
      {
        id: 'INS-703',
        facility: 'Fresh Fields Warehouse',
        address: '789 Storage St, Distribution Center',
        type: 'Routine',
        scheduledTime: '2:00 PM',
        status: 'in_progress',
        result: null,
        inspector: 'Sarah Johnson',
        completedAt: null,
      },
      {
        id: 'INS-704',
        facility: 'Quick Deliver Transport',
        address: '321 Logistics Blvd, City Center',
        type: 'Complaint',
        scheduledTime: '4:30 PM',
        status: 'scheduled',
        result: null,
        inspector: 'Sarah Johnson',
        completedAt: null,
      },
    ],
    upcoming: [
      {
        id: 'INS-705',
        facility: 'Meadow View Farm',
        address: '555 Meadow Road, Countryside',
        type: 'Routine',
        scheduledTime: 'Tomorrow, 8:00 AM',
        status: 'scheduled',
        result: null,
        inspector: 'Sarah Johnson',
        completedAt: null,
      },
      {
        id: 'INS-706',
        facility: 'City Fresh Market',
        address: '777 Market Street, Downtown',
        type: 'Random',
        scheduledTime: 'Tomorrow, 2:00 PM',
        status: 'scheduled',
        result: null,
        inspector: 'Sarah Johnson',
        completedAt: null,
      },
    ],
    completed: [
      {
        id: 'INS-698',
        facility: 'Harvest Hills Farm',
        address: '888 Hill Road, Farmland',
        type: 'Routine',
        scheduledTime: 'Yesterday, 10:00 AM',
        status: 'completed',
        result: 'pass',
        inspector: 'Sarah Johnson',
        completedAt: 'Yesterday, 11:15 AM',
      },
      {
        id: 'INS-699',
        facility: 'Berry Best Farm',
        address: '999 Berry Lane, Rural Area',
        type: 'Follow-up',
        scheduledTime: 'Yesterday, 2:00 PM',
        status: 'completed',
        result: 'fail',
        inspector: 'Sarah Johnson',
        completedAt: 'Yesterday, 3:45 PM',
      },
    ],
  };

  const checklistItems = [
    'Temperature control systems operational',
    'Proper food storage and labeling',
    'Cleanliness and sanitation standards met',
    'Documentation and records up to date',
    'Staff hygiene and safety protocols followed',
    'Equipment maintenance records current',
    'Pest control measures in place',
    'Waste disposal procedures proper',
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;

    switch (result) {
      case 'pass':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Passed
          </Badge>
        );
      case 'pass_warning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pass w/ Warning
          </Badge>
        );
      case 'fail':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const currentInspections = inspections[selectedTab as keyof typeof inspections] || inspections.today;

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
            <p className="text-gray-500 mt-1">Manage and conduct facility inspections</p>
          </div>
          <Dialog open={isNewInspectionOpen} onOpenChange={setIsNewInspectionOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Inspection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Inspection</DialogTitle>
                <DialogDescription>
                  Schedule a new inspection for a facility or follow-up visit
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facility">Facility Name *</Label>
                    <Input id="facility" placeholder="Enter facility name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Inspection Type *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="complaint">Complaint-Based</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" placeholder="Full address" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Inspection Date *</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input id="time" type="time" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or notes..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewInspectionOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsNewInspectionOpen(false)}>
                  Schedule Inspection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Inspections
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspections.today.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {inspections.today.filter(i => i.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pass Rate (Today)
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <p className="text-xs text-gray-500 mt-1">2/2 passed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                Upcoming
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspections.upcoming.length}</div>
              <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Week
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-gray-500 mt-1">15 pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Inspections List */}
        <Card>
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="space-y-4">
                {currentInspections.map((inspection) => (
                  <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{inspection.id}</span>
                            <Badge className={getStatusColor(inspection.status)} variant="secondary">
                              {inspection.status.replace('_', ' ')}
                            </Badge>
                            {inspection.result && getResultBadge(inspection.result)}
                            <Badge variant="outline">{inspection.type}</Badge>
                          </div>

                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {inspection.facility}
                          </h3>

                          <div className="space-y-1 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{inspection.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Scheduled: {inspection.scheduledTime}</span>
                            </div>
                            {inspection.completedAt && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Completed: {inspection.completedAt}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {inspection.status === 'scheduled' && (
                            <Button size="sm">Start Inspection</Button>
                          )}
                          {inspection.status === 'in_progress' && (
                            <Button size="sm">Continue</Button>
                          )}
                          {inspection.status === 'completed' && (
                            <Button variant="outline" size="sm" className="gap-1">
                              <FileText className="h-3 w-3" />
                              View Report
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {currentInspections.length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections</h3>
                    <p className="text-gray-500">No inspections scheduled for this period</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
