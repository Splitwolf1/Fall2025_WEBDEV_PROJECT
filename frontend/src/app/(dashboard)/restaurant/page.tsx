'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Clock,
  MapPin,
  TrendingUp,
  Search,
  Heart,
  Star,
  Package,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  items: Array<{
    productId: string;
    farmerId: string;
    productName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stockQuantity: number;
  category: string;
  farmerId: string;
  farmerName?: string;
  unit: string;
  isAvailable: boolean;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    activeOrders: { value: '0', status: '0 in transit' },
    monthlySpending: { value: '$0', change: '0%' },
    suppliers: { value: '0', favorites: '0 favorites' },
    avgDelivery: { value: '0 min', status: 'On time rate: 0%' },
  });
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
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

  const fetchDashboardData = async (customerId: string) => {
    try {
      setIsLoading(true);

      // Fetch user profile
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
      }

      // Fetch orders
      const ordersResponse: any = await apiClient.getOrders({ customerId, limit: '20' });
      const orders = ordersResponse.success ? ordersResponse.orders || [] : [];

      // Fetch products (featured/available)
      const productsResponse: any = await apiClient.getProducts({ limit: '8' });
      const products = productsResponse.success 
        ? (productsResponse.products || []).filter((p: Product) => p.isAvailable && p.stockQuantity > 0)
        : [];

      // Calculate average delivery time from deliveries
      const avgDeliveryData = await calculateAvgDeliveryTime(orders);

      // Calculate stats
      const activeOrdersList = orders.filter(
        (o: Order) => o.status === 'confirmed' || o.status === 'in_transit' || o.status === 'preparing'
      );

      const inTransitOrders = orders.filter((o: Order) => o.status === 'in_transit');

      // Calculate monthly spending (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyOrders = orders.filter((o: Order) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= thirtyDaysAgo && (o.status === 'delivered' || o.status === 'completed');
      });
      const monthlySpending = monthlyOrders.reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);

      // Get unique suppliers from orders
      const supplierIds = new Set<string>();
      orders.forEach((order: Order) => {
        order.items?.forEach((item: any) => {
          if (item.farmerId) supplierIds.add(item.farmerId);
        });
      });

      // Calculate top suppliers (by order count)
      const supplierOrderCounts: { [key: string]: { name: string; orders: number; totalSpent: number } } = {};
      orders.forEach((order: Order) => {
        order.items?.forEach((item: any) => {
          if (item.farmerId) {
            if (!supplierOrderCounts[item.farmerId]) {
              supplierOrderCounts[item.farmerId] = {
                name: item.farmerName || `Supplier ${item.farmerId.slice(-4)}`,
                orders: 0,
                totalSpent: 0,
              };
            }
            supplierOrderCounts[item.farmerId].orders += 1;
            supplierOrderCounts[item.farmerId].totalSpent += item.totalPrice || 0;
          }
        });
      });

      const topSuppliersList = Object.values(supplierOrderCounts)
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 3)
        .map((s) => ({
          name: s.name,
          orders: s.orders,
          rating: 4.5, // Would need rating system
          specialty: 'Various', // Would need supplier details
        }));

      // Format active orders for display
      const formattedActiveOrders = activeOrdersList.slice(0, 3).map((order: Order) => {
        const itemsText = order.items?.slice(0, 2).map((item: any) => 
          `${item.quantity} ${item.unit} ${item.productName}`
        ).join(', ') || 'No items';
        
        // Calculate progress based on status
        let progress = 0;
        if (order.status === 'confirmed') progress = 25;
        else if (order.status === 'preparing') progress = 50;
        else if (order.status === 'in_transit') progress = 75;
        else if (order.status === 'delivered') progress = 100;

        // Get supplier name from first item
        const supplierName = order.items?.[0]?.farmerName || 'Supplier';

        return {
          id: order.orderNumber || order._id,
          supplier: supplierName,
          items: itemsText + (order.items && order.items.length > 2 ? '...' : ''),
          status: order.status,
          eta: 'TBD', // Would need delivery tracking
          progress,
          orderId: order._id,
        };
      });

      setStats({
        activeOrders: {
          value: activeOrdersList.length.toString(),
          status: `${inTransitOrders.length} in transit`,
        },
        monthlySpending: {
          value: `$${monthlySpending.toFixed(2)}`,
          change: '+0%', // Would need previous month comparison
        },
        suppliers: {
          value: supplierIds.size.toString(),
          favorites: '0 favorites', // Would need favorites system
        },
        avgDelivery: {
          value: avgDeliveryData.avgTime,
          status: `On time rate: ${avgDeliveryData.onTimeRate}%`,
    },
      });

      setActiveOrders(formattedActiveOrders);
      setFeaturedProducts(products.slice(0, 4));
      setTopSuppliers(topSuppliersList);
    } catch (error) {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAvgDeliveryTime = async (ordersList: Order[]) => {
    try {
      // Get delivered orders
      const deliveredOrders = ordersList.filter(
        (o: Order) => o.status === 'delivered' || o.status === 'completed'
      );

      if (deliveredOrders.length === 0) {
        return { avgTime: '0 days', onTimeRate: 0 };
      }

      // Fetch deliveries for delivered orders
      const deliveryTimes: number[] = [];
      let onTimeCount = 0;

      for (const order of deliveredOrders) {
        try {
          const deliveryResponse: any = await apiClient.getDeliveries({ orderId: order._id });
          if (deliveryResponse.success && deliveryResponse.deliveries && deliveryResponse.deliveries.length > 0) {
            const delivery = deliveryResponse.deliveries[0];
            
            // Calculate delivery time: from order creation to delivery completion
            const orderDate = new Date(order.createdAt);
            const deliveryDate = delivery.route?.delivery?.actualTime 
              ? new Date(delivery.route.delivery.actualTime)
              : delivery.updatedAt 
              ? new Date(delivery.updatedAt)
              : null;
            
            if (deliveryDate && deliveryDate > orderDate) {
              const diffMs = deliveryDate.getTime() - orderDate.getTime();
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              deliveryTimes.push(diffDays);

              // Check if on-time (assuming 2 days is standard, adjust as needed)
              const estimatedDays = 2;
              if (diffDays <= estimatedDays) {
                onTimeCount++;
              }
            }
          }
        } catch (err) {
          // Skip if delivery not found
        }
      }

      if (deliveryTimes.length > 0) {
        const avgDays = deliveryTimes.reduce((sum, days) => sum + days, 0) / deliveryTimes.length;
        const avgTime = avgDays < 1 
          ? `${Math.round(avgDays * 24)} min` 
          : avgDays < 2
          ? `${(avgDays * 24).toFixed(0)} hours`
          : `${avgDays.toFixed(1)} days`;
        const onTimeRate = Math.round((onTimeCount / deliveryTimes.length) * 100);
        return { avgTime, onTimeRate };
      }

      return { avgTime: '0 days', onTimeRate: 0 };
    } catch (err) {
      return { avgTime: '0 days', onTimeRate: 0 };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'confirmed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'In Transit';
      case 'preparing':
        return 'Preparing';
      case 'confirmed':
        return 'Confirmed';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getProductEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      vegetables: '🥬',
      fruits: '🍎',
      grains: '🌾',
      dairy: '🥛',
      meat: '🥩',
      herbs: '🌿',
    };
    return emojiMap[category.toLowerCase()] || '📦';
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
                  Active Orders
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeOrders.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.activeOrders.status}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Monthly Spending
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.monthlySpending.value}</div>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  {stats.monthlySpending.change} from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Suppliers
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.suppliers.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.suppliers.favorites}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Delivery Time
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgDelivery.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.avgDelivery.status}</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Deliveries</CardTitle>
              <Button variant="ghost" size="sm">
                View All Orders
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active orders</p>
                ) : (
                  activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{order.id}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">{order.supplier}</p>
                        <p className="text-sm text-gray-500 mt-1">{order.items}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>ETA: {order.eta}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{order.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 rounded-full transition-all"
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => router.push(`/restaurant/tracking?orderId=${order.orderId}`)}
                        >
                        <MapPin className="h-3 w-3" />
                        Track
                      </Button>
                      <Button variant="outline" size="sm">
                        Contact Supplier
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Featured Products & Top Suppliers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Products */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Featured Products</CardTitle>
                  <Button variant="ghost" size="sm">
                    Browse All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredProducts.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 col-span-2">No featured products available</p>
                    ) : (
                      featuredProducts.map((product) => (
                      <div
                          key={product._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                            <div className="text-4xl">{getProductEmoji(product.category)}</div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{product.farmerName || 'Farm'}</p>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">4.5</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Package className="h-3 w-3" />
                              <span>{product.stockQuantity} {product.unit} available</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-600">
                              ${product.price.toFixed(2)}/{product.unit}
                            </span>
                            {product.isAvailable && product.stockQuantity > 0 ? (
                              <Button 
                                size="sm"
                                onClick={() => router.push(`/restaurant/browse`)}
                              >
                                Add to Cart
                              </Button>
                          ) : (
                            <Badge variant="secondary">Out of Stock</Badge>
                          )}
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Suppliers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSuppliers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No suppliers yet</p>
                  ) : (
                    topSuppliers.map((supplier, index) => (
                    <div key={supplier.name} className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-700 flex-shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{supplier.name}</p>
                        <p className="text-xs text-gray-500">{supplier.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{supplier.rating}</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{supplier.orders} orders</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
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
                  <Search className="h-6 w-6" />
                  <span>Browse Products</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  <span>View Cart</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span>Order History</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Heart className="h-6 w-6" />
                  <span>Favorite Suppliers</span>
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
