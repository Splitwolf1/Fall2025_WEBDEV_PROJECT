'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Package,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  _id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
  price: number;
  qualityGrade: string;
  harvestDate?: string;
  isAvailable: boolean;
  description?: string;
  certifications?: string[];
  images?: string[];
}

export default function InventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Form state for adding product
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'vegetables',
    stockQuantity: '',
    unit: 'lb',
    price: '',
    qualityGrade: 'A',
    harvestDate: '',
    description: '',
    certifications: [] as string[],
  });

  // Load user and products on mount
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchProducts(currentUser.id);
  }, [router]);

  const fetchProducts = async (farmerId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response: any = await apiClient.getProducts({ farmerId });

      if (response.success && response.products) {
        setProducts(response.products);
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

  const handleAddProduct = async () => {
    if (!user) return;

    // Validation
    if (!newProduct.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!newProduct.stockQuantity || parseInt(newProduct.stockQuantity) < 0) {
      setError('Valid stock quantity is required');
      return;
    }
    if (!newProduct.price || parseFloat(newProduct.price) < 0) {
      setError('Valid price is required');
      return;
    }

    try {
      setIsAdding(true);
      setError('');
      const response: any = await apiClient.createProduct({
        farmerId: user.id,
        name: newProduct.name.trim(),
        category: newProduct.category,
        stockQuantity: parseInt(newProduct.stockQuantity) || 0,
        unit: newProduct.unit,
        price: parseFloat(newProduct.price) || 0,
        qualityGrade: newProduct.qualityGrade,
        harvestDate: newProduct.harvestDate ? new Date(newProduct.harvestDate).toISOString() : undefined,
        description: newProduct.description || '',
        certifications: newProduct.certifications || [],
        isAvailable: true,
      });

      if (response.success) {
        setIsAddDialogOpen(false);
        await fetchProducts(user.id);
        // Reset form
        setNewProduct({
          name: '',
          category: 'vegetables',
          stockQuantity: '',
          unit: 'lb',
          price: '',
          qualityGrade: 'A',
          harvestDate: '',
          description: '',
          certifications: [],
        });
      } else {
        setError(response.message || 'Failed to add product');
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to add product. Please check your connection and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await apiClient.deleteProduct(productId);
      if (user) {
        fetchProducts(user.id);
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product');
    }
  };

  // Calculate stock status
  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) return 'out_of_stock';
    if (product.stockQuantity < 50) return 'low_stock';
    return 'in_stock';
  };

  // Mock inventory data for backward compatibility
  const mockProducts = [
    {
      id: 1,
      name: 'Organic Tomatoes',
      category: 'Vegetables',
      stock: 150,
      unit: 'lbs',
      price: 4.5,
      quality: 'A',
      harvestDate: '2025-11-01',
      status: 'in_stock',
      lowStockThreshold: 50,
      image: '🍅',
    },
    {
      id: 2,
      name: 'Fresh Lettuce',
      category: 'Vegetables',
      stock: 85,
      unit: 'lbs',
      price: 3.2,
      quality: 'A',
      harvestDate: '2025-11-02',
      status: 'in_stock',
      lowStockThreshold: 40,
      image: '🥬',
    },
    {
      id: 3,
      name: 'Sweet Corn',
      category: 'Vegetables',
      stock: 35,
      unit: 'lbs',
      price: 2.8,
      quality: 'B',
      harvestDate: '2025-10-30',
      status: 'low_stock',
      lowStockThreshold: 50,
      image: '🌽',
    },
    {
      id: 4,
      name: 'Bell Peppers',
      category: 'Vegetables',
      stock: 0,
      unit: 'lbs',
      price: 5.0,
      quality: 'A',
      harvestDate: '2025-10-28',
      status: 'out_of_stock',
      lowStockThreshold: 30,
      image: '🫑',
    },
    {
      id: 5,
      name: 'Organic Carrots',
      category: 'Vegetables',
      stock: 120,
      unit: 'lbs',
      price: 3.5,
      quality: 'A',
      harvestDate: '2025-11-03',
      status: 'in_stock',
      lowStockThreshold: 60,
      image: '🥕',
    },
    {
      id: 6,
      name: 'Strawberries',
      category: 'Fruits',
      stock: 45,
      unit: 'lbs',
      price: 6.5,
      quality: 'A',
      harvestDate: '2025-11-04',
      status: 'in_stock',
      lowStockThreshold: 20,
      image: '🍓',
    },
    {
      id: 7,
      name: 'Fresh Herbs Mix',
      category: 'Herbs',
      stock: 15,
      unit: 'lbs',
      price: 8.0,
      quality: 'A',
      harvestDate: '2025-11-04',
      status: 'low_stock',
      lowStockThreshold: 20,
      image: '🌿',
    },
    {
      id: 8,
      name: 'Potatoes',
      category: 'Vegetables',
      stock: 200,
      unit: 'lbs',
      price: 2.2,
      quality: 'B',
      harvestDate: '2025-10-25',
      status: 'in_stock',
      lowStockThreshold: 100,
      image: '🥔',
    },
  ];

  const stats = {
    totalProducts: products.length,
    inStock: products.filter(p => getStockStatus(p) === 'in_stock').length,
    lowStock: products.filter(p => getStockStatus(p) === 'low_stock').length,
    outOfStock: products.filter(p => getStockStatus(p) === 'out_of_stock').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getQualityBadge = (quality: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={`${colors[quality] || 'bg-gray-100 text-gray-800'} hover:bg-inherit`}>
        Grade {quality}
      </Badge>
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500 mt-1">Manage your products and stock levels</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory. Fill in all required fields.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Organic Tomatoes"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="fruits">Fruits</SelectItem>
                      <SelectItem value="herbs">Herbs</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="grains">Grains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="e.g., 100"
                    value={newProduct.stockQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={newProduct.unit}
                    onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">Pounds (lb)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="unit">Units</SelectItem>
                      <SelectItem value="dozen">Dozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Unit *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 4.50"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality Grade *</Label>
                  <Select
                    value={newProduct.qualityGrade}
                    onValueChange={(value) => setNewProduct({ ...newProduct, qualityGrade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Grade A - Premium</SelectItem>
                      <SelectItem value="B">Grade B - Standard</SelectItem>
                      <SelectItem value="C">Grade C - Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="harvest">Harvest Date</Label>
                  <Input
                    id="harvest"
                    type="date"
                    value={newProduct.harvestDate}
                    onChange={(e) => setNewProduct({ ...newProduct, harvestDate: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional product description..."
                    rows={3}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">In Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                  <SelectItem value="Fruits">Fruits</SelectItem>
                  <SelectItem value="Herbs">Herbs</SelectItem>
                  <SelectItem value="Dairy">Dairy</SelectItem>
                  <SelectItem value="Grains">Grains</SelectItem>
                </SelectContent>
              </Select>
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
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first product'}
                </p>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-5xl">
                        {product.category === 'vegetables' && '🥬'}
                        {product.category === 'fruits' && '🍎'}
                        {product.category === 'herbs' && '🌿'}
                        {product.category === 'dairy' && '🥛'}
                        {product.category === 'grains' && '🌾'}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>

                    <div className="flex items-center gap-2 mb-3">
                      {getStatusBadge(stockStatus)}
                      {getQualityBadge(product.qualityGrade)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stock:</span>
                        <span className="font-medium">
                          {product.stockQuantity} {product.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium text-green-600">
                          ${product.price.toFixed(2)}/{product.unit}
                        </span>
                      </div>
                      {product.harvestDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Harvested:</span>
                          <span className="font-medium text-gray-700">
                            {new Date(product.harvestDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stock Progress Bar */}
                    {product.stockQuantity > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Stock Level</span>
                          <span>{Math.round((product.stockQuantity / 100) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              stockStatus === 'low_stock'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((product.stockQuantity / 100) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" className="flex-1">
                        Update Stock
                      </Button>
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
