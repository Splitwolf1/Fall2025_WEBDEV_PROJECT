'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  MapPin,
  Star,
  Package,
  TrendingUp,
  Phone,
  Mail,
  Heart,
  Award,
  Clock,
  DollarSign,
  Leaf,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface Supplier {
  id: string;
  name: string;
  location: string;
  distance: string;
  rating: number;
  reviews: number;
  totalOrders: number;
  totalSpent: number;
  avgDeliveryTime: string;
  products: string[];
  certifications: string[];
  onTime: number;
  qualityScore: number;
  contact: {
    phone: string;
    email: string;
  };
  isFavorite: boolean;
  lastOrder: string;
}

// Mock supplier data (fallback)
const mockSuppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Green Valley Farm',
    location: 'Portland, OR',
    distance: '12.3 miles',
    rating: 4.9,
    reviews: 156,
    totalOrders: 48,
    totalSpent: 4250.50,
    avgDeliveryTime: '1.5 days',
    products: ['Tomatoes', 'Lettuce', 'Cucumbers', 'Peppers'],
    certifications: ['Organic', 'Non-GMO'],
    onTime: 98,
    qualityScore: 4.8,
    contact: {
      phone: '(555) 111-2222',
      email: 'contact@greenvalley.farm',
    },
    isFavorite: true,
    lastOrder: '2025-11-05',
  },
  {
    id: 'SUP-002',
    name: 'Sunny Acres',
    location: 'Beaverton, OR',
    distance: '18.7 miles',
    rating: 4.7,
    reviews: 92,
    totalOrders: 32,
    totalSpent: 2890.00,
    avgDeliveryTime: '2 days',
    products: ['Carrots', 'Potatoes', 'Onions', 'Beets'],
    certifications: ['Organic'],
    onTime: 95,
    qualityScore: 4.6,
    contact: {
      phone: '(555) 222-3333',
      email: 'hello@sunnyacres.com',
    },
    isFavorite: true,
    lastOrder: '2025-11-03',
  },
  {
    id: 'SUP-003',
    name: 'Harvest Hill Farm',
    location: 'Hillsboro, OR',
    distance: '22.1 miles',
    rating: 4.8,
    reviews: 124,
    totalOrders: 41,
    totalSpent: 3720.75,
    avgDeliveryTime: '1.8 days',
    products: ['Spinach', 'Kale', 'Arugula', 'Swiss Chard'],
    certifications: ['Organic', 'Certified Naturally Grown'],
    onTime: 96,
    qualityScore: 4.9,
    contact: {
      phone: '(555) 333-4444',
      email: 'info@harvesthill.farm',
    },
    isFavorite: false,
    lastOrder: '2025-11-04',
  },
  {
    id: 'SUP-004',
    name: 'Organic Meadows',
    location: 'Tigard, OR',
    distance: '15.5 miles',
    rating: 4.6,
    reviews: 78,
    totalOrders: 28,
    totalSpent: 2340.25,
    avgDeliveryTime: '2.2 days',
    products: ['Strawberries', 'Blueberries', 'Raspberries'],
    certifications: ['Organic'],
    onTime: 94,
    qualityScore: 4.5,
    contact: {
      phone: '(555) 444-5555',
      email: 'sales@organicmeadows.com',
    },
    isFavorite: false,
    lastOrder: '2025-10-28',
  },
  {
    id: 'SUP-005',
    name: 'Fresh Fields Co-op',
    location: 'Lake Oswego, OR',
    distance: '19.3 miles',
    rating: 4.5,
    reviews: 65,
    totalOrders: 22,
    totalSpent: 1950.00,
    avgDeliveryTime: '2.5 days',
    products: ['Mixed Greens', 'Herbs', 'Microgreens'],
    certifications: ['Organic', 'Fair Trade'],
    onTime: 92,
    qualityScore: 4.4,
    contact: {
      phone: '(555) 555-6666',
      email: 'orders@freshfields.coop',
    },
    isFavorite: false,
    lastOrder: '2025-10-25',
  },
];

export default function RestaurantSuppliersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('restaurant-favorite-suppliers');
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (e) {
        console.warn('Failed to load favorites from localStorage');
      }
    }
    
    fetchSuppliers(currentUser.id);
  }, [router]);

  const fetchSuppliers = async (restaurantId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch ALL farmers (suppliers)
      const farmersResponse: any = await apiClient.getUsersByRole('farmer');
      const farmers = farmersResponse.success ? farmersResponse.users || [] : [];

      // Fetch orders to calculate stats for farmers this restaurant has ordered from
      const ordersResponse: any = await apiClient.getOrders({ customerId: restaurantId });
      const orders = ordersResponse.success ? ordersResponse.orders || [] : [];

      // Group orders by farmer to calculate stats
      const orderStatsByFarmer: { [key: string]: {
        orders: any[];
        totalSpent: number;
        lastOrder: Date | null;
        productNames: Set<string>;
      } } = {};

      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          if (item.farmerId) {
            if (!orderStatsByFarmer[item.farmerId]) {
              orderStatsByFarmer[item.farmerId] = {
                orders: [],
                totalSpent: 0,
                lastOrder: null,
                productNames: new Set(),
              };
            }
            orderStatsByFarmer[item.farmerId].orders.push(order);
            orderStatsByFarmer[item.farmerId].productNames.add(item.productName || '');
            orderStatsByFarmer[item.farmerId].totalSpent += item.totalPrice || 0;
            
            const orderDate = new Date(order.createdAt);
            if (!orderStatsByFarmer[item.farmerId].lastOrder || orderDate > orderStatsByFarmer[item.farmerId].lastOrder!) {
              orderStatsByFarmer[item.farmerId].lastOrder = orderDate;
            }
          }
        });
      });

      // Fetch all products to get ratings and product lists
      const productsResponse: any = await apiClient.getProducts({ limit: '500' });
      const allProducts = productsResponse.success ? productsResponse.products || [] : [];

      // Build supplier list from all farmers
      const suppliersList: Supplier[] = [];
      
      for (const farmer of farmers) {
        const farmerId = farmer.id || farmer._id;
        
        // Get all products from this farmer
        const farmerProducts = allProducts.filter((p: any) => {
          const pFarmerId = p.farmerId?._id || p.farmerId?.id || p.farmerId;
          return pFarmerId === farmerId || pFarmerId?.toString() === farmerId?.toString();
        });
        
        // Calculate average rating from products
        let totalRating = 0;
        let totalRatingCount = 0;
        farmerProducts.forEach((product: any) => {
          if (product.rating?.average && product.rating?.count) {
            totalRating += product.rating.average * product.rating.count;
            totalRatingCount += product.rating.count;
          }
        });
        const avgRating = totalRatingCount > 0 ? totalRating / totalRatingCount : 0;

        // Get order stats if restaurant has ordered from this farmer
        const stats = orderStatsByFarmer[farmerId] || {
          orders: [],
          totalSpent: 0,
          lastOrder: null,
          productNames: new Set(),
        };

        // Calculate average delivery time from orders
        const deliveredOrders = stats.orders.filter((o: any) => o.status === 'delivered' || o.status === 'completed');
        let avgDeliveryDays = 0;
        let deliveryCount = 0;
        
        for (const order of deliveredOrders.slice(0, 10)) {
          try {
            const deliveryResponse: any = await apiClient.getDeliveries({ orderId: order._id });
            if (deliveryResponse.success && deliveryResponse.deliveries && deliveryResponse.deliveries.length > 0) {
              const delivery = deliveryResponse.deliveries[0];
              const orderDate = new Date(order.createdAt);
              const deliveryDate = delivery.route?.delivery?.actualTime 
                ? new Date(delivery.route.delivery.actualTime)
                : delivery.updatedAt 
                ? new Date(delivery.updatedAt)
                : null;
              
              if (deliveryDate && deliveryDate > orderDate) {
                const diffMs = deliveryDate.getTime() - orderDate.getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                avgDeliveryDays += diffDays;
                deliveryCount++;
              }
            }
          } catch (err) {
            // Skip if delivery not found
          }
        }
        
        const avgDeliveryTime = deliveryCount > 0 
          ? (avgDeliveryDays / deliveryCount < 1 
              ? `${Math.round((avgDeliveryDays / deliveryCount) * 24)} hours`
              : `${(avgDeliveryDays / deliveryCount).toFixed(1)} days`)
          : 'N/A';

        // Calculate on-time rate
        const onTimeRate = deliveryCount > 0 
          ? Math.round((deliveredOrders.filter(() => avgDeliveryDays / deliveryCount <= 2).length / deliveryCount) * 100)
          : 0;

        // Get farmer details
        const farmName = farmer.farmDetails?.farmName || `${farmer.profile?.firstName || ''} ${farmer.profile?.lastName || ''}`.trim() || `Farm ${farmerId.slice(-4)}`;
        const location = farmer.farmDetails?.address || 'Location not available';
        const certifications = farmer.farmDetails?.certifications || [];
        const phone = farmer.profile?.phone || 'N/A';
        const email = farmer.email || 'N/A';

        // Get product names (from products or order history)
        const productNames = farmerProducts.length > 0
          ? farmerProducts.slice(0, 4).map((p: any) => p.name)
          : Array.from(stats.productNames).slice(0, 4);

        suppliersList.push({
          id: farmerId,
          name: farmName,
          location,
          distance: 'N/A', // Could calculate if we have restaurant location
          rating: avgRating,
          reviews: totalRatingCount,
          totalOrders: stats.orders.length,
          totalSpent: stats.totalSpent,
          avgDeliveryTime: stats.orders.length > 0 ? avgDeliveryTime : 'N/A',
          products: productNames,
          certifications,
          onTime: stats.orders.length > 0 ? onTimeRate : 0,
          qualityScore: avgRating > 0 ? avgRating : 0,
          contact: {
            phone,
            email,
          },
          isFavorite: favorites.has(farmerId),
          lastOrder: stats.lastOrder ? stats.lastOrder.toISOString().split('T')[0] : 'Never',
        });
      }

      // Sort: favorites first, then by total orders (if ordered from), then alphabetically
      suppliersList.sort((a, b) => {
        const aFav = favorites.has(a.id);
        const bFav = favorites.has(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
        return a.name.localeCompare(b.name);
      });

      setSuppliers(suppliersList);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError(err.message || 'Failed to load suppliers');
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.products.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const favoriteSuppliers = filteredSuppliers.filter(s => favorites.has(s.id));
  const allSuppliers = filteredSuppliers;

  const toggleFavorite = (supplierId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(supplierId)) {
        newFavorites.delete(supplierId);
      } else {
        newFavorites.add(supplierId);
      }
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('restaurant-favorite-suppliers', JSON.stringify(Array.from(newFavorites)));
      }
      
      // Update supplier's favorite status
      setSuppliers(prev => prev.map(s => 
        s.id === supplierId ? { ...s, isFavorite: newFavorites.has(supplierId) } : s
      ));
      
      return newFavorites;
    });
  };

  const handleViewSupplier = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailDialog(true);
    
    // Fetch all products from this supplier
    setIsLoadingProducts(true);
    try {
      const productsResponse: any = await apiClient.getProducts({ farmerId: supplier.id });
      if (productsResponse.success) {
        setSupplierProducts(productsResponse.products || []);
      } else {
        setSupplierProducts([]);
      }
    } catch (err) {
      console.error('Error fetching supplier products:', err);
      setSupplierProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const renderSupplierCard = (supplier: Supplier) => (
    <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                  {supplier.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{supplier.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span>{supplier.location} • {supplier.distance}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(supplier.id)}
              className={favorites.has(supplier.id) ? 'text-red-500' : 'text-gray-400'}
            >
              <Heart className={`h-5 w-5 ${favorites.has(supplier.id) ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Rating & Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{supplier.rating}</span>
              <span className="text-gray-500">({supplier.reviews})</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Package className="h-4 w-4" />
              <span>{supplier.totalOrders} orders</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{supplier.avgDeliveryTime}</span>
            </div>
          </div>

          {/* Products */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Products:</p>
            <div className="flex flex-wrap gap-1">
              {supplier.products.map((product, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {product}
                </Badge>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {supplier.certifications.length > 0 && (
            <div className="flex gap-2">
              {supplier.certifications.map((cert, idx) => (
                <Badge key={idx} className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                  <Leaf className="h-3 w-3 mr-1" />
                  {cert}
                </Badge>
              ))}
            </div>
          )}

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <p className="text-xs text-gray-500">On-Time Delivery</p>
              <p className="text-lg font-semibold text-green-600">{supplier.onTime}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Quality Score</p>
              <p className="text-lg font-semibold text-gray-900">{supplier.qualityScore}/5.0</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewSupplier(supplier)}>
              View Details
            </Button>
            <Button size="sm" className="flex-1">
              <Package className="h-4 w-4 mr-2" />
              Order Now
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
        <h1 className="text-3xl font-bold text-gray-900">My Suppliers</h1>
        <p className="text-gray-600 mt-1">Manage your farm and produce suppliers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{suppliers.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active partnerships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Favorites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{favorites.size}</div>
            <p className="text-xs text-gray-500 mt-1">Preferred suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${suppliers.reduce((sum, s) => sum + s.totalSpent, 0).toLocaleString()}
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
              {suppliers.length > 0 
                ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)
                : '0.0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Supplier quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search suppliers by name, location, or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Suppliers ({allSuppliers.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites ({favoriteSuppliers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading suppliers...</span>
            </div>
          ) : allSuppliers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No suppliers found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or place your first order</p>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allSuppliers.map(renderSupplierCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {favoriteSuppliers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No favorite suppliers yet</h3>
                <p className="text-gray-500 mt-1">Click the heart icon to add suppliers to your favorites</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteSuppliers.map(renderSupplierCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Supplier Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                  {selectedSupplier?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription>{selectedSupplier?.location}</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              {/* Rating & Reviews */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold">{selectedSupplier.rating}</span>
                  <span className="text-gray-500">({selectedSupplier.reviews} reviews)</span>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Award className="h-3 w-3 mr-1" />
                  {selectedSupplier.onTime}% On-Time
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{selectedSupplier.contact.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{selectedSupplier.contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedSupplier.distance} away</span>
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Products Available {supplierProducts.length > 0 && `(${supplierProducts.length})`}
                </h4>
                {isLoadingProducts ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    <span className="text-sm text-gray-600">Loading products...</span>
                  </div>
                ) : supplierProducts.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">
                    {selectedSupplier.products.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSupplier.products.map((product, idx) => (
                          <Badge key={idx} variant="outline">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      'No products available'
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {supplierProducts.map((product: any) => (
                      <div key={product._id || product.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.category} • ${product.price?.toFixed(2) || '0.00'} / {product.unit || 'unit'}
                            {product.stockQuantity !== undefined && (
                              <span className="ml-2">• Stock: {product.stockQuantity}</span>
                            )}
                          </div>
                        </div>
                        {product.rating?.average && (
                          <div className="flex items-center gap-1 ml-2">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{product.rating.average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.certifications.map((cert, idx) => (
                    <Badge key={idx} className="bg-green-100 text-green-800 hover:bg-green-100">
                      <Leaf className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-xl font-semibold text-gray-900">{selectedSupplier.totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-xl font-semibold text-gray-900">${selectedSupplier.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Delivery</p>
                  <p className="text-xl font-semibold text-gray-900">{selectedSupplier.avgDeliveryTime}</p>
                </div>
              </div>

              {/* Performance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">On-Time Delivery</p>
                  <p className="text-2xl font-bold text-green-600">{selectedSupplier.onTime}%</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedSupplier.qualityScore}/5.0</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDetailDialog(false);
              setSupplierProducts([]);
            }}>Close</Button>
            <Button onClick={() => {
              setShowDetailDialog(false);
              setSupplierProducts([]);
              // Navigate to browse page filtered by this supplier
              router.push(`/restaurant/browse?supplier=${selectedSupplier?.id}`);
            }}>
              <Package className="h-4 w-4 mr-2" />
              View All Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
