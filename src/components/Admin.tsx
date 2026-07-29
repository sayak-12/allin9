import React, { useState, useEffect } from 'react';
import type { MenuItem, Offer, InventoryItem, RawMaterialItem } from '../types';
import { menuService, offerService, salesService, inventoryService, rawMaterialService } from '../services/api';
import { Edit2, Trash2, Package, Boxes, ClipboardCheck, XCircle } from 'lucide-react';
import { normalizePrice, formatPrice } from '../utils/price';

interface AdminProps {
  currentMenu: MenuItem[];
  onMenuUpdated: () => void;
}

export const Admin: React.FC<AdminProps> = ({ currentMenu, onMenuUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    inventoryQuantity: '',
    inventoryMinStockLevel: '',
    inventoryUnit: 'pcs',
    inventoryIsUnlimited: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBackendId, setEditingBackendId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    price: '',
    description: '',
    inventoryQuantity: '',
    inventoryMinStockLevel: '',
    inventoryUnit: 'pcs',
    inventoryIsUnlimited: false,
  });
  const [activeTab, setActiveTab] = useState<'menu' | 'offers' | 'stock'>('menu');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '',
    startDate: '',
    endDate: '',
    itemIds: [] as string[],
  });
  const [offersLoading, setOffersLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialItem[]>([]);
  const [rawMaterialForm, setRawMaterialForm] = useState({
    name: '',
    quantity: '',
    unit: 'Packets',
    category: '',
    notes: '',
    status: 'in_stock',
  });
  const [rawMaterialLoading, setRawMaterialLoading] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<Record<string, string>>({});
  const [rawMaterialAdjustment, setRawMaterialAdjustment] = useState<Record<string, string>>({});

  const sanitizeNumericInput = (value: string) => value.replace(/[^0-9.-]/g, '').replace(/(\..*)\./g, '$1');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const nextValue = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : name === 'price' || name === 'inventoryQuantity' || name === 'inventoryMinStockLevel'
        ? sanitizeNumericInput(value)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        price: normalizePrice(formData.price),
        description: formData.description || undefined,
        inventoryQuantity: formData.inventoryQuantity ? parseFloat(formData.inventoryQuantity) : undefined,
        inventoryMinStockLevel: formData.inventoryMinStockLevel ? parseFloat(formData.inventoryMinStockLevel) : undefined,
        inventoryUnit: formData.inventoryUnit || 'pcs',
        inventoryIsUnlimited: formData.inventoryIsUnlimited,
      };

      await menuService.addToMenu(payload);
      setFormData({ name: '', price: '', description: '', inventoryQuantity: '', inventoryMinStockLevel: '', inventoryUnit: 'pcs', inventoryIsUnlimited: false });
      setSuccess('Item added to menu successfully!');
      onMenuUpdated();

      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (item: MenuItem) => {
    setEditingId(item.id);
    setEditingBackendId(item._id || item.id);
    setEditData({
      name: item.name,
      price: item.price.toString(),
      description: item.description || '',
      inventoryQuantity: item.inventoryQuantity?.toString() ?? '',
      inventoryMinStockLevel: item.inventoryMinStockLevel?.toString() ?? '',
      inventoryUnit: item.inventoryUnit || 'pcs',
      inventoryIsUnlimited: item.inventoryIsUnlimited ?? false,
    });
  };

  const handleEditChange = (field: string, value: string | boolean) => {
    const nextValue = field === 'price'
      ? sanitizeNumericInput(String(value))
      : value;

    setEditData((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const handleEditSave = async (id: string) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Use backend ID for the update request
      const backendId = editingBackendId || id;
      const payload = {
        name: editData.name,
        price: normalizePrice(editData.price),
        description: editData.description || undefined,
        inventoryQuantity: editData.inventoryQuantity ? parseFloat(editData.inventoryQuantity) : undefined,
        inventoryMinStockLevel: editData.inventoryMinStockLevel ? parseFloat(editData.inventoryMinStockLevel) : undefined,
        inventoryUnit: editData.inventoryUnit || 'pcs',
        inventoryIsUnlimited: editData.inventoryIsUnlimited,
      };
      await menuService.updateMenuItem(backendId, payload);
      setSuccess('Item updated successfully!');
      setEditingId(null);
      setEditingBackendId(null);
      onMenuUpdated();

      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingBackendId(null);
    setEditData({ name: '', price: '', description: '', inventoryQuantity: '', inventoryMinStockLevel: '', inventoryUnit: 'pcs', inventoryIsUnlimited: false });
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use backend ID for the delete request
      const backendId = item._id || item.id;
      await menuService.deleteMenuItem(backendId);
      setSuccess('Item deleted successfully!');
      onMenuUpdated();

      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch offers on mount
  useEffect(() => {
    fetchOffers();
    fetchInventory();
    fetchRawMaterials();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await offerService.getAllOffers();
      setOffers(response.data || []);
    } catch {
      console.error('Failed to fetch offers');
    }
  };

  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const response = await inventoryService.getInventoryItems();
      setInventoryItems(response.data || []);
    } catch {
      console.error('Failed to fetch inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await rawMaterialService.getRawMaterials();
      setRawMaterials(response.data || []);
    } catch {
      console.error('Failed to fetch raw materials');
    }
  };

  const handleInventoryAdjust = async (id: string) => {
    const adjustment = Number(stockAdjustment[id] || 0);
    if (!adjustment) return;

    try {
      await inventoryService.adjustStock(id, adjustment);
      setSuccess('Inventory updated successfully!');
      setStockAdjustment((prev) => ({ ...prev, [id]: '' }));
      fetchInventory();
    } catch {
      setError('Failed to update inventory.');
    }
  };

  const handleRawMaterialAdjust = async (id: string) => {
    const adjustment = Number(rawMaterialAdjustment[id] || 0);
    if (!adjustment) return;

    try {
      const material = rawMaterials.find((item) => (item._id || item.id) === id);
      const currentQty = Number(material?.quantity || 0);
      const nextQty = currentQty + adjustment;
      await rawMaterialService.updateRawMaterial(id, { quantity: nextQty.toString() });
      setSuccess('Raw material stock updated successfully!');
      setRawMaterialAdjustment((prev) => ({ ...prev, [id]: '' }));
      fetchRawMaterials();
    } catch {
      setError('Failed to update raw material stock.');
    }
  };

  const handleRawMaterialCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRawMaterialLoading(true);

    try {
      await rawMaterialService.createRawMaterial(rawMaterialForm);
      setRawMaterialForm({ name: '', quantity: '', unit: 'Packets', category: '', notes: '', status: 'in_stock' });
      setSuccess('Raw material added successfully!');
      fetchRawMaterials();
    } catch {
      setError('Failed to add raw material.');
    } finally {
      setRawMaterialLoading(false);
    }
  };

  const handleOrderStatusChange = async (id: string, status: 'served' | 'cancelled') => {
    try {
      await salesService.updateOrderStatus(id, status);
      setSuccess(`Order marked as ${status}.`);
      onMenuUpdated();
    } catch {
      setError('Failed to update order status.');
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setOffersLoading(true);

    try {
      const payload = {
        title: offerForm.title,
        description: offerForm.description,
        discountType: offerForm.discountType,
        discountValue: parseFloat(offerForm.discountValue),
        minOrderAmount: offerForm.minOrderAmount ? parseFloat(offerForm.minOrderAmount) : undefined,
        startDate: offerForm.startDate,
        endDate: offerForm.endDate,
        itemIds: offerForm.itemIds.length > 0 ? offerForm.itemIds : undefined,
      };

      await offerService.createOffer(payload);
      setOfferForm({
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        startDate: '',
        endDate: '',
        itemIds: [],
      });
      setSuccess('Offer created successfully!');
      fetchOffers();

      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to create offer. Please try again.');
    } finally {
      setOffersLoading(false);
    }
  };

  const handleDeleteOffer = async (id: string | undefined) => {
    if (!id || !window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    setError('');
    setSuccess('');
    setOffersLoading(true);

    try {
      await offerService.deleteOffer(id);
      setSuccess('Offer deleted successfully!');
      fetchOffers();

      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete offer. Please try again.');
    } finally {
      setOffersLoading(false);
    }
  };

  return (
    <div className="max-w-6xl">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded text-sm border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded text-sm border border-green-200">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-6 bg-white border border-gray-200 rounded overflow-hidden">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-3 font-medium text-sm transition-all ${
            activeTab === 'menu'
              ? 'bg-black text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-r border-gray-200'
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex-1 py-3 font-medium text-sm transition-all ${
            activeTab === 'offers'
              ? 'bg-black text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-r border-gray-200'
          }`}
        >
          Manage Offers
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-3 font-medium text-sm transition-all ${
            activeTab === 'stock'
              ? 'bg-black text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Stock & Orders
        </button>
      </div>

      {/* Menu Tab */}
      {activeTab === 'menu' && (
        <>
          <div className="bg-white border border-gray-200 rounded p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-6">Add Menu Item</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Butter Chicken"
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 250"
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Spiced chicken in creamy tomato sauce"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventory Quantity
                  </label>
                  <input
                    type="number"
                    name="inventoryQuantity"
                    value={formData.inventoryQuantity}
                    onChange={handleInputChange}
                    placeholder="e.g., 30"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    name="inventoryMinStockLevel"
                    value={formData.inventoryMinStockLevel}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="inventoryUnit"
                    value={formData.inventoryUnit}
                    onChange={handleInputChange}
                    placeholder="pcs"
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 rounded border border-gray-200 p-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="inventoryIsUnlimited"
                    checked={formData.inventoryIsUnlimited}
                    onChange={handleInputChange}
                  />
                  Mark as unlimited stock
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Item...' : 'Add Item to Menu'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Current Menu Items</h3>
            {currentMenu.length === 0 ? (
              <p className="text-gray-500">No items in menu yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentMenu.map((item) => (
                  <div key={item.id} className="bg-yellow-50 p-4 rounded border border-yellow-100">
                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editData.price}
                            onChange={(e) => handleEditChange('price', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={editData.description}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Inventory Quantity
                            </label>
                            <input
                              type="number"
                              value={editData.inventoryQuantity}
                              onChange={(e) => handleEditChange('inventoryQuantity', e.target.value)}
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Min Stock Level
                            </label>
                            <input
                              type="number"
                              value={editData.inventoryMinStockLevel}
                              onChange={(e) => handleEditChange('inventoryMinStockLevel', e.target.value)}
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={editData.inventoryUnit}
                              onChange={(e) => handleEditChange('inventoryUnit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <label className="flex items-center gap-2 rounded border border-gray-200 p-3 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={editData.inventoryIsUnlimited}
                              onChange={(e) => handleEditChange('inventoryIsUnlimited', e.target.checked)}
                            />
                            Unlimited stock
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(item.id)}
                            disabled={loading}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleEditCancel}
                            disabled={loading}
                            className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <p className="font-bold text-red-600 text-lg">₹{formatPrice(item.price)}</p>
                          {item.inventoryEnabled ? (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-semibold">Stock:</span>{' '}
                              {item.inventoryIsUnlimited ? 'Unlimited' : `${item.inventoryQuantity ?? 0} ${item.inventoryUnit || 'pcs'}`}
                              {item.inventoryStatus && ` • ${item.inventoryStatus.replace('_', ' ')}`}
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-gray-500">Inventory disabled</div>
                          )}
                        </div>
                        <div className="flex flex-col items-center">
                          
                          <button
                            onClick={() => handleEditStart(item)}
                            className="p-2 text-gray-800 hover:bg-yellow-100 rounded transition"
                            title="Edit item"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={loading}
                            className="p-2 text-gray-800 hover:bg-red-200 rounded-lg transition disabled:opacity-50"
                            title="Delete item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Stock & Orders Tab */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">Order Status</h2>
            <p className="text-sm text-gray-600 mb-4">Mark orders as served or cancelled to update stock automatically.</p>
            <div className="space-y-3">
              {currentMenu.length === 0 ? (
                <p className="text-sm text-gray-500">No recent orders available in this view yet.</p>
              ) : (
                <div className="text-sm text-gray-500">Use the order history screen to update order status from the backend when available.</div>
              )}
            </div>
          </div> */}

          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">Inventory Adjustments</h2>
            {inventoryLoading ? (
              <p className="text-sm text-gray-500">Loading inventory...</p>
            ) : inventoryItems.length === 0 ? (
              <p className="text-sm text-gray-500">No inventory items available yet.</p>
            ) : (
              <div className="space-y-3">
                {inventoryItems.map((item) => {
                  const id = item._id || item.id || '';
                  return (
                    <div key={id} className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 rounded p-3">
                      <div>
                        <p className="font-semibold text-gray-900">{item.itemName}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} {item.unit || 'pcs'} • Status: {item.status || 'in_stock'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={stockAdjustment[id] ?? ''}
                          onChange={(e) => setStockAdjustment((prev) => ({ ...prev, [id]: e.target.value }))}
                          placeholder="± amount"
                          className="w-24 px-3 py-2 border border-gray-200 rounded text-sm"
                        />
                        <button
                          onClick={() => handleInventoryAdjust(id)}
                          className="px-3 py-2 bg-black text-white rounded text-sm"
                        >
                          Adjust
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-4">Raw Material Stock</h2>
            <form onSubmit={handleRawMaterialCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={rawMaterialForm.name}
                onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, name: e.target.value })}
                placeholder="Material name"
                className="px-3 py-2 border border-gray-200 rounded"
                required
              />
              <input
                type="text"
                value={rawMaterialForm.quantity}
                onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, quantity: e.target.value })}
                placeholder="Quantity"
                className="px-3 py-2 border border-gray-200 rounded"
                required
              />
              <input
                type="text"
                value={rawMaterialForm.unit}
                onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, unit: e.target.value })}
                placeholder="Unit"
                className="px-3 py-2 border border-gray-200 rounded"
              />
              <input
                type="text"
                value={rawMaterialForm.category}
                onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, category: e.target.value })}
                placeholder="Category"
                className="px-3 py-2 border border-gray-200 rounded"
              />
              <input
                type="text"
                value={rawMaterialForm.notes}
                onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, notes: e.target.value })}
                placeholder="Notes"
                className="px-3 py-2 border border-gray-200 rounded"
              />
              <select
                value={rawMaterialForm.status}
                onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, status: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded"
              >
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
              <button type="submit" disabled={rawMaterialLoading} className="md:col-span-2 px-3 py-2 bg-black text-white rounded">
                {rawMaterialLoading ? 'Adding...' : 'Add Raw Material'}
              </button>
            </form>

            <div className="space-y-3">
              {rawMaterials.length === 0 ? (
                <p className="text-sm text-gray-500">No raw materials added yet.</p>
              ) : (
                rawMaterials.map((item) => {
                  const id = item._id || item.id || '';
                  return (
                    <div key={id} className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 rounded p-3">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} {item.unit || ''} • {item.category || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={rawMaterialAdjustment[id] ?? ''}
                          onChange={(e) => setRawMaterialAdjustment((prev) => ({ ...prev, [id]: e.target.value }))}
                          placeholder="± amount"
                          className="w-24 px-3 py-2 border border-gray-200 rounded text-sm"
                        />
                        <button
                          onClick={() => handleRawMaterialAdjust(id)}
                          className="px-3 py-2 bg-black text-white rounded text-sm"
                        >
                          Adjust
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-red-600 mb-6">Create Offer</h2>

            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Title *
                  </label>
                  <input
                    type="text"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                    placeholder="e.g., Weekend Special"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type *
                  </label>
                  <select
                    value={offerForm.discountType}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        discountType: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={offerForm.discountValue}
                    onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value })}
                    placeholder={offerForm.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Order Amount (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    value={offerForm.minOrderAmount}
                    onChange={(e) => setOfferForm({ ...offerForm, minOrderAmount: e.target.value })}
                    placeholder="e.g., 500"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={offerForm.startDate}
                    onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={offerForm.endDate}
                    onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="e.g., Buy 2 burgers, get 20% off"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Items (Optional - leave empty for all items)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Select which menu items this offer applies to. Leave blank to apply to entire menu.
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {currentMenu.map((item) => (
                    <label key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offerForm.itemIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOfferForm({
                              ...offerForm,
                              itemIds: [...offerForm.itemIds, item.id],
                            });
                          } else {
                            setOfferForm({
                              ...offerForm,
                              itemIds: offerForm.itemIds.filter((id) => id !== item.id),
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={offersLoading}
                className="w-full bg-black text-white py-2 rounded font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {offersLoading ? 'Creating...' : 'Create Offer'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">Active Offers</h3>
            {offers.length === 0 ? (
              <p className="text-gray-500">No offers created yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {offers.map((offer) => (
                  <div key={offer._id} className="bg-yellow-50 p-4 rounded border border-yellow-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-800">{offer.title}</p>
                        <p className="text-sm text-gray-600">{offer.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteOffer(offer._id || offer.id)}
                        disabled={offersLoading}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                        title="Delete offer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600 font-semibold">Discount</p>
                        <p className="text-red-600 font-bold">
                          {offer.discountValue}
                          {offer.discountType === 'percentage' ? '%' : '₹'}
                        </p>
                      </div>
                      {offer.minOrderAmount && (
                        <div>
                          <p className="text-gray-600 font-semibold">Min Amount</p>
                          <p className="text-gray-700">₹{offer.minOrderAmount}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600 font-semibold">Valid</p>
                        <p className="text-gray-700">
                          {new Date(offer.startDate).toLocaleDateString('en-IN')} to{' '}
                          {new Date(offer.endDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      {offer.itemIds && offer.itemIds.length > 0 && (
                        <div>
                          <p className="text-gray-600 font-semibold">Items</p>
                          <p className="text-gray-700">{offer.itemIds.length} item(s)</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
