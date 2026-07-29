import React, { useState } from 'react';
import type { MenuItem, Order } from '../types';
import { Search, X } from 'lucide-react';
import { formatPrice } from '../utils/price';

interface MenuProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  isLoading: boolean;
  orders: Order[];
}

export const Menu: React.FC<MenuProps> = ({ items, onAddToCart, isLoading, orders }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate sales count for each item
  const itemSalesCount = items.reduce((acc, item) => {
    const count = orders.reduce((sum, order) => {
      return sum + order.items.filter(orderItem => orderItem.id === item.id).reduce((qty, oi) => qty + oi.quantity, 0);
    }, 0);
    acc[item.id] = count;
    return acc;
  }, {} as Record<string, number>);

  const filteredItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    // Sort by sales count (highest first)
    .sort((a, b) => (itemSalesCount[b.id] || 0) - (itemSalesCount[a.id] || 0));
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No menu items available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {searchQuery && filteredItems.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found</p>
        )}
      </div>

      {/* Items Grid or No Results */}
      {filteredItems.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items match your search</p>
          <p className="text-gray-400 text-sm mt-1">Try searching for something else</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-black">₹{formatPrice(item.price)}</span>
                  <button
                    onClick={() => onAddToCart(item)}
                    className="px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {item.inventoryEnabled ? (
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">Stock:</span>{' '}
                    {item.inventoryIsUnlimited ? 'Unlimited' : `${item.inventoryQuantity ?? 0} ${item.inventoryUnit || 'pcs'}`}
                    {item.inventoryStatus && ` • ${item.inventoryStatus.replace('_', ' ')}`}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Inventory tracking off</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
