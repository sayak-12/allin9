import React, { useState, useEffect } from 'react';
import type { Order, SalesData } from '../types';
import { salesService } from '../services/api';
import { formatPrice } from '../utils/price';

interface OrderHistoryProps {
  orders: Order[];
  isLoading: boolean;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, isLoading }) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month' | '1-day' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    numberOfOrders: 0,
    averageOrderValue: 0,
  });
  const [statusMessage, setStatusMessage] = useState('');

  const getDateRange = (type: string): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (type) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(end.getDate() - end.getDay());
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        break;
    }

    return { start, end };
  };

  const getStatusStyles = (status?: string) => {
    switch (status) {
      case 'served':
        return 'border-green-200 bg-green-100 text-green-700';
      case 'cancelled':
        return 'border-red-200 bg-red-100 text-red-700';
      default:
        return 'border-gray-200 bg-gray-100 text-gray-700';
    }
  };

  const handleStatusUpdate = async (order: Order, status: 'served' | 'cancelled') => {
    try {
      const id = order._id || order.id;
      if (!id) return;
      await salesService.updateOrderStatus(id, status);

      const updatedOrder = { ...order, status };
      setLocalOrders((prev) => prev.map((item) => {
        const itemId = item._id || item.id;
        return itemId === id ? updatedOrder : item;
      }));
      setFilteredOrders((prev) => prev.map((item) => {
        const itemId = item._id || item.id;
        return itemId === id ? updatedOrder : item;
      }));

      setStatusMessage(`Order marked as ${status}.`);
      setTimeout(() => setStatusMessage(''), 2500);
    } catch {
      setStatusMessage('Failed to update order status.');
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  const handleServeAllOrders = async () => {
    try {
      await salesService.serveAllOrders();
      setLocalOrders((prev) => prev.map((order) => ({ ...order, status: 'served' })));
      setFilteredOrders((prev) => prev.map((order) => ({ ...order, status: 'served' })));
      setStatusMessage('All orders marked as served.');
      setTimeout(() => setStatusMessage(''), 2500);
    } catch {
      setStatusMessage('Failed to serve all orders. Please try again.');
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      const id = order._id || order.id;
      if (!id) return;
      if (!window.confirm('Are you sure you want to delete this order?')) return;

      await salesService.deleteOrder(id);
      setLocalOrders((prev) => prev.filter((item) => {
        const itemId = item._id || item.id;
        return itemId !== id;
      }));
      setFilteredOrders((prev) => prev.filter((item) => {
        const itemId = item._id || item.id;
        return itemId !== id;
      }));

      setStatusMessage('Order deleted successfully.');
      setTimeout(() => setStatusMessage(''), 2500);
    } catch {
      setStatusMessage('Failed to delete order. Please try again.');
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    let filtered = [...localOrders];

    if (filterType === 'all') {
      filtered = localOrders;
    } else if (filterType === '1-day' && singleDate) {
      const selectedDate = new Date(singleDate);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = localOrders.filter((order) => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === selectedDate.getTime();
      });
    } else if (filterType === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = localOrders.filter((order) => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    } else if (filterType !== 'custom' && filterType !== '1-day') {
      const { start, end } = getDateRange(filterType);
      filtered = localOrders.filter((order) => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }

    // Apply customer name filter
    if (customerNameFilter.trim()) {
      filtered = filtered.filter((order) =>
        order.customerName.toLowerCase().includes(customerNameFilter.toLowerCase())
      );
    }

    setFilteredOrders(filtered);

    // Calculate sales data
    const totalSales = filtered.reduce((sum, order) => sum + order.totalAmount, 0);
    const numberOfOrders = filtered.length;
    const averageOrderValue = numberOfOrders > 0 ? totalSales / numberOfOrders : 0;

    setSalesData({
      totalSales,
      numberOfOrders,
      averageOrderValue,
    });
  }, [filterType, startDate, endDate, singleDate, customerNameFilter, localOrders]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded">
        <p className="text-gray-500 text-sm">Loading order history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded p-6">
          <p className="text-gray-600 text-xs font-medium mb-2 uppercase">Total Sales</p>
          <p className="text-2xl font-bold text-black">₹{formatPrice(salesData.totalSales)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <p className="text-gray-600 text-xs font-medium mb-2 uppercase">Total Orders</p>
          <p className="text-2xl font-bold text-black">{salesData.numberOfOrders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <p className="text-gray-600 text-xs font-medium mb-2 uppercase">Avg Order Value</p>
          <p className="text-2xl font-bold text-black">
            ₹{formatPrice(salesData.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-4">Filter Orders</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'today', 'week', 'month', '1-day', 'custom'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as 'all' | 'today' | 'week' | 'month' | '1-day' | 'custom')}
              className={`px-3 py-2 rounded font-medium text-sm transition-all ${
                filterType === type
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === '1-day' ? '1-Day' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Customer Name
          </label>
          <input
            type="text"
            value={customerNameFilter}
            onChange={(e) => setCustomerNameFilter(e.target.value)}
            placeholder="Search customer name..."
            className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
          />
        </div>

        {filterType === 'custom' && (
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
              />
            </div>
          </div>
        )}

        {filterType === '1-day' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {statusMessage}
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-black">Orders ({filteredOrders.length})</h3>
          <button
            onClick={handleServeAllOrders}
            className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Serve All Orders
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">No orders found for the selected period</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredOrders.map((order) => (
              <div key={order.id} className={`border-l-4 ${order.status === 'served' ? 'border-green-500' : order.status === 'cancelled' ? 'border-red-500' : 'border-black-500'} bg-gray-50 p-4 rounded`}>
                <div className="flex justify-between items-start mb-2 flex-wrap">
                  <div>
                    <p className="text-gray-900">Order #{order.orderID}</p>
                    <p className="text-sm text-gray-600">
                      Customer: <span className="font-semibold">{order.customerName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusStyles(order.status)}`}>
                      {order.status || 'pending'}
                    </span>
                  </div>
                  {
                    order.status !== 'served' && order.status !== 'cancelled' && (
                      <div className="flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold text-red-600">₹{formatPrice(order.totalAmount)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(order, 'served')}
                        className="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                      >
                        Serve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order, 'cancelled')}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order)}
                        className="rounded bg-gray-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                    )
                  }
                  
                </div>

                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Items:</p>
                  <ul className="list-disc list-inside">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} × {item.quantity} = ₹{formatPrice(item.price * item.quantity)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
