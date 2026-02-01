export interface MenuItem {
  _id?: string; // MongoDB ObjectId
  id: string; // display/cart ID
  name: string;
  price: number;
  description?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id?: string;
  orderID: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
}

export interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (mobileNumber: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface SalesData {
  totalSales: number;
  numberOfOrders: number;
  averageOrderValue: number;
}

export interface Offer {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  itemIds?: string[];
  maxUsage?: number;
  active?: boolean;
  createdBy?: string;
}
