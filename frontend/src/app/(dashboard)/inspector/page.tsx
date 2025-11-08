'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Clock,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface Inspection {
  _id: string;
  inspectorId: string;
  targetType: string;
  targetId: string;
  targetName: string;
  inspectionType: string;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  result?: string;
  overallScore?: number;
  violations?: Array<{
    severity: string;
    category: string;
    description: string;
  }>;
  inspectorNotes?: string;
}

export default function InspectorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    scheduledToday: { value: '0', status: '0 completed' },
    thisWeek: { value: '0', pending: '0 pending' },
    passRate: { value: '0%', trend: '0%' },
    violations: { value: '0', status: '0 critical' },
  });
  const [todayInspections, setTodayInspections] = useState<any[]>([]);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<any[]>([]);
  const [complianceStats, setComplianceStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchDashboardData(currentUser.id);
  }, [router]);

  const fetchDashboardData = async (inspectorId: string) => {
    try {
      setIsLoading(true);

      // Fetch user profile
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
      }

      // Fetch inspections
      const inspectionsResponse: any = await apiClient.getInspections({ inspectorId, limit: '50' });
      const inspections = inspectionsResponse.success ? inspectionsResponse.inspections || [] : [];

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Get this week's date range
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Filter today's inspections
      const todayInspectionsList = inspections.filter((insp: Inspection) => {
        const scheduledDate = new Date(insp.scheduledDate);
        return scheduledDate >= today && scheduledDate <= todayEnd;
      });

      // Filter this week's inspections
      const weekInspections = inspections.filter((insp: Inspection) => {
        const scheduledDate = new Date(insp.scheduledDate);
        return scheduledDate >= weekStart && scheduledDate <= weekEnd;
      });

      const pendingWeekInspections = weekInspections.filter(
        (insp: Inspection) => !insp.completedDate && insp.result !== 'pass' && insp.result !== 'fail'
      );

      // Calculate pass rate
      const completedInspections = inspections.filter((insp: Inspection) => insp.completedDate);
      const passedInspections = completedInspections.filter((insp: Inspection) => insp.result === 'pass');
      const passRate = completedInspections.length > 0
        ? Math.round((passedInspections.length / completedInspections.length) * 100)
        : 0;

      // Get violations from inspections
      const allViolations: any[] = [];
      inspections.forEach((insp: Inspection) => {
        if (insp.violations && insp.violations.length > 0) {
          insp.violations.forEach((violation, idx) => {
            allViolations.push({
              id: `${insp._id}-VIO-${idx}`,
              facility: insp.targetName,
              type: violation.category,
              severity: violation.severity,
              date: new Date(insp.completedDate || insp.scheduledDate).toLocaleDateString(),
              status: insp.followUpRequired ? 'follow_up_required' : 'resolved',
              inspectionId: insp._id,
            });
          });
        }
      });

      const criticalViolations = allViolations.filter((v) => v.severity === 'critical');

      // Format today's inspections
      const formattedTodayInspections = todayInspectionsList.map((insp: Inspection) => {
        const scheduledDate = new Date(insp.scheduledDate);
        const timeStr = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        return {
          id: `INS-${insp._id.slice(-3)}`,
          type: insp.inspectionType,
          target: insp.targetName,
          address: 'Address TBD', // Would need facility address from target
          time: timeStr,
          status: insp.completedDate ? 'completed' : (insp.result ? 'completed' : 'scheduled'),
          result: insp.result || null,
          notes: insp.inspectorNotes || null,
          inspectionId: insp._id,
        };
      });

      // Get upcoming schedule (next 7 days)
      const upcomingInspections = inspections
        .filter((insp: Inspection) => {
          const scheduledDate = new Date(insp.scheduledDate);
          return scheduledDate > todayEnd && !insp.completedDate;
        })
        .sort((a: Inspection, b: Inspection) => 
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        )
        .slice(0, 10);

      // Group upcoming by date
      const scheduleByDate: { [key: string]: any[] } = {};
      upcomingInspections.forEach((insp: Inspection) => {
        const scheduledDate = new Date(insp.scheduledDate);
        const dateKey = scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!scheduleByDate[dateKey]) {
          scheduleByDate[dateKey] = [];
        }
        scheduleByDate[dateKey].push({
          time: scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          facility: insp.targetName,
          type: insp.inspectionType,
        });
      });

      const formattedSchedule = Object.entries(scheduleByDate).slice(0, 2).map(([date, inspections]) => ({
        date,
        inspections,
      }));

      // Calculate compliance stats (simplified - would need more detailed data)
      const complianceCategories: { [key: string]: { pass: number; fail: number } } = {};
      completedInspections.forEach((insp: Inspection) => {
        if (insp.checklist) {
          insp.checklist.forEach((item: any) => {
            if (!complianceCategories[item.category]) {
              complianceCategories[item.category] = { pass: 0, fail: 0 };
            }
            if (item.status === 'pass') {
              complianceCategories[item.category].pass++;
            } else if (item.status === 'fail') {
              complianceCategories[item.category].fail++;
            }
          });
        }
      });

      const complianceStatsList = Object.entries(complianceCategories).map(([category, counts]) => {
        const total = counts.pass + counts.fail;
        const passRate = total > 0 ? Math.round((counts.pass / total) * 100) : 0;
        return {
          category,
          pass: passRate,
          fail: 100 - passRate,
        };
      });

      setStats({
        scheduledToday: {
          value: todayInspectionsList.length.toString(),
          status: `${todayInspectionsList.filter((i: Inspection) => i.completedDate).length} completed`,
        },
        thisWeek: {
          value: weekInspections.length.toString(),
          pending: `${pendingWeekInspections.length} pending`,
        },
        passRate: {
          value: `${passRate}%`,
          trend: '+0%', // Would need previous period comparison
        },
        violations: {
          value: allViolations.length.toString(),
          status: `${criticalViolations.length} critical`,
        },
      });

      setTodayInspections(formattedTodayInspections);
      setRecentViolations(allViolations.slice(0, 3));
      setUpcomingSchedule(formattedSchedule);
      setComplianceStats(complianceStatsList.length > 0 ? complianceStatsList : [
        { category: 'Temperature Control', pass: 0, fail: 0 },
        { category: 'Cleanliness', pass: 0, fail: 0 },
        { category: 'Documentation', pass: 0, fail: 0 },
        { category: 'Storage Conditions', pass: 0, fail: 0 },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getResultColor = (result: string | null) => {
    switch (result) {
      case 'pass':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'pass_warning':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'fail':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return null;
    }
  };

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="h-4 w-4" />;
      case 'pass_warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'fail':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getResultText = (result: string | null) => {
    switch (result) {
      case 'pass':
        return 'Passed';
      case 'pass_warning':
        return 'Pass w/ Warning';
      case 'fail':
        return 'Failed';
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'moderate':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getViolationStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'follow_up_required':
        return 'bg-red-100 text-red-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Scheduled Today
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduledToday.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.scheduledToday.status}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  This Week
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisWeek.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.thisWeek.pending}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pass Rate
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.passRate.value}</div>
                <p className="text-xs text-green-600 mt-1 font-medium">{stats.passRate.trend} this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Violations
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.violations.value}</div>
                <p className="text-xs text-red-600 mt-1">{stats.violations.status}</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Inspections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today's Inspections</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayInspections.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No inspections scheduled for today</p>
                ) : (
                  todayInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900">{inspection.id}</p>
                          <Badge className={getStatusColor(inspection.status)}>
                            {inspection.status.replace('_', ' ')}
                          </Badge>
                          {inspection.result && (
                            <Badge className={getResultColor(inspection.result)!}>
                              <span className="flex items-center gap-1">
                                {getResultIcon(inspection.result)}
                                {getResultText(inspection.result)}
                              </span>
                            </Badge>
                          )}
                          <Badge variant="outline">{inspection.type}</Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">{inspection.target}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{inspection.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{inspection.time}</span>
                          </div>
                        </div>
                        {inspection.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">{inspection.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {inspection.status === 'scheduled' && (
                        <Button variant="default" size="sm">
                          Start Inspection
                        </Button>
                      )}
                      {inspection.status === 'in_progress' && (
                        <Button variant="default" size="sm">
                          Continue Inspection
                        </Button>
                      )}
                      {inspection.status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => router.push(`/inspector/inspections?inspectionId=${inspection.inspectionId}`)}
                        >
                          <FileText className="h-3 w-3" />
                          View Report
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/inspector/inspections?inspectionId=${inspection.inspectionId}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Violations & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Violations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Violations</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentViolations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No recent violations</p>
                  ) : (
                    recentViolations.map((violation) => (
                    <div
                      key={violation.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{violation.id}</p>
                            <Badge className={getSeverityColor(violation.severity)}>
                              {violation.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">{violation.facility}</p>
                          <p className="text-sm text-gray-600 mt-1">{violation.type}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className={getViolationStatusColor(violation.status)}>
                              {violation.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-400">{violation.date}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => router.push(`/inspector/violations`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSchedule.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No upcoming inspections scheduled</p>
                  ) : (
                    upcomingSchedule.map((day, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-gray-900 mb-3">{day.date}</h4>
                      <div className="space-y-2">
                        {day.inspections.map((insp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-gray-600 min-w-[70px]">
                                {insp.time}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{insp.facility}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {insp.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceStats.map((stat) => (
                  <div key={stat.category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{stat.category}</span>
                      <span className="text-sm text-gray-500">
                        {stat.pass}% Pass Rate
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${stat.pass}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <ClipboardCheck className="h-6 w-6" />
                  <span>New Inspection</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>View Reports</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>Schedule</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Violations</span>
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
