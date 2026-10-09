import api from './client'
import type {
  User, Expense, Budget, Dashboard, PaginatedExpenses,
  Category, ExpenseFilters, AdminInsights,
} from '../types'

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
}

// Expenses
export const expenseApi = {
  list: (filters: Partial<ExpenseFilters>) =>
    api.get<PaginatedExpenses>('/expenses', { params: filters }),
  get: (id: string) => api.get<Expense>(`/expenses/${id}`),
  create: (data: Partial<Expense>) => api.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  dashboard: () => api.get<Dashboard>('/expenses/dashboard'),
}

// Budgets
export const budgetApi = {
  get: (month: string) => api.get<Budget>(`/budgets/${month}`),
  upsert: (month: string, amount: number) => api.put<Budget>(`/budgets/${month}`, { amount }),
  list: () => api.get<Budget[]>('/budgets'),
}

// Categories
export const categoryApi = {
  list: () => api.get<Category[]>('/categories'),
}

// Admin
export const adminApi = {
  insights: () => api.get<AdminInsights>('/admin/insights'),
  createCategory: (name: string) => api.post<Category>('/admin/categories', { name }),
  updateCategory: (id: string, name: string) => api.put<Category>(`/admin/categories/${id}`, { name }),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
}
