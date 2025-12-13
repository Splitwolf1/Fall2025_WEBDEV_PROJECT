'use client';

import { useState, useEffect } from 'react';
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
  Clock,
  Loader2,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';
import axios from 'axios';

// Types
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
  createdAt: string;
}

interface Facility {
  _id: string;
  name: string;
  email: string;
  role: string;
  businessName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function InspectionsPage() {
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [inspectionType, setInspectionType] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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

  // Fetch facilities (farmers and restaurants)
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const token = auth.getToken();
        // Fetch farmers
        const farmersRes = await axios.get(`${API_BASE}/api/users?role=farmer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Fetch restaurants
        const restaurantsRes = await axios.get(`${API_BASE}/api/users?role=restaurant`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allFacilities = [
          ...(farmersRes.data.users || farmersRes.data || []),
          ...(restaurantsRes.data.users || restaurantsRes.data || []),
        ];
        setFacilities(allFacilities);
      } catch (error) {
        console.error('Failed to fetch facilities:', error);
      }
    };

    fetchFacilities();
  }, []);

  // Filter inspections by tab
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const filteredInspections = inspections.filter(inspection => {
    const scheduledDate = new Date(inspection.scheduledDate);

    switch (selectedTab) {
      case 'today':
        return scheduledDate >= todayStart && scheduledDate < todayEnd;
      case 'upcoming':
        return scheduledDate >= todayEnd && inspection.result === 'pending';
      case 'completed':
        return inspection.result !== 'pending';
      default:
        return true;
    }
  });

  // Calculate stats
  const todayInspections = inspections.filter(i => {
    const d = new Date(i.scheduledDate);
    return d >= todayStart && d < todayEnd;
  });
  const completedToday = todayInspections.filter(i => i.result !== 'pending');
  const passedToday = completedToday.filter(i => i.result === 'pass' || i.result === 'pass_with_warnings');
  const upcomingCount = inspections.filter(i => new Date(i.scheduledDate) >= todayEnd && i.result === 'pending').length;

  // Handle creating inspection
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
        setIsNewInspectionOpen(false);
        // Reset form
        setSelectedFacility('');
        setInspectionType('');
        setScheduledDate('');
        setScheduledTime('');
        setNotes('');
      }
    } catch (error: any) {
      console.error('Failed to schedule inspection:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string, result: string) => {
    if (result !== 'pending') {
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    }
    const scheduledDate = new Date(status);
    if (scheduledDate < now) {
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100'; // in progress
    }
    return 'bg-gray-100 text-gray-800 hover:bg-gray-100'; // scheduled
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'pass':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Passed
          </Badge>
        );
      case 'pass_with_warnings':
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

  const formatInspectionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
                    <Label htmlFor="facility">Facility *</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="type">Inspection Type *</Label>
                    <Select value={inspectionType} onValueChange={setInspectionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="complaint_based">Complaint-Based</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Inspection Date *</Label>
                    <input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or notes..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewInspectionOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleScheduleInspection} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
              <div className="text-2xl font-bold">{todayInspections.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {completedToday.length} completed
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
              <div className="text-2xl font-bold text-green-600">
                {completedToday.length > 0
                  ? Math.round((passedToday.length / completedToday.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {passedToday.length}/{completedToday.length} passed
              </p>
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
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Inspections
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspections.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {inspections.filter(i => i.result === 'pending').length} pending
              </p>
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
                {filteredInspections.map((inspection) => (
                  <Card key={inspection._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              INS-{inspection._id.slice(-6).toUpperCase()}
                            </span>
                            <Badge
                              className={getStatusColor(inspection.scheduledDate, inspection.result)}
                              variant="secondary"
                            >
                              {inspection.result === 'pending'
                                ? (new Date(inspection.scheduledDate) < now ? 'in progress' : 'scheduled')
                                : 'completed'}
                            </Badge>
                            {inspection.result !== 'pending' && getResultBadge(inspection.result)}
                            <Badge variant="outline">{formatInspectionType(inspection.inspectionType)}</Badge>
                          </div>

                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {inspection.targetName}
                          </h3>

                          <div className="space-y-1 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{inspection.targetType === 'farm' ? 'Farm' : 'Restaurant'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Scheduled: {formatDate(inspection.scheduledDate)}</span>
                            </div>
                            {inspection.completedDate && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Completed: {formatDate(inspection.completedDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {inspection.result === 'pending' && new Date(inspection.scheduledDate) > now && (
                            <Button size="sm">Start Inspection</Button>
                          )}
                          {inspection.result === 'pending' && new Date(inspection.scheduledDate) <= now && (
                            <Button size="sm">Continue</Button>
                          )}
                          {inspection.result !== 'pending' && (
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

                {filteredInspections.length === 0 && (
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
