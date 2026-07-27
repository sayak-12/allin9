import React, { useState, useEffect } from 'react';
import type { Order, SalesData } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  isLoading: boolean;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, isLoading }) => {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    numberOfOrders: 0,
    averageOrderValue: 0,
  });

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    let filtered = [...orders];

    if (filterType === 'all') {
      filtered = orders;
    } else if (filterType === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    } else if (filterType !== 'custom') {
      const { start, end } = getDateRange(filterType);
      filtered = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
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
  }, [filterType, startDate, endDate, customerNameFilter, orders]);

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
          <p className="text-2xl font-bold text-black">₹{salesData.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <p className="text-gray-600 text-xs font-medium mb-2 uppercase">Total Orders</p>
          <p className="text-2xl font-bold text-black">{salesData.numberOfOrders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6">
          <p className="text-gray-600 text-xs font-medium mb-2 uppercase">Avg Order Value</p>
          <p className="text-2xl font-bold text-black">
            ₹{salesData.averageOrderValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-4">Filter Orders</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'today', 'week', 'month', 'custom'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as 'all' | 'today' | 'week' | 'month' | 'custom')}
              className={`px-3 py-2 rounded font-medium text-sm transition-all ${
                filterType === type
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
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
      </div>

      {/* Orders List */}
      <div className="bg-white border border-gray-200 rounded p-6">
        <h3 className="text-lg font-bold text-black mb-4">Orders ({filteredOrders.length})</h3>

        {filteredOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">No orders found for the selected period</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border-l-4 border-black bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-start mb-2 flex-wrap">
                  <div>
                    <p className="text-gray-900">Order #{order.orderID}</p>
                    <p className="text-sm text-gray-600">
                      Customer: <span className="font-semibold">{order.customerName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">₹{order.totalAmount.toFixed(2)}</p>
                </div>

                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Items:</p>
                  <ul className="list-disc list-inside">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
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
