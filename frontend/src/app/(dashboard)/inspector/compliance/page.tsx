'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building,
  Award,
  Target,
  BarChart3
} from 'lucide-react';

// Mock compliance data
const facilityCompliance = [
  {
    id: 'FAC-001',
    name: 'Green Valley Farm',
    type: 'Farm',
    overallScore: 96,
    lastInspection: '2025-10-28',
    status: 'excellent',
    categories: {
      temperature: 98,
      cleanliness: 95,
      documentation: 94,
      storage: 97,
    },
    inspections: 12,
    violations: 1,
    trend: 'up',
  },
  {
    id: 'FAC-002',
    name: 'Sunny Acres',
    type: 'Farm',
    overallScore: 88,
    lastInspection: '2025-11-01',
    status: 'good',
    categories: {
      temperature: 85,
      cleanliness: 90,
      documentation: 88,
      storage: 89,
    },
    inspections: 10,
    violations: 3,
    trend: 'stable',
  },
  {
    id: 'FAC-003',
    name: 'Fresh Distribution Center',
    type: 'Distributor',
    overallScore: 92,
    lastInspection: '2025-10-25',
    status: 'excellent',
    categories: {
      temperature: 94,
      cleanliness: 91,
      documentation: 90,
      storage: 93,
    },
    inspections: 15,
    violations: 2,
    trend: 'up',
  },
  {
    id: 'FAC-004',
    name: 'Fresh Bistro',
    type: 'Restaurant',
    overallScore: 82,
    lastInspection: '2025-10-30',
    status: 'satisfactory',
    categories: {
      temperature: 78,
      cleanliness: 85,
      documentation: 82,
      storage: 83,
    },
    inspections: 8,
    violations: 5,
    trend: 'down',
  },
  {
    id: 'FAC-005',
    name: 'Harvest Hill Farm',
    type: 'Farm',
    overallScore: 75,
    lastInspection: '2025-11-02',
    status: 'needs_improvement',
    categories: {
      temperature: 72,
      cleanliness: 76,
      documentation: 78,
      storage: 74,
    },
    inspections: 9,
    violations: 8,
    trend: 'down',
  },
];

const complianceStandards = [
  {
    category: 'Temperature Control',
    requirement: 'Maintain proper cold chain temperatures',
    threshold: 85,
    avgScore: 88,
    passingFacilities: 42,
    totalFacilities: 50,
  },
  {
    category: 'Cleanliness & Sanitation',
    requirement: 'Regular cleaning and sanitization protocols',
    threshold: 85,
    avgScore: 91,
    passingFacilities: 47,
    totalFacilities: 50,
  },
  {
    category: 'Documentation',
    requirement: 'Complete and up-to-date records',
    threshold: 85,
    avgScore: 86,
    passingFacilities: 43,
    totalFacilities: 50,
  },
  {
    category: 'Storage Conditions',
    requirement: 'Proper storage and separation',
    threshold: 85,
    avgScore: 89,
    passingFacilities: 45,
    totalFacilities: 50,
  },
];

export default function InspectorCompliancePage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [facilityType, setFacilityType] = useState('all');

  const filteredFacilities = facilityCompliance.filter(
    f => facilityType === 'all' || f.type.toLowerCase() === facilityType
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>;
      case 'satisfactory':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Satisfactory</Badge>;
      case 'needs_improvement':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Improvement</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor facility compliance and standards</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={facilityType} onValueChange={setFacilityType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Facilities</SelectItem>
              <SelectItem value="farm">Farms</SelectItem>
              <SelectItem value="distributor">Distributors</SelectItem>
              <SelectItem value="restaurant">Restaurants</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">93%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+3%</span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Excellent Rated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">32</div>
            <p className="text-xs text-gray-500 mt-1">Score ≥ 90%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Needs Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">-2</span>
              <span className="text-xs text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">88.6%</div>
            <p className="text-xs text-gray-500 mt-1">All facilities</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Compliance Standards Overview
          </CardTitle>
          <CardDescription>Performance across key compliance categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {complianceStandards.map((standard, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{standard.category}</h4>
                    <p className="text-sm text-gray-500">{standard.requirement}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getScoreColor(standard.avgScore)}`}>
                      {standard.avgScore}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {standard.passingFacilities}/{standard.totalFacilities} passing
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden relative">
                    <div
                      className={`${getScoreBarColor(standard.avgScore)} h-full rounded-full`}
                      style={{ width: `${standard.avgScore}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-gray-400"
                      style={{ left: `${standard.threshold}%` }}
                      title={`Threshold: ${standard.threshold}%`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16">
                    Min: {standard.threshold}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facility Compliance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Facility Compliance Scores
          </CardTitle>
          <CardDescription>Individual facility performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFacilities.map((facility) => (
              <Card key={facility.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{facility.name}</h3>
                          {getStatusBadge(facility.status)}
                          {facility.trend === 'up' && (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                          {facility.trend === 'down' && (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {facility.type} • Last inspected: {facility.lastInspection}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(facility.overallScore)}`}>
                          {facility.overallScore}
                        </div>
                        <p className="text-xs text-gray-500">Overall Score</p>
                      </div>
                    </div>

                    {/* Category Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Temperature</p>
                        <div className="flex items-center gap-2">
                          <Progress value={facility.categories.temperature} className="h-2" />
                          <span className="text-sm font-semibold">{facility.categories.temperature}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cleanliness</p>
                        <div className="flex items-center gap-2">
                          <Progress value={facility.categories.cleanliness} className="h-2" />
                          <span className="text-sm font-semibold">{facility.categories.cleanliness}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Documentation</p>
                        <div className="flex items-center gap-2">
                          <Progress value={facility.categories.documentation} className="h-2" />
                          <span className="text-sm font-semibold">{facility.categories.documentation}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Storage</p>
                        <div className="flex items-center gap-2">
                          <Progress value={facility.categories.storage} className="h-2" />
                          <span className="text-sm font-semibold">{facility.categories.storage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Inspections:</span>
                          <span className="ml-1 font-semibold">{facility.inspections}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Violations:</span>
                          <span className="ml-1 font-semibold text-orange-600">{facility.violations}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Award className="h-5 w-5" />
            Compliance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Overall compliance improved by 3% this period - excellent progress
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Cleanliness standards are being met by 94% of facilities
          </p>
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            3 facilities need immediate attention (score below 80%)
          </p>
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Temperature control remains the area needing most improvement
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
