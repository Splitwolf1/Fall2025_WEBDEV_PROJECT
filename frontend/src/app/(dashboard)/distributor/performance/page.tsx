'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  Award,
  AlertTriangle,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

interface Delivery {
  _id: string;
  distributorId: string;
  orderId: string;
  status: string;
  route: {
    pickup: {
      scheduledTime: string;
      actualTime?: string;
    };
    delivery: {
      scheduledTime: string;
      actualTime?: string;
    };
  };
  driverName?: string;
  vehicleId?: string;
  createdAt: string;
}

interface DriverPerformance {
  id: string;
  name: string;
  deliveries: number;
  onTimeRate: number;
  avgDeliveryTime: number;
  rating: number;
  issues: number;
  status: string;
}

export default function DistributorPerformancePage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30d');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    onTimeDelivery: 0,
    previousOnTimeDelivery: 0,
    avgDeliveryTime: 0,
    previousAvgDeliveryTime: 0,
    completedDeliveries: 0,
    previousCompletedDeliveries: 0,
    revenue: 0,
    previousRevenue: 0,
    fuelEfficiency: 0,
    previousFuelEfficiency: 0,
    customerSatisfaction: 0,
    previousCustomerSatisfaction: 0,
  });
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
  const [routeEfficiency, setRouteEfficiency] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchPerformanceData(currentUser.id);

    // Listen for real-time updates
    const handleNotification = (notification: any) => {
      if (notification.type === 'delivery' || notification.type === 'order') {
        fetchPerformanceData(currentUser.id);
      }
    };

    socketClient.onNotification(handleNotification);

    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router, timeRange]);

  const fetchPerformanceData = async (distributorId: string) => {
    try {
      setIsLoading(true);
      const deliveriesResponse: any = await apiClient.getDeliveries({ distributorId, limit: '200' });
      const deliveries = deliveriesResponse.success ? deliveriesResponse.deliveries || [] : [];

      // Filter deliveries based on time range
      const now = new Date();
      const timeRangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);
      const filteredDeliveries = deliveries.filter((d: Delivery) => new Date(d.createdAt) >= startDate);

      // Calculate on-time delivery rate
      const completedDeliveries = filteredDeliveries.filter((d: Delivery) => d.status === 'delivered');
      let onTimeCount = 0;
      let totalDeliveryTime = 0;
      let deliveryTimeCount = 0;
      let totalRevenue = 0;

      for (const delivery of completedDeliveries) {
        try {
          // Check if on-time (within scheduled window)
          const scheduledTime = delivery.route?.delivery?.scheduledTime 
            ? new Date(delivery.route.delivery.scheduledTime)
            : null;
          const actualTime = delivery.route?.delivery?.actualTime 
            ? new Date(delivery.route.delivery.actualTime)
            : null;
          
          if (scheduledTime && actualTime) {
            const diffHours = Math.abs(actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
            if (diffHours <= 2) { // Consider on-time if within 2 hours
              onTimeCount++;
            }
            
            // Calculate delivery time
            const pickupTime = delivery.route?.pickup?.actualTime 
              ? new Date(delivery.route.pickup.actualTime)
              : scheduledTime;
            if (pickupTime && actualTime > pickupTime) {
              const diffDays = (actualTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60 * 24);
              totalDeliveryTime += diffDays;
              deliveryTimeCount++;
            }
          }

          // Calculate revenue
          const orderResponse: any = await apiClient.getOrder(delivery.orderId);
          if (orderResponse.success && orderResponse.order) {
            totalRevenue += orderResponse.order.totalAmount || 0;
          }
        } catch (err) {
          // Skip if order not found
        }
      }

      const onTimeRate = completedDeliveries.length > 0 
        ? Math.round((onTimeCount / completedDeliveries.length) * 100)
        : 0;
      const avgDeliveryTimeDays = deliveryTimeCount > 0 
        ? totalDeliveryTime / deliveryTimeCount
        : 0;

      // Group by driver for driver performance
      const driversMap: { [key: string]: Delivery[] } = {};
      filteredDeliveries.forEach((delivery: Delivery) => {
        if (delivery.driverName) {
          if (!driversMap[delivery.driverName]) {
            driversMap[delivery.driverName] = [];
          }
          driversMap[delivery.driverName].push(delivery);
        }
      });

      const driversList: DriverPerformance[] = await Promise.all(
        Object.entries(driversMap).map(async ([driverName, driverDeliveries]) => {
          const completed = driverDeliveries.filter(d => d.status === 'delivered');
          let driverOnTime = 0;
          let driverTotalTime = 0;
          let driverTimeCount = 0;

          for (const delivery of completed) {
            const scheduledTime = delivery.route?.delivery?.scheduledTime 
              ? new Date(delivery.route.delivery.scheduledTime)
              : null;
            const actualTime = delivery.route?.delivery?.actualTime 
              ? new Date(delivery.route.delivery.actualTime)
              : null;
            
            if (scheduledTime && actualTime) {
              const diffHours = Math.abs(actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
              if (diffHours <= 2) {
                driverOnTime++;
              }
              
              const pickupTime = delivery.route?.pickup?.actualTime 
                ? new Date(delivery.route.pickup.actualTime)
                : scheduledTime;
              if (pickupTime && actualTime > pickupTime) {
                const diffDays = (actualTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60 * 24);
                driverTotalTime += diffDays;
                driverTimeCount++;
              }
            }
          }

          const driverOnTimeRate = completed.length > 0 
            ? Math.round((driverOnTime / completed.length) * 100)
            : 0;
          const driverAvgTime = driverTimeCount > 0 
            ? driverTotalTime / driverTimeCount
            : 0;

          return {
            id: `DRV-${driverName.replace(/\s+/g, '').slice(0, 6)}`,
            name: driverName,
            deliveries: completed.length,
            onTimeRate: driverOnTimeRate,
            avgDeliveryTime: driverAvgTime,
            rating: 4.5, // Would need rating system
            issues: 0, // Would need issue tracking
            status: driverOnTimeRate >= 95 ? 'excellent' : driverOnTimeRate >= 90 ? 'good' : 'needs_improvement',
          };
        })
      );

      // Group by vehicle/route for route efficiency
      const routesMap: { [key: string]: Delivery[] } = {};
      filteredDeliveries.forEach((delivery: Delivery) => {
        const routeKey = `${delivery.driverName || 'Unassigned'}-${delivery.vehicleId || 'N/A'}`;
        if (!routesMap[routeKey]) {
          routesMap[routeKey] = [];
        }
        routesMap[routeKey].push(delivery);
      });

      const routesList = Object.entries(routesMap).map(([routeKey, routeDeliveries]) => {
        const completed = routeDeliveries.filter(d => d.status === 'delivered');
        let routeOnTime = 0;
        let routeTotalTime = 0;
        let routeTimeCount = 0;

        completed.forEach((delivery: Delivery) => {
          const scheduledTime = delivery.route?.delivery?.scheduledTime 
            ? new Date(delivery.route.delivery.scheduledTime)
            : null;
          const actualTime = delivery.route?.delivery?.actualTime 
            ? new Date(delivery.route.delivery.actualTime)
            : null;
          
          if (scheduledTime && actualTime) {
            const diffHours = Math.abs(actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
            if (diffHours <= 2) {
              routeOnTime++;
            }
            
            const pickupTime = delivery.route?.pickup?.actualTime 
              ? new Date(delivery.route.pickup.actualTime)
              : scheduledTime;
            if (pickupTime && actualTime > pickupTime) {
              const diffHours = (actualTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60);
              routeTotalTime += diffHours;
              routeTimeCount++;
            }
          }
        });

        const routeOnTimeRate = completed.length > 0 
          ? Math.round((routeOnTime / completed.length) * 100)
          : 0;
        const routeAvgTime = routeTimeCount > 0 
          ? routeTotalTime / routeTimeCount
          : 0;
        const efficiency = routeOnTimeRate; // Simplified efficiency metric

        return {
          route: routeKey,
          avgTime: routeAvgTime,
          stops: routeDeliveries.length,
          onTime: routeOnTimeRate,
          efficiency,
        };
      });

      setPerformanceMetrics({
        onTimeDelivery: onTimeRate,
        previousOnTimeDelivery: onTimeRate, // Would need historical data
        avgDeliveryTime: avgDeliveryTimeDays,
        previousAvgDeliveryTime: avgDeliveryTimeDays, // Would need historical data
        completedDeliveries: completedDeliveries.length,
        previousCompletedDeliveries: completedDeliveries.length, // Would need historical data
        revenue: totalRevenue,
        previousRevenue: totalRevenue, // Would need historical data
        fuelEfficiency: 8.5, // Would need vehicle management system
        previousFuelEfficiency: 8.2,
        customerSatisfaction: 4.5, // Would need rating system
        previousCustomerSatisfaction: 4.5,
      });

      setDriverPerformance(driversList.sort((a, b) => b.deliveries - a.deliveries));
      setRouteEfficiency(routesList.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5));
      
      // Calculate monthly trends (simplified - would need proper grouping)
      setMonthlyTrends([]); // Would need proper monthly aggregation
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold - 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBarColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'bg-green-500';
    if (value >= threshold - 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDriverBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>;
      case 'needs_improvement':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Needs Improvement</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          <p className="ml-2 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor delivery operations and efficiency</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              On-Time Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{performanceMetrics.onTimeDelivery}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                +{performanceMetrics.onTimeDelivery - performanceMetrics.previousOnTimeDelivery}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
            <Progress value={performanceMetrics.onTimeDelivery} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Delivery Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {performanceMetrics.avgDeliveryTime < 1 
                ? `${Math.round(performanceMetrics.avgDeliveryTime * 24)} hours`
                : `${performanceMetrics.avgDeliveryTime.toFixed(1)} days`}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                -{(performanceMetrics.previousAvgDeliveryTime - performanceMetrics.avgDeliveryTime).toFixed(1)} days
              </span>
              <span className="text-xs text-gray-500">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{performanceMetrics.customerSatisfaction}/5.0</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                +{(performanceMetrics.customerSatisfaction - performanceMetrics.previousCustomerSatisfaction).toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">rating increase</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.completedDeliveries}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">
                +{performanceMetrics.completedDeliveries - performanceMetrics.previousCompletedDeliveries} from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${performanceMetrics.revenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">
                +${(performanceMetrics.revenue - performanceMetrics.previousRevenue).toLocaleString()} increase
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fuel Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.fuelEfficiency} MPG</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">
                +{(performanceMetrics.fuelEfficiency - performanceMetrics.previousFuelEfficiency).toFixed(1)} MPG
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Driver Performance
          </CardTitle>
          <CardDescription>Individual driver metrics and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {driverPerformance.map((driver) => (
              <Card key={driver.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{driver.name}</h4>
                          <p className="text-sm text-gray-500">{driver.deliveries} deliveries completed</p>
                        </div>
                        {getDriverBadge(driver.status)}
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">On-Time Rate</p>
                          <p className={`text-lg font-bold ${getPerformanceColor(driver.onTimeRate, 95)}`}>
                            {driver.onTimeRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Time</p>
                          <p className="text-lg font-bold text-gray-900">
                            {driver.avgDeliveryTime < 1 
                              ? `${Math.round(driver.avgDeliveryTime * 24)} hours`
                              : `${driver.avgDeliveryTime.toFixed(1)} days`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rating</p>
                          <p className="text-lg font-bold text-gray-900">{driver.rating}/5.0</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Issues</p>
                          <p className={`text-lg font-bold ${driver.issues === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {driver.issues}
                          </p>
                        </div>
                      </div>

                      <Progress value={driver.onTimeRate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Route Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Route Efficiency
          </CardTitle>
          <CardDescription>Performance by delivery route</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routeEfficiency.map((route, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{route.route}</h4>
                    <p className="text-sm text-gray-500">
                      {route.stops} stops • Avg {route.avgTime.toFixed(1)} hours
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getPerformanceColor(route.efficiency, 90)}`}>
                      {route.efficiency}%
                    </p>
                    <p className="text-xs text-gray-500">Efficiency</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${getPerformanceBarColor(route.efficiency, 90)} h-full rounded-full`}
                      style={{ width: `${route.efficiency}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{route.onTime}% on-time</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Performance over the last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyTrends.map((trend, idx) => {
                const maxDeliveries = Math.max(...monthlyTrends.map(t => t.deliveries));
                const percentage = (trend.deliveries / maxDeliveries) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-gray-600 font-medium">{trend.month}</div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-full h-10 relative overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full flex items-center justify-between px-3"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-semibold text-white">{trend.deliveries} deliveries</span>
                          <span className="text-xs font-semibold text-white">{trend.onTime}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600 text-right font-medium">
                      ${(trend.revenue / 1000).toFixed(0)}k
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Award className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-900">
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            On-time delivery rate improved by 2% - exceeding target of 95%
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Mike Davis has perfect record with 98% on-time rate - consider for recognition
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Route E (Tigard) is most efficient at 96% - optimize other routes similarly
          </p>
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Route D (Hillsboro) needs optimization - efficiency at 88% below target
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
