'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Heart,
  ShoppingCart,
  Star,
  MapPin,
  Plus,
  Minus,
  Check,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';

interface Product {
  _id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
  price: number;
  qualityGrade: string;
  description?: string;
  certifications?: string[];
  farmerId: string;
  farmerName?: string;
  isAvailable: boolean;
}

export default function BrowseProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load products on mount
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response: any = await apiClient.getProducts({
        // Only fetch available products
        limit: 100
      });

      if (response.success && response.products) {
        // Filter for available products only
        const availableProducts = response.products.filter((p: Product) => p.isAvailable && p.stockQuantity > 0);
        setProducts(availableProducts);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (productId: string) => {
    setCartItems(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const cartTotal = Object.entries(cartItems).reduce((sum, [id, quantity]) => {
    const product = products.find(p => p._id === id);
    return sum + (product ? product.price * quantity : 0);
  }, 0);

  const cartItemCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const handleCheckout = async () => {
    const user = auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (Object.keys(cartItems).length === 0) {
      return;
    }

    try {
      setIsLoading(true);

      // Build order items from cart
      const items = Object.entries(cartItems).map(([productId, quantity]) => {
        const product = products.find(p => p._id === productId);
        if (!product) return null;

        return {
          productId: product._id,
          farmerId: product.farmerId,
          productName: product.name,
          quantity,
          unit: product.unit,
          pricePerUnit: product.price,
          totalPrice: product.price * quantity,
        };
      }).filter(Boolean);

      // Create order
      const response: any = await apiClient.createOrder({
        customerId: user.id,
        customerType: 'restaurant',
        items,
        totalAmount: cartTotal,
        deliveryAddress: {
          street: '123 Restaurant St',
          city: 'Your City',
          state: 'State',
          zipCode: '12345',
          country: 'USA',
        },
        notes: 'Order placed via browse page',
      });

      if (response.success) {
        // Clear cart
        setCartItems({});

        // Show success message (you could use a toast library here)
        alert(`Order #${response.order?.orderNumber || 'created'} placed successfully!`);

        // Redirect to orders page
        router.push('/restaurant/orders');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place order');
      alert('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
            <p className="text-gray-500 mt-1">Discover fresh produce from local farms</p>
          </div>

          {/* Cart Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="gap-2 relative">
                <ShoppingCart className="h-4 w-4" />
                View Cart
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Shopping Cart</SheetTitle>
                <SheetDescription>
                  Review your items and proceed to checkout
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8 space-y-4">
                {Object.entries(cartItems).length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {Object.entries(cartItems).map(([id, quantity]) => {
                        const product = products.find(p => p._id === id);
                        if (!product) return null;

                        const emoji = product.category === 'vegetables' ? '🥬' :
                                     product.category === 'fruits' ? '🍎' :
                                     product.category === 'herbs' ? '🌿' :
                                     product.category === 'dairy' ? '🥛' : '🌾';

                        return (
                          <div key={id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="text-3xl">{emoji}</div>
                            <div className="flex-1">
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-500">
                                {product.farmerName || `Farmer ${product.farmerId.slice(0, 8)}`}
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                ${product.price.toFixed(2)}/{product.unit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(product._id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(product._id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-green-600">${cartTotal.toFixed(2)}</span>
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Proceed to Checkout'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search products or farms..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Vegetables">Vegetables</SelectItem>
                    <SelectItem value="Fruits">Fruits</SelectItem>
                    <SelectItem value="Herbs">Herbs</SelectItem>
                    <SelectItem value="Dairy">Dairy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  Organic Only
                </Button>
                <Button variant="outline" size="sm">
                  <MapPin className="h-3 w-3 mr-1" />
                  Nearby (&lt;10 mi)
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="h-3 w-3 mr-1" />
                  Highly Rated
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-3 w-3 mr-1" />
                  Favorites
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => {
              const emoji = product.category === 'vegetables' ? '🥬' :
                           product.category === 'fruits' ? '🍎' :
                           product.category === 'herbs' ? '🌿' :
                           product.category === 'dairy' ? '🥛' : '🌾';

              return (
                <Card key={product._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-t-lg">
                      <div className="text-6xl text-center">{emoji}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute top-2 right-2 h-8 w-8 p-0 ${
                          favorites.has(product._id) ? 'text-red-500' : 'text-gray-400'
                        }`}
                        onClick={() => toggleFavorite(product._id)}
                      >
                        <Heart
                          className={`h-5 w-5 ${favorites.has(product._id) ? 'fill-current' : ''}`}
                        />
                      </Button>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Product Info */}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">
                          {product.farmerName || `Farmer ${product.farmerId.slice(0, 8)}`}
                        </p>
                      </div>

                      {/* Quality Badge */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Grade {product.qualityGrade}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {product.category}
                        </Badge>
                      </div>

                      {/* Certifications */}
                      {product.certifications && product.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.certifications.map((cert) => (
                            <Badge key={cert} variant="secondary" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      )}

                      {/* Price & Stock */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            ${product.price.toFixed(2)}
                            <span className="text-sm text-gray-500">/{product.unit}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {product.stockQuantity} {product.unit} available
                          </p>
                        </div>
                      </div>

                      {/* Add to Cart */}
                      {cartItems[product._id] ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => removeFromCart(product._id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-4 font-medium">{cartItems[product._id]}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => addToCart(product._id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full gap-2"
                          onClick={() => addToCart(product._id)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
