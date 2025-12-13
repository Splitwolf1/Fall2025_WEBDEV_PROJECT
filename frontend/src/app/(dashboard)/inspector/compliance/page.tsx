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
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building,
  Search,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';
import axios from 'axios';

interface Inspection {
  _id: string;
  targetId: string;
  targetName: string;
  targetType: string;
  scheduledDate: string;
  completedDate?: string;
  result: 'pass' | 'pass_with_warnings' | 'fail' | 'pending';
  overallScore?: number;
  violations?: any[];
}

interface FacilityCompliance {
  id: string;
  name: string;
  type: string;
  inspectionCount: number;
  passCount: number;
  failCount: number;
  violationCount: number;
  averageScore: number;
  lastInspection?: string;
  status: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function InspectorCompliancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState('facilities');
  const [facilityCompliance, setFacilityCompliance] = useState<FacilityCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<FacilityCompliance | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch inspections and calculate compliance
  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const token = auth.getToken();
        const response = await axios.get(`${API_BASE}/api/inspections`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const inspections: Inspection[] = response.data.inspections || [];

          // Group inspections by facility
          const facilityMap = new Map<string, {
            name: string;
            type: string;
            inspections: Inspection[];
          }>();

          inspections.forEach(inspection => {
            const key = inspection.targetId;
            if (!facilityMap.has(key)) {
              facilityMap.set(key, {
                name: inspection.targetName,
                type: inspection.targetType,
                inspections: [],
              });
            }
            facilityMap.get(key)!.inspections.push(inspection);
          });

          // Calculate compliance for each facility
          const complianceData: FacilityCompliance[] = [];

          facilityMap.forEach((data, id) => {
            const completedInspections = data.inspections.filter(i => i.result !== 'pending');
            const passCount = completedInspections.filter(i => i.result === 'pass' || i.result === 'pass_with_warnings').length;
            const failCount = completedInspections.filter(i => i.result === 'fail').length;
            const violationCount = data.inspections.reduce((acc, i) => acc + (i.violations?.length || 0), 0);

            const scores = completedInspections
              .filter(i => i.overallScore !== undefined)
              .map(i => i.overallScore!);
            const averageScore = scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : 0;

            const lastInspection = data.inspections
              .filter(i => i.completedDate)
              .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())[0];

            // Determine status based on average score
            let status: FacilityCompliance['status'] = 'needs_improvement';
            if (averageScore >= 90) status = 'excellent';
            else if (averageScore >= 80) status = 'good';
            else if (averageScore >= 70) status = 'satisfactory';
            else if (averageScore >= 50) status = 'needs_improvement';
            else if (completedInspections.length > 0) status = 'critical';

            // Calculate trend (compare last 2 inspections)
            const recentInspections = completedInspections
              .filter(i => i.overallScore !== undefined)
              .sort((a, b) => new Date(b.completedDate || b.scheduledDate).getTime() - new Date(a.completedDate || a.scheduledDate).getTime())
              .slice(0, 2);

            let trend: FacilityCompliance['trend'] = 'stable';
            if (recentInspections.length >= 2) {
              const [latest, previous] = recentInspections;
              if (latest.overallScore! > previous.overallScore!) trend = 'up';
              else if (latest.overallScore! < previous.overallScore!) trend = 'down';
            }

            complianceData.push({
              id,
              name: data.name,
              type: data.type,
              inspectionCount: data.inspections.length,
              passCount,
              failCount,
              violationCount,
              averageScore,
              lastInspection: lastInspection?.completedDate,
              status,
              trend,
            });
          });

          setFacilityCompliance(complianceData.sort((a, b) => b.averageScore - a.averageScore));
        }
      } catch (error) {
        console.error('Failed to fetch compliance data:', error);
        toast.error('Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
  }, []);

  // Filter facilities
  const filteredFacilities = facilityCompliance.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || facility.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const excellentCount = facilityCompliance.filter(f => f.status === 'excellent').length;
  const needsImprovementCount = facilityCompliance.filter(f => f.status === 'needs_improvement' || f.status === 'critical').length;
  const overallAverage = facilityCompliance.length > 0
    ? Math.round(facilityCompliance.reduce((acc, f) => acc + f.averageScore, 0) / facilityCompliance.length)
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>;
      case 'satisfactory':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Satisfactory</Badge>;
      case 'needs_improvement':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Needs Improvement</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
        <h1 className="text-3xl font-bold text-gray-900">Compliance Overview</h1>
        <p className="text-gray-600 mt-1">Monitor facility compliance scores and trends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{facilityCompliance.length}</div>
            <p className="text-xs text-gray-500 mt-1">Monitored</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(overallAverage)}`}>{overallAverage}%</div>
            <p className="text-xs text-gray-500 mt-1">Across all facilities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Excellent Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{excellentCount}</div>
            <p className="text-xs text-gray-500 mt-1">Score ≥ 90%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{needsImprovementCount}</div>
            <p className="text-xs text-gray-500 mt-1">Score &lt; 70%</p>
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
                placeholder="Search facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="satisfactory">Satisfactory</SelectItem>
                <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Facility Compliance List */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Compliance ({filteredFacilities.length})</CardTitle>
          <CardDescription>Compliance scores based on inspection results</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFacilities.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No facilities found</h3>
              <p className="text-gray-500 mt-1">No facilities match your current filters or no inspections have been conducted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFacilities.map((facility) => (
                <Card key={facility.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`text-3xl font-bold ${getScoreColor(facility.averageScore)}`}>
                          {facility.averageScore}%
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{facility.name}</h4>
                            {getStatusBadge(facility.status)}
                            {getTrendIcon(facility.trend)}
                          </div>
                          <p className="text-sm text-gray-500">{facility.type}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{facility.inspectionCount} inspections</span>
                            <span className="text-green-600">{facility.passCount} passed</span>
                            {facility.failCount > 0 && (
                              <span className="text-red-600">{facility.failCount} failed</span>
                            )}
                            {facility.violationCount > 0 && (
                              <span className="text-orange-600">{facility.violationCount} violations</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getScoreBarColor(facility.averageScore)}`}
                              style={{ width: `${facility.averageScore}%` }}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFacility(facility);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
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
            <DialogTitle>Facility Compliance Details</DialogTitle>
          </DialogHeader>
          {selectedFacility && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${getScoreColor(selectedFacility.averageScore)}`}>
                  {selectedFacility.averageScore}%
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedFacility.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedFacility.status)}
                    {getTrendIcon(selectedFacility.trend)}
                  </div>
                </div>
              </div>

              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBarColor(selectedFacility.averageScore)}`}
                  style={{ width: `${selectedFacility.averageScore}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Total Inspections</Label>
                  <p className="text-lg font-semibold">{selectedFacility.inspectionCount}</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Passed</Label>
                  <p className="text-lg font-semibold text-green-600">{selectedFacility.passCount}</p>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Failed</Label>
                  <p className="text-lg font-semibold text-red-600">{selectedFacility.failCount}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <Label className="text-xs text-gray-500">Violations</Label>
                  <p className="text-lg font-semibold text-orange-600">{selectedFacility.violationCount}</p>
                </div>
              </div>

              {selectedFacility.lastInspection && (
                <div>
                  <Label className="text-xs text-gray-500">Last Inspection</Label>
                  <p className="text-gray-900">{formatDate(selectedFacility.lastInspection)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
