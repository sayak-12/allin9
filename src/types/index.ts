export interface MenuItem {
  _id?: string; // MongoDB ObjectId
  id: string; // display/cart ID
  name: string;
  price: number;
  description?: string;
  inventoryEnabled?: boolean;
  inventoryItemId?: string | null;
  inventoryQuantity?: number | null;
  inventoryMinStockLevel?: number | null;
  inventoryUnit?: string;
  inventoryIsUnlimited?: boolean;
  inventoryStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id?: string;
  _id?: string;
  orderID: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  status?: 'pending' | 'served' | 'cancelled';
}

export interface InventoryItem {
  _id?: string;
  id?: string;
  itemName: string;
  sku?: string;
  category?: string;
  quantity: number;
  unit?: string;
  minStockLevel?: number;
  costPrice?: number;
  sellingPrice?: number;
  supplier?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  isUnlimited?: boolean;
}

export interface RawMaterialItem {
  _id?: string;
  id?: string;
  name: string;
  quantity: string | number;
  unit?: string;
  category?: string;
  notes?: string;
  status?: string;
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
