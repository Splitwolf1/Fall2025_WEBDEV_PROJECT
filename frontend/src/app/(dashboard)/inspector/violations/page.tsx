'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';
import axios from 'axios';

interface Violation {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  correctiveAction: string;
  deadline?: string;
  status?: 'open' | 'resolved';
  resolvedDate?: string;
}

interface Inspection {
  _id: string;
  inspectorName: string;
  targetType: string;
  targetId: string;
  targetName: string;
  inspectionType: string;
  scheduledDate: string;
  completedDate?: string;
  result: string;
  violations: Violation[];
}

interface ViolationWithInspection extends Violation {
  inspectionId: string;
  facilityName: string;
  facilityType: string;
  inspectionDate: string;
  inspector: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function InspectorViolationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const [violations, setViolations] = useState<ViolationWithInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<ViolationWithInspection | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const currentUser = auth.getCurrentUser();

  // Fetch inspections and extract violations
  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const token = auth.getToken();
        const response = await axios.get(`${API_BASE}/api/inspections`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const inspections: Inspection[] = response.data.inspections || [];

          // Extract violations from all inspections
          const allViolations: ViolationWithInspection[] = [];
          inspections.forEach(inspection => {
            if (inspection.violations && inspection.violations.length > 0) {
              inspection.violations.forEach(violation => {
                allViolations.push({
                  ...violation,
                  inspectionId: inspection._id,
                  facilityName: inspection.targetName,
                  facilityType: inspection.targetType,
                  inspectionDate: inspection.completedDate || inspection.scheduledDate,
                  inspector: inspection.inspectorName,
                  status: violation.status || 'open',
                });
              });
            }
          });

          setViolations(allViolations);
        }
      } catch (error) {
        console.error('Failed to fetch violations:', error);
        toast.error('Failed to load violations');
      } finally {
        setLoading(false);
      }
    };

    fetchViolations();
  }, []);

  // Filter violations
  const filteredViolations = violations.filter(violation => {
    const matchesSearch =
      violation.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'all' || violation.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || violation.status === selectedStatus;

    let matchesTab = true;
    if (selectedTab === 'open') matchesTab = violation.status === 'open';
    if (selectedTab === 'resolved') matchesTab = violation.status === 'resolved';
    if (selectedTab === 'critical') matchesTab = violation.severity === 'critical';

    return matchesSearch && matchesSeverity && matchesStatus && matchesTab;
  });

  // Stats
  const openCount = violations.filter(v => v.status === 'open').length;
  const criticalCount = violations.filter(v => v.severity === 'critical' && v.status === 'open').length;
  const resolvedCount = violations.filter(v => v.status === 'resolved').length;
  const overdueCount = violations.filter(v => {
    if (v.status !== 'open' || !v.deadline) return false;
    return new Date(v.deadline) < new Date();
  }).length;

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

  const getStatusBadge = (status: string, deadline?: string) => {
    const isOverdue = deadline && new Date(deadline) < new Date() && status === 'open';

    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
    }

    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Open</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'major':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'minor':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleResolve = async () => {
    if (!selectedViolation) return;

    // In a real implementation, this would update the violation status via API
    toast.success('Violation marked as resolved');
    setViolations(prev => prev.map(v =>
      v === selectedViolation ? { ...v, status: 'resolved' as const, resolvedDate: new Date().toISOString() } : v
    ));
    setShowResolveDialog(false);
    setResolutionNotes('');
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Violations</h1>
        <p className="text-gray-600 mt-1">Track and manage compliance violations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openCount}</div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-gray-500 mt-1">Immediate action needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overdueCount}</div>
            <p className="text-xs text-gray-500 mt-1">Past deadline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            <p className="text-xs text-gray-500 mt-1">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search violations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle>Violations ({filteredViolations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open ({openCount})</TabsTrigger>
              <TabsTrigger value="critical">Critical ({criticalCount})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab}>
              {filteredViolations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No violations found</h3>
                  <p className="text-gray-500 mt-1">No violations match your current filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredViolations.map((violation, index) => (
                    <Card
                      key={`${violation.inspectionId}-${index}`}
                      className={`hover:shadow-md transition-shadow ${violation.severity === 'critical'
                          ? 'border-l-4 border-l-red-500'
                          : violation.severity === 'major'
                            ? 'border-l-4 border-l-orange-500'
                            : 'border-l-4 border-l-yellow-500'
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {getSeverityIcon(violation.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {getSeverityBadge(violation.severity)}
                                {getStatusBadge(violation.status || 'open', violation.deadline)}
                                <Badge variant="outline">{violation.category}</Badge>
                              </div>
                              <h4 className="font-semibold text-gray-900">{violation.facilityName}</h4>
                              <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(violation.inspectionDate)}
                                </span>
                                {violation.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Due: {formatDate(violation.deadline)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedViolation(violation);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {violation.status === 'open' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedViolation(violation);
                                  setShowResolveDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {getSeverityBadge(selectedViolation.severity)}
                {getStatusBadge(selectedViolation.status || 'open', selectedViolation.deadline)}
                <Badge variant="outline">{selectedViolation.category}</Badge>
              </div>
              <div>
                <Label>Facility</Label>
                <p className="text-gray-900 mt-1 font-semibold">{selectedViolation.facilityName}</p>
                <p className="text-sm text-gray-500">{selectedViolation.facilityType}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-gray-900 mt-1">{selectedViolation.description}</p>
              </div>
              <div>
                <Label>Corrective Action Required</Label>
                <p className="text-gray-900 mt-1 bg-blue-50 p-3 rounded">{selectedViolation.correctiveAction}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date Found</Label>
                  <p className="text-gray-900 mt-1">{formatDate(selectedViolation.inspectionDate)}</p>
                </div>
                {selectedViolation.deadline && (
                  <div>
                    <Label>Deadline</Label>
                    <p className="text-gray-900 mt-1">{formatDate(selectedViolation.deadline)}</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Inspector</Label>
                <p className="text-gray-900 mt-1">{selectedViolation.inspector}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedViolation?.status === 'open' && (
              <Button onClick={() => {
                setShowDetailDialog(false);
                setShowResolveDialog(true);
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Violation</DialogTitle>
            <DialogDescription>
              Confirm that this violation has been addressed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Describe how the violation was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
            <Button onClick={handleResolve}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
