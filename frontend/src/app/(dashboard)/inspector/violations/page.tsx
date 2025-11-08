'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Calendar,
  MapPin,
  TrendingDown,
  AlertCircleIcon
} from 'lucide-react';

// Mock violations data
const mockViolations = [
  {
    id: 'VIO-001',
    facilityName: 'Harvest Hill Farm',
    facilityType: 'Farm',
    address: '321 Hill Rd, Hillsboro, OR',
    date: '2025-11-02',
    category: 'Temperature Control',
    severity: 'critical',
    description: 'Cold storage temperature exceeded 45°F (found at 52°F)',
    inspector: 'You',
    status: 'open',
    dueDate: '2025-11-16',
    correctiveAction: 'Facility must repair refrigeration unit and provide proof of temperature logs',
  },
  {
    id: 'VIO-002',
    facilityName: 'Fresh Bistro',
    facilityType: 'Restaurant',
    address: '123 Main St, Portland, OR',
    date: '2025-10-30',
    category: 'Cleanliness',
    severity: 'major',
    description: 'Food contact surfaces not properly sanitized',
    inspector: 'You',
    status: 'in_progress',
    dueDate: '2025-11-13',
    correctiveAction: 'Implement proper sanitization schedule and staff training',
  },
  {
    id: 'VIO-003',
    facilityName: 'Sunny Acres',
    facilityType: 'Farm',
    address: '789 Oak Ave, Beaverton, OR',
    date: '2025-10-28',
    category: 'Documentation',
    severity: 'minor',
    description: 'Incomplete pesticide application records',
    inspector: 'You',
    status: 'resolved',
    dueDate: '2025-11-11',
    correctiveAction: 'Complete all missing documentation for past 6 months',
    resolvedDate: '2025-11-04',
  },
  {
    id: 'VIO-004',
    facilityName: 'Fresh Distribution Center',
    facilityType: 'Distributor',
    address: '456 Industrial Way, Portland, OR',
    date: '2025-10-25',
    category: 'Storage Conditions',
    severity: 'major',
    description: 'Raw and ready-to-eat products stored together',
    inspector: 'You',
    status: 'in_progress',
    dueDate: '2025-11-08',
    correctiveAction: 'Implement proper storage separation and labeling system',
  },
  {
    id: 'VIO-005',
    facilityName: 'Green Valley Farm',
    facilityType: 'Farm',
    address: '123 Farm Rd, Portland, OR',
    date: '2025-10-20',
    category: 'Labeling',
    severity: 'minor',
    description: 'Missing allergen information on packaged products',
    inspector: 'You',
    status: 'resolved',
    dueDate: '2025-11-03',
    correctiveAction: 'Update all product labels with complete allergen information',
    resolvedDate: '2025-11-01',
  },
  {
    id: 'VIO-006',
    facilityName: 'Urban Kitchen',
    facilityType: 'Restaurant',
    address: '321 Pine Rd, Portland, OR',
    date: '2025-10-18',
    category: 'Temperature Control',
    severity: 'critical',
    description: 'No temperature monitoring system in place',
    inspector: 'John Davis',
    status: 'open',
    dueDate: '2025-11-01',
    correctiveAction: 'Install temperature monitoring system and maintain daily logs',
    overdueBy: 4,
  },
];

type ViolationStatus = 'all' | 'open' | 'in_progress' | 'resolved' | 'overdue';

export default function InspectorViolationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ViolationStatus>('all');
  const [selectedViolation, setSelectedViolation] = useState<typeof mockViolations[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredViolations = mockViolations.filter(violation => {
    const matchesSearch =
      violation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'overdue') {
      return matchesSearch && violation.overdueBy;
    }
    const matchesStatus = statusFilter === 'all' || violation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: mockViolations.length,
    open: mockViolations.filter(v => v.status === 'open').length,
    in_progress: mockViolations.filter(v => v.status === 'in_progress').length,
    resolved: mockViolations.filter(v => v.status === 'resolved').length,
    overdue: mockViolations.filter(v => v.overdueBy).length,
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      case 'major':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Major</Badge>;
      case 'minor':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Minor</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string, overdueBy?: number) => {
    if (overdueBy) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue ({overdueBy} days)</Badge>;
    }
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'major':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'minor':
        return <AlertCircleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Violations Management</h1>
        <p className="text-gray-600 mt-1">Track and manage compliance violations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.open}</div>
            <p className="text-xs text-gray-500 mt-1">Needs action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.in_progress}</div>
            <p className="text-xs text-gray-500 mt-1">Being resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.overdue}</div>
            <p className="text-xs text-gray-500 mt-1">Past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <span className="text-xs text-gray-500">Good trend</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by violation ID, facility, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as ViolationStatus)}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="open">Open ({statusCounts.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({statusCounts.overdue})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({statusCounts.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6 space-y-4">
          {filteredViolations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No violations found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredViolations.map((violation) => (
              <Card
                key={violation.id}
                className={`hover:shadow-md transition-shadow ${
                  violation.overdueBy ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full flex-shrink-0">
                      {getSeverityIcon(violation.severity)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{violation.id}</h3>
                            {getSeverityBadge(violation.severity)}
                            {getStatusBadge(violation.status, violation.overdueBy)}
                          </div>
                          <p className="text-sm text-gray-500">{violation.category}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900">{violation.facilityName}</h4>
                        <p className="text-sm text-gray-600">{violation.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{violation.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Reported: {violation.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Due: {violation.dueDate}</span>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-sm font-medium text-gray-900 mb-1">Corrective Action Required:</p>
                        <p className="text-sm text-gray-700">{violation.correctiveAction}</p>
                      </div>

                      {violation.status === 'resolved' && violation.resolvedDate && (
                        <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Resolved on {violation.resolvedDate}
                          </span>
                        </div>
                      )}

                      {violation.overdueBy && (
                        <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">
                            Overdue by {violation.overdueBy} days - Immediate action required
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-40">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedViolation(violation);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {violation.status !== 'resolved' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Violation Details - {selectedViolation?.id}</DialogTitle>
            <DialogDescription>Complete violation information</DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getSeverityBadge(selectedViolation.severity)}
                {getStatusBadge(selectedViolation.status, selectedViolation.overdueBy)}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Facility</label>
                <p className="text-gray-900 mt-1 font-semibold">{selectedViolation.facilityName}</p>
                <p className="text-sm text-gray-500">{selectedViolation.facilityType}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900 mt-1">{selectedViolation.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Reported Date</label>
                  <p className="text-gray-900 mt-1">{selectedViolation.date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Due Date</label>
                  <p className="text-gray-900 mt-1">{selectedViolation.dueDate}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-gray-900 mt-1">{selectedViolation.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 mt-1">{selectedViolation.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Corrective Action Required</label>
                <p className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
                  {selectedViolation.correctiveAction}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Inspector</label>
                <p className="text-gray-900 mt-1">{selectedViolation.inspector}</p>
              </div>

              {selectedViolation.resolvedDate && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-green-900">Resolution</label>
                  <p className="text-green-800 mt-1">Resolved on {selectedViolation.resolvedDate}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedViolation?.status !== 'resolved' && (
              <Button className="bg-green-600 hover:bg-green-700">Mark as Resolved</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
