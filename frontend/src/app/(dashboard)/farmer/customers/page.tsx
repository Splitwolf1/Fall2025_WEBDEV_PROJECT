'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Heart,
  Users
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface Customer {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  since: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrder: string;
  rating: number;
  status: 'active' | 'inactive';
  favoriteProducts: string[];
  orderFrequency: string;
  paymentStatus: 'excellent' | 'good' | 'fair';
  daysSinceLastOrder?: number;
}

interface Order {
  _id: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number; productName?: string }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function FarmerCustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchCustomers(currentUser.id);
  }, [router]);

  const fetchCustomers = async (farmerId: string) => {
    try {
      setIsLoading(true);

      // Fetch orders
      const ordersResponse: any = await apiClient.getOrders({ farmerId });
      const orders: Order[] = ordersResponse.success ? ordersResponse.orders || [] : [];

      // Group orders by customer
      const customerData: { [key: string]: { orders: Order[]; firstOrder: Date; lastOrder: Date } } = {};
      const productCounts: { [key: string]: { [productId: string]: number } } = {};

      orders.forEach((order: Order) => {
        if (!customerData[order.customerId]) {
          customerData[order.customerId] = {
            orders: [],
            firstOrder: new Date(order.createdAt),
            lastOrder: new Date(order.createdAt),
          };
          productCounts[order.customerId] = {};
        }

        customerData[order.customerId].orders.push(order);
        const orderDate = new Date(order.createdAt);
        if (orderDate < customerData[order.customerId].firstOrder) {
          customerData[order.customerId].firstOrder = orderDate;
        }
        if (orderDate > customerData[order.customerId].lastOrder) {
          customerData[order.customerId].lastOrder = orderDate;
        }

        // Track favorite products
        order.items?.forEach((item: any) => {
          if (item.productName) {
            productCounts[order.customerId][item.productName] = 
              (productCounts[order.customerId][item.productName] || 0) + item.quantity;
          }
        });
      });

      // Fetch products to calculate ratings
      const productsResponse: any = await apiClient.getProducts({ farmerId });
      const products: Array<{ _id: string; rating?: { average: number; count: number } }> = 
        productsResponse.success ? productsResponse.products || [] : [];

      // Fetch customer details and build customer list
      const customersList: Customer[] = [];
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const [customerId, data] of Object.entries(customerData)) {
        try {
          // Try to fetch customer details (restaurant user)
          const userResponse: any = await apiClient.getCurrentUser();
          // For now, use order data to build customer info
          const totalSpent = data.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          const avgOrderValue = data.orders.length > 0 ? totalSpent / data.orders.length : 0;
          const lastOrderDate = data.lastOrder;
          const daysSinceLastOrder = Math.floor((now.getTime() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000));
          const isActive = lastOrderDate >= thirtyDaysAgo;

          // Get favorite products
          const favoriteProducts = Object.entries(productCounts[customerId] || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name]) => name);

          // Calculate customer rating based on products they ordered
          const customerProducts = new Set<string>();
          data.orders.forEach((order: Order) => {
            order.items?.forEach((item: any) => {
              if (item.productId) customerProducts.add(item.productId);
            });
          });

          let customerRating = 0;
          let customerRatingCount = 0;
          Array.from(customerProducts).forEach((productId: string) => {
            const product = products.find((p: any) => p._id === productId);
            if (product?.rating?.average && product?.rating?.count) {
              customerRating += product.rating.average * product.rating.count;
              customerRatingCount += product.rating.count;
            }
          });
          const avgCustomerRating = customerRatingCount > 0 ? customerRating / customerRatingCount : 0;

          // Determine order frequency
          const daysSinceFirstOrder = Math.floor((now.getTime() - data.firstOrder.getTime()) / (24 * 60 * 60 * 1000));
          const avgDaysBetweenOrders = daysSinceFirstOrder / Math.max(data.orders.length - 1, 1);
          let orderFrequency = 'Monthly';
          if (avgDaysBetweenOrders < 7) orderFrequency = 'Weekly';
          else if (avgDaysBetweenOrders < 14) orderFrequency = 'Bi-weekly';

          // Determine payment status based on order value
          let paymentStatus: 'excellent' | 'good' | 'fair' = 'good';
          if (avgOrderValue > 100) paymentStatus = 'excellent';
          else if (avgOrderValue < 80) paymentStatus = 'fair';

          customersList.push({
            id: customerId,
            name: `Restaurant ${customerId.slice(-4)}`, // Will be replaced with actual name if available
            type: 'Restaurant',
            email: `customer${customerId.slice(-4)}@example.com`, // Placeholder
            phone: '(555) 000-0000', // Placeholder
            address: 'Address not available', // Placeholder
            since: data.firstOrder.toISOString().split('T')[0],
            totalOrders: data.orders.length,
            totalSpent,
            avgOrderValue,
            lastOrder: lastOrderDate.toISOString().split('T')[0],
            rating: avgCustomerRating,
            status: isActive ? 'active' : 'inactive',
            favoriteProducts,
            orderFrequency,
            paymentStatus,
            daysSinceLastOrder: isActive ? undefined : daysSinceLastOrder,
          });
        } catch (err) {
          console.log(`Could not fetch details for customer ${customerId}`);
        }
      }

      setCustomers(customersList.sort((a, b) => b.totalSpent - a.totalSpent));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCustomers = filteredCustomers.filter(c => c.status === 'active');
  const inactiveCustomers = filteredCustomers.filter(c => c.status === 'inactive');

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>;
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Fair</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderCustomerCard = (customer: Customer) => (
    <Card key={customer.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-lg">
                  {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{customer.name}</h3>
                <p className="text-sm text-gray-500">{customer.type}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{customer.rating}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(customer.status)}
              {getPaymentBadge(customer.paymentStatus)}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-3 border-y">
            <div>
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-lg font-bold text-green-600">${customer.totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Order</p>
              <p className="text-lg font-bold text-gray-900">${customer.avgOrderValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{customer.address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Customer since {customer.since} • Orders {customer.orderFrequency}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ShoppingCart className="h-4 w-4" />
              <span>Last order: {customer.lastOrder}</span>
            </div>
          </div>

          {/* Favorite Products */}
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Favorite Products
            </p>
            <div className="flex flex-wrap gap-1">
              {customer.favoriteProducts.map((product, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {product}
                </Badge>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {customer.status === 'inactive' && customer.daysSinceLastOrder && (
            <div className="bg-yellow-50 p-3 rounded-lg flex items-center gap-2 border border-yellow-200">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                No orders in {customer.daysSinceLastOrder} days - Consider reaching out
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedCustomer(customer);
                setShowDetailDialog(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-1">Manage your restaurant and market customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Total</span>
              <span className="text-xs text-gray-500">customers</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ordered recently</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {customers.length > 0
                ? (customers.reduce((sum, c) => sum + c.rating, 0) / customers.length).toFixed(1)
                : '0.0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Customer satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
        <TabsList>
          <TabsTrigger value="all">All Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCustomers.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveCustomers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                <p className="text-gray-500 mt-1">
                  {customers.length === 0
                    ? 'No customers have placed orders yet'
                    : 'Try adjusting your search or filters'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCustomers.map(renderCustomerCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                  {selectedCustomer?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription>{selectedCustomer?.type}</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Status & Rating */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedCustomer.status)}
                {getPaymentBadge(selectedCustomer.paymentStatus)}
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{selectedCustomer.rating}</span>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedCustomer.address}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600">${selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Order</p>
                  <p className="text-2xl font-bold text-purple-600">${selectedCustomer.avgOrderValue.toFixed(2)}</p>
                </div>
              </div>

              {/* History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Customer History</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Since</span>
                    <span className="font-semibold">{selectedCustomer.since}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Order</span>
                    <span className="font-semibold">{selectedCustomer.lastOrder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Frequency</span>
                    <span className="font-semibold">{selectedCustomer.orderFrequency}</span>
                  </div>
                </div>
              </div>

              {/* Favorite Products */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Favorite Products</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.favoriteProducts.map((product, idx) => (
                    <Badge key={idx} variant="outline">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
