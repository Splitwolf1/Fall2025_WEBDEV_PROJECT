'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  PieChart
} from 'lucide-react';

// Mock reports data
const mockReports = [
  {
    id: 'RPT-001',
    title: 'Monthly Compliance Report - October 2025',
    type: 'monthly',
    dateGenerated: '2025-11-01',
    period: 'October 2025',
    totalInspections: 45,
    passRate: 91,
    violations: 8,
    criticalViolations: 2,
    status: 'final',
  },
  {
    id: 'RPT-002',
    title: 'Quarterly Farm Inspection Summary - Q3 2025',
    type: 'quarterly',
    dateGenerated: '2025-10-15',
    period: 'Q3 2025',
    totalInspections: 132,
    passRate: 94,
    violations: 18,
    criticalViolations: 3,
    status: 'final',
  },
  {
    id: 'RPT-003',
    title: 'Violation Trends Analysis - 2025',
    type: 'analysis',
    dateGenerated: '2025-10-28',
    period: 'Jan - Oct 2025',
    totalInspections: 420,
    passRate: 93,
    violations: 62,
    criticalViolations: 8,
    status: 'final',
  },
  {
    id: 'RPT-004',
    title: 'Weekly Inspection Summary',
    type: 'weekly',
    dateGenerated: '2025-11-05',
    period: 'Week of Oct 28 - Nov 3',
    totalInspections: 12,
    passRate: 83,
    violations: 4,
    criticalViolations: 1,
    status: 'draft',
  },
];

// Mock compliance trends
const complianceTrends = [
  { month: 'Jan', passRate: 92, inspections: 38 },
  { month: 'Feb', passRate: 91, inspections: 42 },
  { month: 'Mar', passRate: 94, inspections: 45 },
  { month: 'Apr', passRate: 93, inspections: 41 },
  { month: 'May', passRate: 95, inspections: 48 },
  { month: 'Jun', passRate: 94, inspections: 46 },
  { month: 'Jul', passRate: 92, inspections: 44 },
  { month: 'Aug', passRate: 93, inspections: 47 },
  { month: 'Sep', passRate: 94, inspections: 49 },
  { month: 'Oct', passRate: 91, inspections: 45 },
];

const violationCategories = [
  { category: 'Temperature Control', count: 18, percentage: 29 },
  { category: 'Cleanliness', count: 15, percentage: 24 },
  { category: 'Documentation', count: 12, percentage: 19 },
  { category: 'Storage Conditions', count: 10, percentage: 16 },
  { category: 'Labeling', count: 7, percentage: 11 },
];

export default function InspectorReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [reportType, setReportType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('ytd');

  const filteredReports = mockReports.filter(report => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = reportType === 'all' || report.type === reportType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'final':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Final</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      monthly: 'bg-blue-100 text-blue-800',
      quarterly: 'bg-purple-100 text-purple-800',
      weekly: 'bg-orange-100 text-orange-800',
      analysis: 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={`${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'} hover:bg-current`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view inspection reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">420</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+12%</span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">93%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+2%</span>
              <span className="text-xs text-gray-500">improvement</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">62</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">-8%</span>
              <span className="text-xs text-gray-500">decrease</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">-3</span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance Trend
            </CardTitle>
            <CardDescription>Monthly pass rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceTrends.map((trend, idx) => {
                const maxRate = Math.max(...complianceTrends.map(t => t.passRate));
                const percentage = (trend.passRate / maxRate) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-gray-600 font-medium">{trend.month}</div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-full h-8 relative overflow-hidden">
                        <div
                          className={`${
                            trend.passRate >= 94 ? 'bg-green-500' :
                            trend.passRate >= 90 ? 'bg-blue-500' : 'bg-yellow-500'
                          } h-full rounded-full flex items-center justify-end pr-3`}
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-semibold text-white">{trend.passRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-500 text-right">{trend.inspections}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Violation Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Violation Categories
            </CardTitle>
            <CardDescription>Common violation types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {violationCategories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{cat.category}</span>
                    <span className="text-gray-600">{cat.count} violations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Reports ({mockReports.length})</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {/* Search & Filter */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Cards */}
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left: Icon */}
                    <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-lg flex-shrink-0">
                      <FileText className="h-7 w-7 text-blue-600" />
                    </div>

                    {/* Middle: Report Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{report.title}</h3>
                          <p className="text-sm text-gray-500">{report.id} • {report.period}</p>
                        </div>
                        <div className="flex gap-2">
                          {getTypeBadge(report.type)}
                          {getStatusBadge(report.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Inspections</p>
                          <p className="font-semibold text-gray-900">{report.totalInspections}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pass Rate</p>
                          <p className="font-semibold text-green-600">{report.passRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Violations</p>
                          <p className="font-semibold text-orange-600">{report.violations}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Critical</p>
                          <p className="font-semibold text-red-600">{report.criticalViolations}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Generated on {report.dateGenerated}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 lg:w-40">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Monthly Reports</h3>
              <p className="text-gray-500 mt-1">Filter by monthly reports to view</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Quarterly Reports</h3>
              <p className="text-gray-500 mt-1">Filter by quarterly reports to view</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Analysis Reports</h3>
              <p className="text-gray-500 mt-1">Detailed trend and analysis reports</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TrendingUp className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Overall compliance has improved by 2% compared to last period
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Critical violations decreased by 27% - great progress!
          </p>
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Temperature control remains the most common violation category
          </p>
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Consider additional training for farms with repeat violations
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
