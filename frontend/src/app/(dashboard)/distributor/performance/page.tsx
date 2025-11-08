'use client';

import { useState } from 'react';
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
  BarChart3
} from 'lucide-react';

// Mock performance data
const performanceMetrics = {
  onTimeDelivery: 96,
  previousOnTimeDelivery: 94,
  avgDeliveryTime: 1.8,
  previousAvgDeliveryTime: 2.1,
  completedDeliveries: 156,
  previousCompletedDeliveries: 142,
  revenue: 45820,
  previousRevenue: 42150,
  fuelEfficiency: 8.5,
  previousFuelEfficiency: 8.2,
  customerSatisfaction: 4.7,
  previousCustomerSatisfaction: 4.5,
};

const driverPerformance = [
  {
    id: 'DRV-001',
    name: 'Mike Davis',
    deliveries: 45,
    onTimeRate: 98,
    avgDeliveryTime: 1.6,
    rating: 5.0,
    issues: 0,
    status: 'excellent',
  },
  {
    id: 'DRV-002',
    name: 'John Smith',
    deliveries: 42,
    onTimeRate: 95,
    avgDeliveryTime: 1.9,
    rating: 4.8,
    issues: 1,
    status: 'excellent',
  },
  {
    id: 'DRV-003',
    name: 'Sarah Johnson',
    deliveries: 38,
    onTimeRate: 97,
    avgDeliveryTime: 1.7,
    rating: 4.9,
    issues: 0,
    status: 'excellent',
  },
  {
    id: 'DRV-004',
    name: 'Lisa Brown',
    deliveries: 31,
    onTimeRate: 92,
    avgDeliveryTime: 2.2,
    rating: 4.6,
    issues: 2,
    status: 'good',
  },
];

const routeEfficiency = [
  { route: 'Route A (Portland North)', avgTime: 3.5, stops: 8, onTime: 97, efficiency: 95 },
  { route: 'Route B (Portland South)', avgTime: 4.2, stops: 10, onTime: 94, efficiency: 92 },
  { route: 'Route C (Beaverton)', avgTime: 3.8, stops: 7, onTime: 96, efficiency: 94 },
  { route: 'Route D (Hillsboro)', avgTime: 4.5, stops: 9, onTime: 91, efficiency: 88 },
  { route: 'Route E (Tigard)', avgTime: 3.2, stops: 6, onTime: 98, efficiency: 96 },
];

const monthlyTrends = [
  { month: 'May', deliveries: 132, onTime: 93, revenue: 38500 },
  { month: 'Jun', deliveries: 138, onTime: 94, revenue: 40200 },
  { month: 'Jul', deliveries: 145, onTime: 95, revenue: 42800 },
  { month: 'Aug', deliveries: 142, onTime: 94, revenue: 42150 },
  { month: 'Sep', deliveries: 156, onTime: 96, revenue: 45820 },
];

export default function DistributorPerformancePage() {
  const [timeRange, setTimeRange] = useState('30d');

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
            <div className="text-3xl font-bold text-gray-900">{performanceMetrics.avgDeliveryTime} days</div>
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
                          <p className="text-lg font-bold text-gray-900">{driver.avgDeliveryTime} days</p>
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
                      {route.stops} stops • Avg {route.avgTime} hours
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
