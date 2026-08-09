/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import type { CartItem, Offer } from '../types';
import { offerService } from '../services/api';
import { Gift } from 'lucide-react';
import { formatPrice } from '../utils/price';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string | undefined, quantity: number) => void;
  onRemoveItem: (itemId: string | undefined) => void;
  onClearCart: () => void;
  onCheckout: (customerName: string, orderDate: string) => void;
  isLoading: boolean;
}

const getTodayDateValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isLoading,
}) => {
  const [customerName, setCustomerName] = React.useState('');
  const [orderDate, setOrderDate] = React.useState(getTodayDateValue());
  const [offers, setOffers] = useState<Offer[]>([]);
  const [enabledOffers, setEnabledOffers] = useState<string[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Fetch active offers on mount
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setOffersLoading(true);
      const response = await offerService.getOffers();
      console.log('Fetched offers:', response.data);
      setOffers(response.data || []);
      // Enable all offers by default
      const offerIds = (response.data || []).map((o: Offer) => (o._id || o.id) as string).filter(Boolean);
      setEnabledOffers(offerIds);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setOffersLoading(false);
    }
  };

  // Determine if an offer is currently applicable given cart contents and dates
  const isOfferApplicable = (offer: Offer): boolean => {
    try {
      const now = new Date();
      const start = new Date(offer.startDate);
      const end = new Date(offer.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
      if (now < start || now > end) return false;

      const itemIds = offer.itemIds || [];
      const applicableItems = itemIds.length === 0 ? items : items.filter((it) => itemIds.includes(it.id));
      if (applicableItems.length === 0) return false;

      // minOrderAmount should apply to the whole cart subtotal
      const cartSubtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      if (offer.minOrderAmount && cartSubtotal < offer.minOrderAmount) return false;

      return true;
    } catch {
      return false;
    }
  };

  // Keep enabledOffers in sync: remove any enabled offers that became inapplicable
  React.useEffect(() => {
    if (offers.length === 0) return;
    setEnabledOffers((prev) => prev.filter((id) => {
      const offer = offers.find((o) => (o._id || o.id) === id);
      return !!offer && isOfferApplicable(offer);
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, items]);

  const toggleOffer = (offerId: string | undefined) => {
    if (!offerId) return;
    const offer = offers.find((o) => (o._id || o.id) === offerId);
    if (!offer) return;
    if (!isOfferApplicable(offer)) return; // prevent toggling if not applicable

    setEnabledOffers((prev) => {
      if (prev.includes(offerId)) {
        return prev.filter((id) => id !== offerId);
      } else {
        return [...prev, offerId];
      }
    });
  };

  const calculateDiscount = (): number => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;

    enabledOffers.forEach((offerId) => {
      const offer = offers.find((o) => (o._id || o.id) === offerId);
      if (!offer) return;

      // Check if offer applies to selected items
      const itemIds = offer.itemIds || [];
      const applicableItems =
        itemIds.length === 0
          ? items
          : items.filter((item) => itemIds.includes(item.id));

      if (applicableItems.length === 0) return;

      const applicableSubtotal = applicableItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Check minimum order amount (apply on cart subtotal)
      const cartSubtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      if (offer.minOrderAmount && cartSubtotal < offer.minOrderAmount) {
        return;
      }

      // Calculate discount
      if (offer.discountType === 'percentage') {
        discount += (applicableSubtotal * offer.discountValue) / 100;
      } else {
        discount += offer.discountValue;
      }
    });

    return Math.min(discount, subtotal); // Don't discount more than subtotal
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = calculateDiscount();
  const total = subtotal - discount;

  // Calculate per-item unit discount for item-specific enabled offers
  const getItemUnitDiscount = (item: CartItem): number => {
    let unitDiscount = 0;
    enabledOffers.forEach((offerId) => {
      const offer = offers.find((o) => (o._id || o.id) === offerId);
      if (!offer) return;
      // only consider item-specific offers for per-item discount display
      const itemIds = offer.itemIds || [];
      if (itemIds.length === 0) return; // skip whole-menu offers for per-item strikethrough

      if (!itemIds.includes(item.id)) return;

      // Skip if offer not applicable (date/min cart amount handled elsewhere)
      if (!isOfferApplicable(offer)) return;

      // applicable items and subtotal for distribution (for fixed discounts)
      const applicableItems = items.filter((it) => itemIds.includes(it.id));
      const applicableSubtotal = applicableItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
      if (applicableSubtotal <= 0) return;

      if (offer.discountType === 'percentage') {
        unitDiscount += (item.price * (offer.discountValue / 100));
      } else {
        // distribute fixed discount proportionally to item's share
        const itemShare = (item.price * item.quantity) / applicableSubtotal;
        const discountShare = itemShare * offer.discountValue;
        unitDiscount += discountShare / item.quantity;
      }
    });

    // don't exceed item price
    return Math.min(unitDiscount, item.price);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6 text-center rounded">
        <p className="text-gray-500 text-sm">Your cart is empty</p>
        <p className="text-xs text-gray-400 mt-1">Add a few items to start your order</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6 rounded">
      <h2 className="text-xl font-bold text-black mb-4">Order Summary</h2>

      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-gray-50 p-4 rounded border border-gray-200 text-sm"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{item.name}</p>
              {item.inventoryEnabled && (
                <p className="text-xs text-gray-600 mt-1">
                  Stock: {item.inventoryIsUnlimited ? 'Unlimited' : `${item.inventoryQuantity ?? 0} ${item.inventoryUnit || 'pcs'}`}
                </p>
              )}
              {(() => {
                const unitDisc = getItemUnitDiscount(item);
                if (unitDisc > 0) {
                  const discountedUnit = Math.max(0, item.price - unitDisc);
                  return (
                    <p className="text-sm">
                      <span className="text-gray-400 line-through mr-2">₹{formatPrice(item.price)}</span>
                      <span className="text-green-600 font-semibold">₹{formatPrice(discountedUnit)}</span>
                    </p>
                  );
                }

                return <p className="text-sm text-gray-600">₹{formatPrice(item.price)}</p>;
              })()}
            </div>
            <div className="flex flex-col items-center gap-2">
<div className="flex items-center text-xs bg-white border border-gray-300 rounded">
              <button
                onClick={() => {
                  const newQty = item.quantity - 1;
                  if (newQty < 1) {
                    onRemoveItem(item.id);
                  } else {
                    onUpdateQuantity(item.id, newQty);
                  }
                }}
                className="text-md w-6 h-6 font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                −
              </button>
              <span className="p-1 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="text-md w-6 h-6 font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                +
              </button>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {(() => {
                  const unitDisc = getItemUnitDiscount(item);
                  const discountedUnit = Math.max(0, item.price - unitDisc);
                  return `₹${formatPrice(discountedUnit * item.quantity)}`;
                })()}
              </p>
            </div>
            </div>
            

            
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        {/* Offers Section */}
        {offers.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Gift size={16} />
              Available Offers
            </p>
            <div className="space-y-2">
              {offers.map((offer) => {
                const oid = (offer._id || offer.id) as string;
                const applicable = isOfferApplicable(offer);
                const enabled = enabledOffers.includes(oid);

                return (
                  <label
                    key={oid}
                    className={`flex items-start gap-2 p-2 rounded text-xs ${applicable ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-gray-100'} ${enabled ? 'bg-green-50 border border-green-200' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleOffer(oid)}
                      className="mt-1 w-4 h-4"
                      disabled={!applicable}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {offer.title}{' '}
                        <span className="text-green-600">
                          ({offer.discountValue}
                          {offer.discountType === 'percentage' ? '%' : '₹'} off)
                        </span>
                      </p>
                      {offer.description && (
                        <p className="text-gray-600">{offer.description}</p>
                      )}
                    </div>
                    {!applicable && (
                      <div className="ml-2 text-xs text-gray-500">Not applicable</div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2 mb-2">
          <div className="flex justify-between items-center text-gray-700 text-sm">
            <span>Subtotal:</span>
            <span>₹{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-green-600 font-semibold text-sm">
              <span>Discount:</span>
              <span>-₹{formatPrice(discount)}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Date
          </label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value || getTodayDateValue())}
            className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
          />
        </div>

        <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total:</span>
          <span className="text-black">₹{formatPrice(total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClearCart}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition"
        >
          Clear
        </button>
        <button
          onClick={() => {
            onCheckout(customerName, orderDate || getTodayDateValue());
          }}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};
