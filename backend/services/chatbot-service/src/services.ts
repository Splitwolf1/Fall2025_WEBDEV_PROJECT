import axios from 'axios';

// Configure axios defaults
axios.defaults.timeout = 5000; // 5 seconds timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Helper function for retrying requests
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (i === maxRetries) {
        throw error;
      }
      
      // Only retry on network errors, not on 4xx client errors
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

// Service endpoints
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || 'http://localhost:3004';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3005';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerId: string;
  items: any[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  deliveryInfo?: any;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  farmerId: string;
  inStock: boolean;
  images: string[];
}

export interface DeliveryInfo {
  id: string;
  orderNumber: string;
  status: string;
  estimatedDelivery: string;
  currentLocation?: string;
  driverInfo?: any;
}

// Order Service APIs
export const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  try {
    return await retryRequest(async () => {
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/number/${orderNumber}`);
      return response.data.data;
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching order:', error.message);
    throw new Error('Failed to fetch order information');
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/user/${userId}`);
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error fetching user orders:', error.message);
    return [];
  }
};

// Delivery Service APIs
export const getDeliveryInfo = async (orderNumber: string): Promise<DeliveryInfo | null> => {
  try {
    const response = await axios.get(`${DELIVERY_SERVICE_URL}/api/deliveries/order/${orderNumber}`);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching delivery info:', error.message);
    throw new Error('Failed to fetch delivery information');
  }
};

export const getDeliveryEstimate = async (zipCode?: string): Promise<string> => {
  try {
    const response = await axios.get(`${DELIVERY_SERVICE_URL}/api/deliveries/estimate`, {
      params: zipCode ? { zipCode } : {},
    });
    return response.data.data.estimate;
  } catch (error: any) {
    console.error('Error fetching delivery estimate:', error.message);
    return 'Our standard delivery time is 24-48 hours';
  }
};

// Product Service APIs
export const searchProducts = async (query: string, category?: string): Promise<Product[]> => {
  try {
    const params: any = { search: query, limit: 5 };
    if (category) {
      params.category = category;
    }
    
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, { params });
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error searching products:', error.message);
    return [];
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, {
      params: { category, limit: 5 }
    });
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error fetching products by category:', error.message);
    return [];
  }
};

// User Service APIs
export const getUserInfo = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching user info:', error.message);
    return null;
  }
};

// Utility function to format order status
export const formatOrderStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Order Confirmed',
    'processing': 'Being Prepared',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Utility function to format delivery status
export const formatDeliveryStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Preparing for Pickup',
    'picked_up': 'Picked Up',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'failed': 'Delivery Failed'
  };
  
  return statusMap[status] || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};