'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  Calendar,
  BarChart3,
  PieChart,
  Users
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface Order {
  _id: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number; productName?: string }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  rating?: {
    average: number;
    count: number;
  };
}

export default function FarmerAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    current: 0,
    previous: 0,
    growth: 0,
    thisMonth: [] as { day: string; amount: number }[],
  });
  const [topProducts, setTopProducts] = useState<Array<{ name: string; sold: number; revenue: number; trend: 'up' | 'down'; percentage: number }>>([]);
  const [customerStats, setCustomerStats] = useState<Array<{ name: string; orders: number; revenue: number; rating: number }>>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ category: string; percentage: number; revenue: number; color: string }>>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchAnalyticsData(currentUser.id);
  }, [router, timeRange]);

  const fetchAnalyticsData = async (farmerId: string) => {
    try {
      setIsLoading(true);

      // Fetch orders
      const ordersResponse: any = await apiClient.getOrders({ farmerId });
      const orders: Order[] = ordersResponse.success ? ordersResponse.orders || [] : [];

      // Fetch products
      const productsResponse: any = await apiClient.getProducts({ farmerId });
      const products: Product[] = productsResponse.success ? productsResponse.products || [] : [];

      // Calculate date ranges based on timeRange
      const now = new Date();
      const currentPeriodStart = new Date();
      const previousPeriodStart = new Date();
      
      switch (timeRange) {
        case '7d':
          currentPeriodStart.setDate(now.getDate() - 7);
          previousPeriodStart.setDate(now.getDate() - 14);
          break;
        case '30d':
          currentPeriodStart.setDate(now.getDate() - 30);
          previousPeriodStart.setDate(now.getDate() - 60);
          break;
        case '90d':
          currentPeriodStart.setDate(now.getDate() - 90);
          previousPeriodStart.setDate(now.getDate() - 180);
          break;
        case '1y':
          currentPeriodStart.setFullYear(now.getFullYear() - 1);
          previousPeriodStart.setFullYear(now.getFullYear() - 2);
          break;
      }

      // Filter orders by date range
      const currentPeriodOrders = orders.filter((o: Order) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= currentPeriodStart && (o.status === 'completed' || o.status === 'delivered');
      });

      const previousPeriodOrders = orders.filter((o: Order) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= previousPeriodStart && orderDate < currentPeriodStart && (o.status === 'completed' || o.status === 'delivered');
      });

      // Calculate revenue
      const currentRevenue = currentPeriodOrders.reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);
      const previousRevenue = previousPeriodOrders.reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);
      const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Calculate daily revenue for current period (last 7 days)
      const dailyRevenue: { [key: string]: number } = {};
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      currentPeriodOrders.forEach((order: Order) => {
        const orderDate = new Date(order.createdAt);
        const dayKey = daysOfWeek[orderDate.getDay()];
        dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + order.totalAmount;
      });

      const thisMonthData = daysOfWeek.map(day => ({
        day,
        amount: dailyRevenue[day] || 0,
      }));

      // Calculate top products
      const productSales: { [key: string]: { name: string; sold: number; revenue: number; previousSold: number } } = {};
      
      currentPeriodOrders.forEach((order: Order) => {
        order.items?.forEach((item: any) => {
          const product = products.find((p: Product) => p._id === item.productId);
          if (product) {
            if (!productSales[product._id]) {
              productSales[product._id] = {
                name: product.name,
                sold: 0,
                revenue: 0,
                previousSold: 0,
              };
            }
            productSales[product._id].sold += item.quantity;
            productSales[product._id].revenue += item.price * item.quantity;
          }
        });
      });

      previousPeriodOrders.forEach((order: Order) => {
        order.items?.forEach((item: any) => {
          const product = products.find((p: Product) => p._id === item.productId);
          if (product && productSales[product._id]) {
            productSales[product._id].previousSold += item.quantity;
          }
        });
      });

      const topProductsList = Object.values(productSales)
        .map((p) => {
          const trend = p.sold > p.previousSold ? 'up' : p.sold < p.previousSold ? 'down' : 'up';
          const percentage = p.previousSold > 0 ? ((p.sold - p.previousSold) / p.previousSold) * 100 : 0;
          return { ...p, trend, percentage };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate customer stats
      const customerData: { [key: string]: { name: string; orders: Order[]; revenue: number } } = {};
      currentPeriodOrders.forEach((order: Order) => {
        if (!customerData[order.customerId]) {
          customerData[order.customerId] = {
            name: `Customer ${order.customerId.slice(-4)}`,
            orders: [],
            revenue: 0,
          };
        }
        customerData[order.customerId].orders.push(order);
        customerData[order.customerId].revenue += order.totalAmount;
      });

      // Calculate customer ratings based on products they ordered
      const customerStatsList = Object.entries(customerData).map(([customerId, data]) => {
        // Get products ordered by this customer
        const customerProducts = new Set<string>();
        data.orders.forEach((order: Order) => {
          order.items?.forEach((item: any) => {
            if (item.productId) customerProducts.add(item.productId);
          });
        });

        // Calculate average rating from products this customer ordered
        let customerRating = 0;
        let customerRatingCount = 0;
        Array.from(customerProducts).forEach((productId: string) => {
          const product = products.find((p: Product) => p._id === productId);
          if (product?.rating?.average && product?.rating?.count) {
            customerRating += product.rating.average * product.rating.count;
            customerRatingCount += product.rating.count;
          }
        });
        const avgCustomerRating = customerRatingCount > 0 ? customerRating / customerRatingCount : 0;

        return {
          name: data.name,
          orders: data.orders.length,
          revenue: data.revenue,
          rating: avgCustomerRating || 0,
        };
      })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate category breakdown
      const categoryData: { [key: string]: { revenue: number } } = {};
      currentPeriodOrders.forEach((order: Order) => {
        order.items?.forEach((item: any) => {
          const product = products.find((p: Product) => p._id === item.productId);
          if (product) {
            const category = product.category || 'Other';
            if (!categoryData[category]) {
              categoryData[category] = { revenue: 0 };
            }
            categoryData[category].revenue += item.price * item.quantity;
          }
        });
      });

      const totalCategoryRevenue = Object.values(categoryData).reduce((sum, c) => sum + c.revenue, 0);
      const colors = ['bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-blue-500', 'bg-red-500'];
      const categoryBreakdownList = Object.entries(categoryData)
        .map(([category, data], idx) => ({
          category,
          percentage: totalCategoryRevenue > 0 ? (data.revenue / totalCategoryRevenue) * 100 : 0,
          revenue: data.revenue,
          color: colors[idx % colors.length],
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Calculate average rating from products
      let totalRating = 0;
      let totalRatingCount = 0;
      products.forEach((product: Product) => {
        if (product.rating && product.rating.average && product.rating.count) {
          totalRating += product.rating.average * product.rating.count;
          totalRatingCount += product.rating.count;
        }
      });
      const calculatedAvgRating = totalRatingCount > 0 ? totalRating / totalRatingCount : 0;

      // Calculate other stats
      const uniqueCustomers = new Set(orders.map((o: Order) => o.customerId));
      setTotalOrders(orders.length);
      setActiveCustomers(uniqueCustomers.size);
      setAvgRating(calculatedAvgRating);

      setRevenueData({ current: currentRevenue, previous: previousRevenue, growth, thisMonth: thisMonthData });
      setTopProducts(topProductsList);
      setCustomerStats(customerStatsList);
      setCategoryBreakdown(categoryBreakdownList);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your farm's performance and growth</p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${revenueData.current.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+{revenueData.growth}%</span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+{Math.round(revenueData.growth)}%</span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeCustomers}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Active</span>
              <span className="text-xs text-gray-500 ml-1">customers</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-gray-500">Based on customer feedback</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Daily revenue for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.thisMonth.map((day, idx) => {
                const maxAmount = Math.max(...revenueData.thisMonth.map(d => d.amount));
                const percentage = (day.amount / maxAmount) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-gray-600 font-medium">{day.day}</div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-semibold text-white">${day.amount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Category
            </CardTitle>
            <CardDescription>Product category performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{cat.category}</span>
                    <span className="text-gray-600">${cat.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${cat.color} h-full rounded-full`}
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

      {/* Tabs for detailed views */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
        </TabsList>

        {/* Top Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
              <CardDescription>Your most popular products this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full text-green-700 font-bold">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-500">
                          {product.sold} lbs sold • ${product.revenue.toLocaleString()} revenue
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.trend === 'up' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{product.percentage}%
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {product.percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Customers */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Your most valuable restaurant partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerStats.map((customer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-700 font-bold">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                        <p className="text-sm text-gray-500">
                          {customer.orders} orders • ${customer.revenue.toLocaleString()} spent
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{customer.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-900">
          {revenueData.growth > 0 ? (
            <p>✓ Your revenue is up {revenueData.growth.toFixed(1)}% compared to last period - great job!</p>
          ) : (
            <p>⚠ Revenue is down {Math.abs(revenueData.growth).toFixed(1)}% compared to last period - consider reviewing your strategy</p>
          )}
          {topProducts.length > 0 && topProducts[0] && (
            <p>✓ {topProducts[0].name} is your top seller - consider increasing inventory</p>
          )}
          {topProducts.length > 0 && topProducts.find(p => p.trend === 'down') && (
            <p>⚠ {topProducts.find(p => p.trend === 'down')?.name} sales are declining - you may want to review pricing or quality</p>
          )}
          {customerStats.length > 0 && customerStats[0] && (
            <p>✓ {customerStats[0].name} is your top customer - consider offering them a loyalty discount</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
