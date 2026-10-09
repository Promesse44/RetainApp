import { useEffect, useState, useCallback } from 'react'
import { expenseApi, categoryApi } from '../../api'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  setSearch, setCategoryId, setPaymentMethod,
  setDateFrom, setDateTo, setSortBy, setOrder,
  setPage, resetFilters,
} from '../../store/slices/filtersSlice'
import type { Expense, Category, PaymentMethod } from '../../types'

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'OTHER']
const PM_LABEL: Record<string, string> = {
  CASH: 'Cash', CREDIT_CARD: 'Credit Card', DEBIT_CARD: 'Debit Card',
  MOBILE_MONEY: 'Mobile Money', BANK_TRANSFER: 'Bank Transfer', OTHER: 'Other',
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  expense?: Expense | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}

function ExpenseModal({ expense, categories, onClose, onSaved }: ModalProps) {
  const [title, setTitle] = useState(expense?.title ?? '')
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '')
  const [date, setDate] = useState(expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [categoryId, setCat] = useState(expense?.categoryId ?? categories[0]?.id ?? '')
  const [paymentMethod, setPm] = useState<PaymentMethod>(expense?.paymentMethod ?? 'CASH')
  const [notes, setNotes] = useState(expense?.notes ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { title, amount: parseFloat(amount), date, categoryId, paymentMethod, notes: notes || undefined }
      if (expense) await expenseApi.update(expense.id, payload)
      else await expenseApi.create(payload)
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'Sora, sans-serif' }} className="text-lg font-bold text-zinc-900 mb-5">
          {expense ? 'Edit expense' : 'Add expense'}
        </h2>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Amount</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Category</label>
            <select value={categoryId} onChange={e => setCat(e.target.value)} required
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Payment method</label>
            <select value={paymentMethod} onChange={e => setPm(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              {PAYMENT_METHODS.map(p => <option key={p} value={p}>{PM_LABEL[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Notes <span className="text-zinc-400">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function ExpensesPage() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(s => s.filters)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await expenseApi.list(filters)
      setExpenses(res.data.data)
      setMeta(res.data.meta)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])
  useEffect(() => { categoryApi.list().then(r => setCategories(r.data)) }, [])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await expenseApi.delete(deleting.id)
      setDeleting(null)
      load()
    } finally {
      setDeleteLoading(false)
    }
  }

  const hasFilters = filters.search || filters.categoryId || filters.paymentMethod || filters.dateFrom || filters.dateTo

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'Sora, sans-serif' }} className="text-2xl font-bold text-zinc-900">Expenses</h1>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition cursor-pointer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            value={filters.search}
            onChange={e => dispatch(setSearch(e.target.value))}
            placeholder="Search…"
            className="flex-1 min-w-[160px] px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select value={filters.categoryId} onChange={e => dispatch(setCategoryId(e.target.value))}
            className="px-3 py-2 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.paymentMethod} onChange={e => dispatch(setPaymentMethod(e.target.value))}
            className="px-3 py-2 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All methods</option>
            {PAYMENT_METHODS.map(p => <option key={p} value={p}>{PM_LABEL[p]}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => dispatch(setDateFrom(e.target.value))}
            className="px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="date" value={filters.dateTo} onChange={e => dispatch(setDateTo(e.target.value))}
            className="px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Sort by</span>
            <select value={filters.sortBy} onChange={e => dispatch(setSortBy(e.target.value as any))}
              className="px-2 py-1 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none">
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="title">Title</option>
            </select>
            <button onClick={() => dispatch(setOrder(filters.order === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50 transition cursor-pointer">
              {filters.order === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
          {hasFilters && (
            <button onClick={() => dispatch(resetFilters())}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition cursor-pointer">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-400 text-sm gap-2">
            <span>No expenses found.</span>
            {hasFilters && <button onClick={() => dispatch(resetFilters())} className="text-emerald-600 text-xs hover:underline cursor-pointer">Clear filters</button>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 hidden sm:table-cell">Method</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 hidden md:table-cell">Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-zinc-50 transition">
                  <td className="px-5 py-3 text-zinc-800 font-medium">
                    {e.title}
                    {e.notes && <p className="text-xs text-zinc-400 font-normal truncate max-w-[180px]">{e.notes}</p>}
                  </td>
                  <td className="px-5 py-3 text-zinc-500">{e.category.name}</td>
                  <td className="px-5 py-3 text-zinc-500 hidden sm:table-cell">{PM_LABEL[e.paymentMethod]}</td>
                  <td className="px-5 py-3 text-zinc-500 hidden md:table-cell">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right font-semibold text-zinc-900">${fmt(e.amount)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditing(e); setModalOpen(true) }}
                        className="text-zinc-400 hover:text-zinc-700 transition cursor-pointer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleting(e)}
                        className="text-zinc-400 hover:text-red-500 transition cursor-pointer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                          <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" />
                          <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                          <path d="M9 6V4h6v2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400 text-xs">{meta.total} expenses · page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={meta.page <= 1} onClick={() => dispatch(setPage(meta.page - 1))}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer">
              Previous
            </button>
            <button disabled={meta.page >= meta.totalPages} onClick={() => dispatch(setPage(meta.page + 1))}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <ExpenseModal
          expense={editing}
          categories={categories}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => { setModalOpen(false); setEditing(null); load() }}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Sora, sans-serif' }} className="text-lg font-bold text-zinc-900 mb-2">Delete expense?</h2>
            <p className="text-sm text-zinc-500 mb-6">
              "<span className="text-zinc-700 font-medium">{deleting.title}</span>" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 cursor-pointer">
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
