/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import type { MenuItem, CartItem, Order } from '../types';
import { menuService, salesService } from '../services/api';
import { Menu } from './Menu';
import { Cart } from './Cart';
import { OrderHistory } from './OrderHistory';
import { Admin } from './Admin';
import { DailyExpenses } from './DailyExpenses';
import { Clipboard, BarChart3, Settings, LogOut, ShoppingBag, ChevronUp, X, DollarSign } from 'lucide-react';
import { formatPrice } from '../utils/price';

export const Dashboard: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'expenses' | 'admin'>('orders');
  const [menuLoading, setMenuLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {
        console.error('Failed to load cart from localStorage');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const normalizeListResponse = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.orders)) return payload.orders;
    return [];
  };

  // Fetch menu items
  const fetchMenu = async () => {
    try {
      setMenuLoading(true);
      const response = await menuService.fetchMenu();
      const items = normalizeListResponse(response.data);
      // Ensure each item has a unique display ID for cart matching
      // Keep original _id for backend operations (edit/delete)
      const itemsWithIds = items.map((item: any) => ({
        ...item,
        _id: item._id || item.id, // preserve backend ID
        id: item._id || item.id || `${item.name}-${item.price}`, // use backend ID as primary, fallback to synthetic
      }));
      setMenuItems(itemsWithIds);
      setError('');
    } catch {
      setError('Failed to load menu. Please try again.');
    } finally {
      setMenuLoading(false);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const response = await salesService.getSalesHistory();
      setOrders(normalizeListResponse(response.data));
    } catch (err) {
      console.error('Failed to fetch order history:', err);
    }
  };

  // Initial menu and orders load
  useEffect(() => {
    fetchMenu();
    fetchOrders();
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    const availableStock = item.inventoryEnabled && !item.inventoryIsUnlimited && item.inventoryQuantity !== null && item.inventoryQuantity !== undefined
      ? item.inventoryQuantity
      : Number.POSITIVE_INFINITY;

    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);
    const currentQty = existingItem?.quantity ?? 0;

    if (availableStock !== Number.POSITIVE_INFINITY && currentQty + 1 > availableStock) {
      setError(`Only ${availableStock} ${item.inventoryUnit || 'unit'}${availableStock === 1 ? '' : 's'} available.`);
      return;
    }

    if (availableStock === 0) {
      setError('This item is out of stock.');
      return;
    }

    setCartItems((prevItems) => {
      const existingCartItem = prevItems.find((cartItem) => cartItem.id === item.id);
      if (existingCartItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (itemId: string | undefined) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCartItems([]);
    }
  };

  const generateOrderID = () => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handleCheckout = async (customerName: string, orderDate: string) => {
    if (cartItems.length === 0) {
      setError('Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    setError('');
    setSuccess('');

    try {
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const orderID = generateOrderID();
      const normalizedCustomerName = customerName.trim();

      const orderPayload = {
        customerName: normalizedCustomerName || '',
        orderDate,
        items: cartItems,
        totalAmount: total,
      };

      await salesService.addToSales(orderPayload);

      // Add to local orders
      const newOrder: Order = {
        id: orderID,
        orderID,
        customerName: normalizedCustomerName || 'Guest',
        orderDate,
        items: cartItems,
        totalAmount: total,
        createdAt: new Date().toISOString(),
      };

      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      setCartItems([]);
      setIsCartOpen(false);
      await fetchMenu();
      setSuccess(`Order placed successfully! Order ID: ${orderID}`);

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setError(backendMessage || 'Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl bg-yellow-50 mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-red-600">The Crunch Society</h1>
            <p className="text-gray-500 text-xs font-medium mt-1">food shop management</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="px-3 py-2 bg-black text-white rounded hover:bg-gray-800 font-medium transition flex items-center gap-2 text-sm"
            title="Logout"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-0 font-medium transition-all border-b-2 flex items-center gap-2 text-sm ${
              activeTab === 'orders'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            <Clipboard size={18} />
            <span>Take Order</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-0 font-medium transition-all border-b-2 flex items-center gap-2 text-sm ${
              activeTab === 'history'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            <BarChart3 size={18} />
            <span>Order History</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-4 px-0 font-medium transition-all border-b-2 flex items-center gap-2 text-sm ${
              activeTab === 'expenses'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            <DollarSign size={18} />
            <span>Expenses</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-4 px-0 font-medium transition-all border-b-2 flex items-center gap-2 text-sm ${
              activeTab === 'admin'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            <Settings size={18} />
            <span>Admin</span>
          </button>
        </div>
      </div>
      </div>

      {/* Tabs */}
      

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Menu
                items={menuItems}
                onAddToCart={handleAddToCart}
                isLoading={menuLoading}
                orders={orders}
              />
            </div>
            <div className="hidden lg:block">
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onCheckout={handleCheckout}
                isLoading={checkoutLoading}
              />
            </div>
          </div>
        )}

        {activeTab === 'orders' && cartItems.length > 0 && isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={16} />
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} item{cartItems.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''} in cart
              </span>
              <span className="flex items-center gap-2 text-red-600">
                <span>₹{formatPrice(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                <ChevronUp size={16} />
              </span>
            </button>
          </div>
        )}

        {activeTab === 'orders' && isMobile && isCartOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-end"
            onClick={() => setIsCartOpen(false)}
          >
            <div
              className="w-full max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                <h2 className="text-lg font-semibold text-black">Your Order</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Close cart"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                <Cart
                  items={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  onCheckout={handleCheckout}
                  isLoading={checkoutLoading}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <OrderHistory orders={orders} isLoading={false} />
        )}

        {activeTab === 'expenses' && (
          <DailyExpenses />
        )}

        {activeTab === 'admin' && (
          <Admin currentMenu={menuItems} onMenuUpdated={fetchMenu} />
        )}
      </div>
    </div>
  );
};
