export type Role = 'USER' | 'ADMIN'

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'OTHER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface Category {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  date: string
  paymentMethod: PaymentMethod
  notes?: string
  categoryId: string
  category: { id: string; name: string }
  userId: string
  createdAt: string
}

export interface Budget {
  id?: string
  month: string
  amount: number
  userId?: string
}

export type BudgetStatus = 'no_budget' | 'within' | 'approaching' | 'over'

export interface Dashboard {
  month: string
  totalSpent: number
  budgetAmount: number
  remaining: number
  budgetStatus: BudgetStatus
  highestExpense: Expense | null
  spendingByCategory: Record<string, number>
  recentExpenses: Expense[]
}

export interface PaginatedExpenses {
  data: Expense[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ExpenseFilters {
  search: string
  categoryId: string
  paymentMethod: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  sortBy: 'date' | 'amount' | 'title' | 'createdAt'
  order: 'asc' | 'desc'
  page: number
  limit: number
}

export interface AdminInsights {
  totalUsers: number
  totalExpenses: number
  totalValue: number
  monthExpensesCount: number
  spendingByCategory: Record<string, number>
  top5Categories: { name: string; count: number }[]
  bottom5Categories: { name: string; count: number }[]
  recentExpenses: Expense[]
  recentUsers: User[]
}
