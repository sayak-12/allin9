import React from 'react';
import type { MenuItem } from '../types';
import { UtensilsCrossed } from 'lucide-react';

interface MenuProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  isLoading: boolean;
}

export const Menu: React.FC<MenuProps> = ({ items, onAddToCart, isLoading }) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-gray-200 rounded overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="bg-gray-100 h-24 flex items-center justify-center border-b border-gray-200">
            <UtensilsCrossed size={28} className="text-gray-400" />
          </div>

          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-black">₹{item.price.toFixed(2)}</span>
              <button
                onClick={() => onAddToCart(item)}
                className="px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
