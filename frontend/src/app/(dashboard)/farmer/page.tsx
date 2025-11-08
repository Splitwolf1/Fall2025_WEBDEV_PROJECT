'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

interface Order {
  _id: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stockQuantity: number;
  category: string;
  rating?: {
    average: number;
    count: number;
  };
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    revenue: { value: '$0', change: '0%', isPositive: true },
    activeOrders: { value: '0', pending: '0 pending' },
    productsListed: { value: '0', lowStock: '0 low stock' },
    rating: { value: '0', reviews: '0 reviews' },
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchDashboardData(currentUser.id);

    // Listen for real-time updates via Socket.io
    const handleNotification = (notification: any) => {
      // Refresh dashboard data when order/delivery/product notifications arrive
      if (notification.type === 'order' || notification.type === 'delivery' || notification.type === 'stock') {
        fetchDashboardData(currentUser.id);
      }
    };

    socketClient.onNotification(handleNotification);

    // Cleanup
    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [router]);

  const fetchDashboardData = async (farmerId: string) => {
    try {
      setIsLoading(true);

      // Fetch user profile to get latest data
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
      }

      // Fetch orders - remove limit to get accurate counts for stats
      const ordersResponse: any = await apiClient.getOrders({ farmerId });
      const orders = ordersResponse.success ? ordersResponse.orders || [] : [];
      
      // Use pagination total if available for accurate counts
      const totalOrders = ordersResponse.pagination?.total ?? orders.length;

      // Fetch products
      const productsResponse: any = await apiClient.getProducts({ farmerId });
      const products = productsResponse.success ? productsResponse.products || [] : [];

      // Calculate stats
      const totalRevenue = orders
        .filter((o: Order) => o.status === 'completed' || o.status === 'delivered')
        .reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);

      const activeOrders = orders.filter(
        (o: Order) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'ready'
      );

      const pendingOrders = orders.filter((o: Order) => o.status === 'pending');

      const lowStockProducts = products.filter((p: Product) => p.stockQuantity < 10);

      // Calculate top products (simplified - would need order items for accurate data)
      const productSales: { [key: string]: { name: string; revenue: number; quantity: number } } = {};
      orders.forEach((order: Order) => {
        order.items?.forEach((item: any) => {
          const product = products.find((p: Product) => p._id === item.productId);
          if (product) {
            if (!productSales[product._id]) {
              productSales[product._id] = {
                name: product.name,
                revenue: 0,
                quantity: 0,
              };
            }
            productSales[product._id].revenue += item.price * item.quantity;
            productSales[product._id].quantity += item.quantity;
          }
        });
      });

      const topProductsList = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
        .map((p) => ({
          name: p.name,
          sold: `${p.quantity} units`,
          revenue: `$${p.revenue.toFixed(2)}`,
          trend: 'up' as const,
        }));

      // Calculate average rating from products
      let totalRating = 0;
      let totalRatingCount = 0;
      products.forEach((product: Product) => {
        if (product.rating && product.rating.average && product.rating.count) {
          totalRating += product.rating.average * product.rating.count;
          totalRatingCount += product.rating.count;
        }
      });
      const avgRating = totalRatingCount > 0 ? (totalRating / totalRatingCount).toFixed(1) : '0';
      const reviewsText = totalRatingCount > 0 ? `${totalRatingCount} review${totalRatingCount !== 1 ? 's' : ''}` : '0 reviews';

      setStats({
        revenue: {
          value: `$${totalRevenue.toFixed(2)}`,
          change: '+0%',
          isPositive: true,
        },
        activeOrders: {
          value: activeOrders.length.toString(),
          pending: `${pendingOrders.length} pending`,
        },
        productsListed: {
          value: products.length.toString(),
          lowStock: `${lowStockProducts.length} low stock`,
        },
        rating: {
          value: avgRating,
          reviews: reviewsText,
        },
      });

      setRecentOrders(orders.slice(0, 3));
      setTopProducts(topProductsList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'confirmed': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'ready': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'delivered': return 'bg-green-100 text-green-800 hover:bg-green-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const formatOrderAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getCustomerName = (order: Order) => {
    // In a real app, you'd fetch customer details
    return `Customer ${order.customerId.slice(-4)}`;
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
                  Total Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.revenue.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    {stats.revenue.change} from last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Orders
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeOrders.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.activeOrders.pending}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Products Listed
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.productsListed.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.productsListed.lowStock}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Customer Rating
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rating.value} ⭐</div>
                <p className="text-xs text-gray-500 mt-1">From {stats.rating.reviews}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No recent orders</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">ORD-{order._id.slice(-6).toUpperCase()}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{getCustomerName(order)}</p>
                          <p className="text-xs text-gray-400 mt-1">{order.items?.length || 0} items</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{formatOrderAmount(order.totalAmount)}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/farmer/orders`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Selling Products</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No product sales data yet</p>
                  ) : (
                    topProducts.map((product, index) => (
                      <div
                        key={product.name}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-700">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sold}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{product.revenue}</p>
                          </div>
                          {product.trend === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span>Manage Inventory</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  <span>View Orders</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Analytics</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span>Add Product</span>
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
