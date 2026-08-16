import React, { useState, useEffect } from 'react';
import { expenseService, salesService } from '../services/api';
import { AlertCircle, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '../utils/price';

interface ExpenseFormData {
  price: number;
  description: string;
  givenBy: 'sayan' | 'sayak' | 'dipu' | 'pratick' | 'shop_cash';
  date: string;
}

const GIVEN_BY_OPTIONS = [
  { label: 'Sayan', value: 'sayan' as const },
  { label: 'Sayak', value: 'sayak' as const },
  { label: 'Dipu', value: 'dipu' as const },
  { label: 'Pratick', value: 'pratick' as const },
  { label: 'Shop Cash', value: 'shop_cash' as const },
];

const TIMEFRAME_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export const DailyExpenses: React.FC = () => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    price: 0,
    description: '',
    givenBy: 'shop_cash',
    date: new Date().toISOString().split('T')[0], // Default to today
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonTimeframe, setComparisonTimeframe] = useState('today');
  const [orders, setOrders] = useState<any[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
    fetchOrders();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await expenseService.getDailyExpenses();
      setExpenses(response.data || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setComparisonLoading(true);
      const response = await salesService.getSalesHistory();
      setOrders(response.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.price || formData.price <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      setIsSubmitting(true);
      await expenseService.addDailyExpense({
        price: formData.price,
        description: formData.description.trim(),
        givenBy: formData.givenBy,
        date: formData.date,
      });

      setSuccess('Expense added successfully');
      setFormData({
        price: 0,
        description: '',
        givenBy: 'shop_cash',
        date: new Date().toISOString().split('T')[0],
      });

      // Refresh expenses list
      fetchExpenses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.deleteDailyExpense(id);
      setSuccess('Expense deleted successfully');
      fetchExpenses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete expense');
    }
  };

  const getDateRange = (timeframe: string): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
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

  const calculateComparison = () => {
    const { start, end } = getDateRange(comparisonTimeframe);

    // Calculate inflow (total from orders)
    const inflow = orders
      .filter((order) => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate >= start && orderDate <= end;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate outflow (total expenses)
    const outflow = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      })
      .reduce((sum, expense) => sum + (expense.price || 0), 0);

    return { inflow, outflow, net: inflow - outflow };
  };

  const getTodayExpenses = () => {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter((exp) => exp.date === today);
  };

  const getTotalExpenses = () => {
    return getTodayExpenses().reduce((sum, exp) => sum + (exp.price || 0), 0);
  };

  const getExpensesByPerson = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses.filter((exp) => exp.date === today);
    const grouped: Record<string, number> = {};

    todayExpenses.forEach((exp) => {
      grouped[exp.givenBy] = (grouped[exp.givenBy] || 0) + exp.price;
    });

    return grouped;
  };

  const expensesByPerson = getExpensesByPerson();
  const totalExpenses = getTotalExpenses();
  const todayExpenses = getTodayExpenses();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Expenses & Inflow/Outflow</h2>

      {/* Inflow/Outflow Comparison */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {TIMEFRAME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setComparisonTimeframe(option.value)}
              className={`px-3 py-2 rounded font-medium text-sm transition-all ${
                comparisonTimeframe === option.value
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {comparisonLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded h-24 animate-pulse" />
            ))}
          </div>
        ) : (() => {
          const { inflow, outflow, net } = calculateComparison();
          const isPositive = net >= 0;

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Inflow */}
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-green-600" />
                  <p className="text-sm text-gray-600 font-medium">Inflow (Sales)</p>
                </div>
                <p className="text-2xl font-bold text-green-600">₹{formatPrice(inflow)}</p>
              </div>

              {/* Outflow */}
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={18} className="text-red-600" />
                  <p className="text-sm text-gray-600 font-medium">Outflow (Expenses)</p>
                </div>
                <p className="text-2xl font-bold text-red-600">₹{formatPrice(outflow)}</p>
              </div>

              {/* Net */}
              <div className={`rounded p-4 border ${
                isPositive
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <p className={`text-sm font-medium mb-2 ${
                  isPositive ? 'text-gray-600' : 'text-gray-600'
                }`}>Net Amount</p>
                <p className={`text-2xl font-bold ${
                  isPositive ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  ₹{formatPrice(Math.abs(net))}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {isPositive ? '✓ Profit' : '✗ Loss'}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0"
              value={formData.price || ''}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
            />
          </div>

          {/* Given By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expenses Given By <span className="text-red-500">*</span>
            </label>
            <select
              name="givenBy"
              value={formData.givenBy}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
            >
              {GIVEN_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter expense details..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm resize-none"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
          />
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
            <span className="text-sm text-green-800">✓ {success}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          <Plus size={16} />
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </button>
      </form>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm text-gray-600 mb-1">Total Expenses (Today)</p>
          <p className="text-2xl font-bold text-blue-600">₹{formatPrice(totalExpenses)}</p>
        </div>

        {/* Expenses by Person */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <p className="text-sm text-gray-600 mb-2 font-medium">Breakdown by Person</p>
          <div className="space-y-1 text-sm">
            {GIVEN_BY_OPTIONS.map((option) => (
              <div key={option.value} className="flex justify-between">
                <span className="text-gray-700">{option.label}:</span>
                <span className="font-semibold text-gray-900">
                  ₹{formatPrice(expensesByPerson[option.value] || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Today's Expenses</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded h-16 animate-pulse" />
            ))}
          </div>
        ) : todayExpenses.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No expenses recorded today</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {todayExpenses.map((expense, idx) => (
              <div
                key={expense._id || idx}
                className="bg-gray-50 border border-gray-200 rounded p-3 flex items-start justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{expense.description}</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">
                      {GIVEN_BY_OPTIONS.find((opt) => opt.value === expense.givenBy)?.label || expense.givenBy}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(expense.date || new Date()).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                    ₹{formatPrice(expense.price)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(expense._id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete expense"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
