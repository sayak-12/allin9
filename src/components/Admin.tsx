import React, { useState, useEffect } from 'react';
import type { MenuItem, Offer } from '../types';
import { menuService, offerService } from '../services/api';
import { Edit2, Trash2 } from 'lucide-react';

interface AdminProps {
  currentMenu: MenuItem[];
  onMenuUpdated: () => void;
}

export const Admin: React.FC<AdminProps> = ({ currentMenu, onMenuUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
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
  });
  const [activeTab, setActiveTab] = useState<'menu' | 'offers'>('menu');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        price: parseFloat(formData.price),
        description: formData.description || undefined,
      };

      await menuService.addToMenu(payload);
      setFormData({ name: '', price: '', description: '' });
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
    });
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
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
        price: parseFloat(editData.price),
        description: editData.description || undefined,
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
    setEditData({ name: '', price: '', description: '' });
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
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await offerService.getAllOffers();
      setOffers(response.data || []);
    } catch {
      console.error('Failed to fetch offers');
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
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Manage Offers
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
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 250"
                  step="0.01"
                  min="0"
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
                  <div key={item.id} className="bg-purple-50 p-4 rounded-lg">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            value={editData.price}
                            onChange={(e) => handleEditChange('price', e.target.value)}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                          />
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
                          <p className="font-bold text-purple-700 text-lg">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          
                          <button
                            onClick={() => handleEditStart(item)}
                            className="p-2 text-gray-800 hover:bg-purple-200 rounded-lg transition"
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

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">Create Offer</h2>

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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
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
                className="w-full bg-linear-to-r from-purple-600 to-purple-700 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {offersLoading ? 'Creating...' : 'Create Offer'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-purple-700 mb-4">Active Offers</h3>
            {offers.length === 0 ? (
              <p className="text-gray-500">No offers created yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {offers.map((offer) => (
                  <div key={offer._id} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-purple-200">
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
                        <p className="text-purple-700 font-bold">
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
