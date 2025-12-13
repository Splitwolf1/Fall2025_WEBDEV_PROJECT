'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Eye,
  Plus,
  CheckCircle,
  AlertCircle,
  Building,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';
import axios from 'axios';

interface Inspection {
  _id: string;
  inspectorId: string;
  inspectorName: string;
  targetType: 'farm' | 'distributor' | 'restaurant';
  targetId: string;
  targetName: string;
  inspectionType: 'routine' | 'random' | 'complaint_based' | 'follow_up';
  scheduledDate: string;
  completedDate?: string;
  result: 'pass' | 'pass_with_warnings' | 'fail' | 'pending';
  violations?: any[];
  inspectorNotes?: string;
}

interface Facility {
  _id: string;
  name: string;
  businessName?: string;
  role: string;
  address?: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function InspectorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedFacility, setSelectedFacility] = useState('');
  const [inspectionType, setInspectionType] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');

  const currentUser = auth.getCurrentUser();

  // Fetch inspections
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const token = auth.getToken();
        const response = await axios.get(`${API_BASE}/api/inspections`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { inspectorId: currentUser?.id },
        });
        if (response.data.success) {
          setInspections(response.data.inspections || []);
        }
      } catch (error) {
        console.error('Failed to fetch inspections:', error);
        toast.error('Failed to load inspections');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchInspections();
    }
  }, [currentUser?.id]);

  // Fetch facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const token = auth.getToken();
        const [farmersRes, restaurantsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/users?role=farmer`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/users?role=restaurant`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const allFacilities = [
          ...(farmersRes.data.users || []),
          ...(restaurantsRes.data.users || []),
        ];
        setFacilities(allFacilities);
      } catch (error) {
        console.error('Failed to fetch facilities:', error);
      }
    };

    fetchFacilities();
  }, []);

  const getInspectionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return inspections.filter(ins => ins.scheduledDate.split('T')[0] === dateStr);
  };

  const selectedDateInspections = selectedDate ? getInspectionsForDate(selectedDate) : [];

  // Stats calculations
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const thisWeekInspections = inspections.filter(i => {
    const d = new Date(i.scheduledDate);
    return d >= weekStart && d < weekEnd;
  });

  const urgentCount = inspections.filter(i => i.inspectionType === 'complaint_based' && i.result === 'pending').length;
  const followUpCount = inspections.filter(i => i.inspectionType === 'follow_up' && i.result === 'pending').length;

  const handleScheduleInspection = async () => {
    if (!selectedFacility || !inspectionType || !scheduledDate || !scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = auth.getToken();
      const facility = facilities.find(f => f._id === selectedFacility);

      const inspectionData = {
        inspectorId: currentUser?.id,
        inspectorName: currentUser?.name || currentUser?.email || 'Inspector',
        targetType: facility?.role === 'farmer' ? 'farm' : 'restaurant',
        targetId: selectedFacility,
        targetName: facility?.businessName || facility?.name || 'Unknown',
        inspectionType: inspectionType,
        scheduledDate: new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
        result: 'pending',
        inspectorNotes: notes,
        checklist: [],
        violations: [],
        recommendations: [],
        photos: [],
      };

      const response = await axios.post(`${API_BASE}/api/inspections`, inspectionData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success('Inspection scheduled successfully!');
        setInspections(prev => [response.data.inspection, ...prev]);
        setShowAddDialog(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Failed to schedule inspection:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFacility('');
    setInspectionType('');
    setScheduledDate('');
    setScheduledTime('');
    setPriority('normal');
    setNotes('');
  };

  const formatInspectionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getStatusBadge = (result: string) => {
    switch (result) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>;
      case 'pass':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Passed</Badge>;
      case 'pass_with_warnings':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pass w/ Warnings</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge>{result}</Badge>;
    }
  };

  const getPriorityBadge = (type: string) => {
    switch (type) {
      case 'complaint_based':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>;
      case 'follow_up':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Follow-up</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
            <CardTitle className="text-sm font-medium text-gray-600">Selected Date</CardTitle>
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
            <div className="text-2xl font-bold text-blue-600">{thisWeekInspections.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total inspections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
            <p className="text-xs text-gray-500 mt-1">Complaint-based</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{followUpCount}</div>
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
                  .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                  .map((inspection) => (
                    <Card
                      key={inspection._id}
                      className={`hover:shadow-md transition-shadow ${inspection.inspectionType === 'complaint_based'
                          ? 'border-l-4 border-l-red-500'
                          : inspection.inspectionType === 'follow_up'
                            ? 'border-l-4 border-l-orange-500'
                            : ''
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline">{formatInspectionType(inspection.inspectionType)}</Badge>
                                {getPriorityBadge(inspection.inspectionType)}
                                {getStatusBadge(inspection.result)}
                              </div>
                              <h4 className="font-semibold text-gray-900">{inspection.targetName}</h4>
                              <p className="text-sm text-gray-500">{inspection.targetType}</p>
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
                              <span className="font-medium">{formatTime(inspection.scheduledDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>{inspection.targetType}</span>
                            </div>
                          </div>

                          {/* Notes */}
                          {inspection.inspectorNotes && (
                            <div className="bg-yellow-50 p-2 rounded text-xs text-gray-700 border border-yellow-200 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <span>{inspection.inspectorNotes}</span>
                            </div>
                          )}

                          {/* Actions */}
                          {inspection.result === 'pending' && (
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

      {/* Add Inspection Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Inspection</DialogTitle>
            <DialogDescription>Create a new inspection appointment</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label>Time *</Label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Label>Facility *</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map(facility => (
                    <SelectItem key={facility._id} value={facility._id}>
                      {facility.businessName || facility.name} ({facility.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Inspection Type *</Label>
              <Select value={inspectionType} onValueChange={setInspectionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="complaint_based">Complaint-based</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any special notes or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleScheduleInspection} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule Inspection
            </Button>
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
                <Badge variant="outline">{formatInspectionType(selectedInspection.inspectionType)}</Badge>
                {getPriorityBadge(selectedInspection.inspectionType)}
                {getStatusBadge(selectedInspection.result)}
              </div>
              <div>
                <Label>Facility</Label>
                <p className="text-gray-900 mt-1 font-semibold">{selectedInspection.targetName}</p>
                <p className="text-sm text-gray-500">{selectedInspection.targetType}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedInspection.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p className="text-gray-900 mt-1">{formatTime(selectedInspection.scheduledDate)}</p>
                </div>
              </div>
              <div>
                <Label>Inspector</Label>
                <p className="text-gray-900 mt-1">{selectedInspection.inspectorName}</p>
              </div>
              {selectedInspection.inspectorNotes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
                    {selectedInspection.inspectorNotes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedInspection?.result === 'pending' && (
              <Button onClick={() => setShowDetailDialog(false)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Start Inspection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
