'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  BarChart3,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';
import axios from 'axios';

interface Inspection {
  _id: string;
  inspectorName: string;
  targetType: string;
  targetId: string;
  targetName: string;
  inspectionType: string;
  scheduledDate: string;
  completedDate?: string;
  result: 'pass' | 'pass_with_warnings' | 'fail' | 'pending';
  overallScore?: number;
  violations?: any[];
}

interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  period: string;
  dateGenerated: string;
  totalInspections: number;
  passRate: number;
  violations: number;
  criticalViolations: number;
  status: 'published' | 'draft';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function InspectorReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTab, setSelectedTab] = useState('reports');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch inspections and generate reports
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = auth.getToken();
        const response = await axios.get(`${API_BASE}/api/inspections`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const data: Inspection[] = response.data.inspections || [];
          setInspections(data);

          // Generate reports from inspection data
          const generatedReports = generateReports(data);
          setReports(generatedReports);
        }
      } catch (error) {
        console.error('Failed to fetch inspections:', error);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate reports from inspection data
  const generateReports = (data: Inspection[]): Report[] => {
    const now = new Date();
    const reports: Report[] = [];

    // Get completed inspections
    const completed = data.filter(i => i.result !== 'pending');

    // Weekly report (current week)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyInspections = completed.filter(i => {
      const date = new Date(i.completedDate || i.scheduledDate);
      return date >= weekStart && date < weekEnd;
    });

    if (weeklyInspections.length > 0 || true) { // Always show even if empty for demo
      const weeklyPassed = weeklyInspections.filter(i => i.result === 'pass' || i.result === 'pass_with_warnings').length;
      const weeklyViolations = weeklyInspections.reduce((acc, i) => acc + (i.violations?.length || 0), 0);
      const weeklyCritical = weeklyInspections.reduce((acc, i) =>
        acc + (i.violations?.filter((v: any) => v.severity === 'critical').length || 0), 0);

      reports.push({
        id: 'weekly-current',
        title: 'Weekly Compliance Report',
        type: 'weekly',
        period: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        dateGenerated: now.toISOString(),
        totalInspections: weeklyInspections.length,
        passRate: weeklyInspections.length > 0 ? Math.round((weeklyPassed / weeklyInspections.length) * 100) : 0,
        violations: weeklyViolations,
        criticalViolations: weeklyCritical,
        status: 'draft',
      });
    }

    // Monthly report (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyInspections = completed.filter(i => {
      const date = new Date(i.completedDate || i.scheduledDate);
      return date >= monthStart && date <= monthEnd;
    });

    const monthlyPassed = monthlyInspections.filter(i => i.result === 'pass' || i.result === 'pass_with_warnings').length;
    const monthlyViolations = monthlyInspections.reduce((acc, i) => acc + (i.violations?.length || 0), 0);
    const monthlyCritical = monthlyInspections.reduce((acc, i) =>
      acc + (i.violations?.filter((v: any) => v.severity === 'critical').length || 0), 0);

    reports.push({
      id: 'monthly-current',
      title: 'Monthly Compliance Report',
      type: 'monthly',
      period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      dateGenerated: now.toISOString(),
      totalInspections: monthlyInspections.length,
      passRate: monthlyInspections.length > 0 ? Math.round((monthlyPassed / monthlyInspections.length) * 100) : 0,
      violations: monthlyViolations,
      criticalViolations: monthlyCritical,
      status: 'draft',
    });

    // Previous month report (published)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const prevMonthlyInspections = completed.filter(i => {
      const date = new Date(i.completedDate || i.scheduledDate);
      return date >= prevMonthStart && date <= prevMonthEnd;
    });

    if (prevMonthlyInspections.length > 0) {
      const prevPassed = prevMonthlyInspections.filter(i => i.result === 'pass' || i.result === 'pass_with_warnings').length;
      const prevViolations = prevMonthlyInspections.reduce((acc, i) => acc + (i.violations?.length || 0), 0);
      const prevCritical = prevMonthlyInspections.reduce((acc, i) =>
        acc + (i.violations?.filter((v: any) => v.severity === 'critical').length || 0), 0);

      reports.push({
        id: 'monthly-prev',
        title: 'Monthly Compliance Report',
        type: 'monthly',
        period: prevMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        dateGenerated: prevMonthEnd.toISOString(),
        totalInspections: prevMonthlyInspections.length,
        passRate: Math.round((prevPassed / prevMonthlyInspections.length) * 100),
        violations: prevViolations,
        criticalViolations: prevCritical,
        status: 'published',
      });
    }

    return reports;
  };

  // Calculate summary stats
  const completed = inspections.filter(i => i.result !== 'pending');
  const totalInspections = completed.length;
  const passedInspections = completed.filter(i => i.result === 'pass' || i.result === 'pass_with_warnings').length;
  const overallPassRate = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0;
  const totalViolations = inspections.reduce((acc, i) => acc + (i.violations?.length || 0), 0);
  const criticalViolations = inspections.reduce((acc, i) =>
    acc + (i.violations?.filter((v: any) => v.severity === 'critical').length || 0), 0);

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || report.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'weekly':
        return <Badge variant="outline">Weekly</Badge>;
      case 'monthly':
        return <Badge variant="outline">Monthly</Badge>;
      case 'quarterly':
        return <Badge variant="outline">Quarterly</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleExport = (report: Report) => {
    toast.success(`Exporting ${report.title} for ${report.period}...`);
    // In a real implementation, this would generate and download a PDF
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
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view compliance reports</p>
        </div>
        <Button onClick={() => toast.success('Generating new report...')}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalInspections}</div>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">{overallPassRate}%</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Overall</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalViolations}</div>
            <p className="text-xs text-gray-500 mt-1">Found</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalViolations}</div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
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
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports ({filteredReports.length})</CardTitle>
          <CardDescription>Generated compliance reports based on inspection data</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
              <p className="text-gray-500 mt-1">No reports match your filters or no inspections have been completed yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{report.title}</h4>
                            {getTypeBadge(report.type)}
                            {getStatusBadge(report.status)}
                          </div>
                          <p className="text-sm text-gray-500">{report.period}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(report.dateGenerated)}
                            </span>
                            <span>{report.totalInspections} inspections</span>
                            <span className="text-green-600">{report.passRate}% pass rate</span>
                            {report.violations > 0 && (
                              <span className="text-orange-600">{report.violations} violations</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(report)}
                        >
                          <Download className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getTypeBadge(selectedReport.type)}
                {getStatusBadge(selectedReport.status)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedReport.title}</h3>
                <p className="text-gray-500">{selectedReport.period}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Total Inspections</Label>
                  <p className="text-lg font-semibold">{selectedReport.totalInspections}</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Pass Rate</Label>
                  <p className="text-lg font-semibold text-green-600">{selectedReport.passRate}%</p>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Violations</Label>
                  <p className="text-lg font-semibold text-orange-600">{selectedReport.violations}</p>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Critical</Label>
                  <p className="text-lg font-semibold text-red-600">{selectedReport.criticalViolations}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Generated</Label>
                <p className="text-gray-900">{formatDate(selectedReport.dateGenerated)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedReport && (
              <Button onClick={() => handleExport(selectedReport)}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
