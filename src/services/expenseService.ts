/**
 * Expense Tracking Service
 * Frontend API wrapper for Phase 2.0 Week 1 backend endpoints
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface Expense {
  _id: string;
  planId: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // ISO date string
  description: string;
  notes?: string;
  activityId?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  deletedAt?: string | null;
  formattedAmount?: string;
  categoryLabel?: {
    en: string;
    ta: string;
  };
}

export type ExpenseCategory =
  | 'seeds'
  | 'fertilizers'
  | 'pesticides'
  | 'labour'
  | 'equipment'
  | 'irrigation'
  | 'other';

export interface CategoryBreakdown {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
}

export interface BudgetStatus {
  planId: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  categoryBreakdown: CategoryBreakdown[];
  alertLevel: 'ok' | 'warning' | 'danger';
}

export interface CreateExpenseRequest {
  planId: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // ISO date string
  description: string;
  notes?: string;
  activityId?: string;
}

export interface UpdateExpenseRequest {
  category?: ExpenseCategory;
  amount?: number;
  date?: string;
  description?: string;
  notes?: string;
}

export interface GetExpensesParams {
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export interface GetExpensesResponse {
  expenses: Expense[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Category Metadata
// ============================================================================

export const EXPENSE_CATEGORIES: Record<
  ExpenseCategory,
  {
    icon: string;
    labelEn: string;
    labelTa: string;
    color: string;
  }
> = {
  seeds: {
    icon: '🌱',
    labelEn: 'Seeds',
    labelTa: 'விதைகள்',
    color: '#10b981',
  },
  fertilizers: {
    icon: '🧪',
    labelEn: 'Fertilizers',
    labelTa: 'உரங்கள்',
    color: '#f59e0b',
  },
  pesticides: {
    icon: '🛡️',
    labelEn: 'Pesticides',
    labelTa: 'பூச்சிக்கொல்லி',
    color: '#ef4444',
  },
  labour: {
    icon: '👨‍🌾',
    labelEn: 'Labour',
    labelTa: 'கூலி',
    color: '#3b82f6',
  },
  equipment: {
    icon: '🚜',
    labelEn: 'Equipment',
    labelTa: 'கருவிகள்',
    color: '#8b5cf6',
  },
  irrigation: {
    icon: '💧',
    labelEn: 'Irrigation',
    labelTa: 'நீர்ப்பாசனம்',
    color: '#06b6d4',
  },
  other: {
    icon: '📦',
    labelEn: 'Other',
    labelTa: 'மற்றவை',
    color: '#6b7280',
  },
};

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Create a new expense
 */
export const createExpense = async (
  data: CreateExpenseRequest
): Promise<Expense> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/api/expenses`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.expense;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to create expense / செலவைச் சேர்க்க முடியவில்லை');
  }
};

/**
 * Get expenses for a farming plan with filters
 */
export const getExpenses = async (
  planId: string,
  params?: GetExpensesParams
): Promise<GetExpensesResponse> => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();

    if (params?.category) queryParams.append('category', params.category);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());

    const url = `${API_BASE_URL}/api/expenses/plan/${planId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch expenses / செலவுகளைப் பெற முடியவில்லை');
  }
};

/**
 * Get budget status for a farming plan
 */
export const getBudgetStatus = async (
  planId: string
): Promise<BudgetStatus> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/api/expenses/budget-status/${planId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.budgetStatus;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(
      'Failed to fetch budget status / பட்ஜெட் நிலையைப் பெற முடியவில்லை'
    );
  }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (
  expenseId: string,
  data: UpdateExpenseRequest
): Promise<Expense> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_BASE_URL}/api/expenses/${expenseId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.expense;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(
      'Failed to update expense / செலவைப் புதுப்பிக்க முடியவில்லை'
    );
  }
};

/**
 * Delete an expense (soft delete)
 */
export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE_URL}/api/expenses/${expenseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to delete expense / செலவை நீக்க முடியவில்லை');
  }
};

/**
 * Get CSV export URL for expenses
 */
export const getExportExpensesURL = (planId: string): string => {
  const token = localStorage.getItem('token');
  return `${API_BASE_URL}/api/expenses/export/${planId}?token=${token}`;
};

/**
 * Format amount as Indian currency
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Get category label in current language
 */
export const getCategoryLabel = (
  category: ExpenseCategory,
  language: 'en' | 'ta'
): string => {
  return EXPENSE_CATEGORIES[category][language === 'ta' ? 'labelTa' : 'labelEn'];
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES[category].icon;
};

/**
 * Get category color
 */
export const getCategoryColor = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES[category].color;
};
