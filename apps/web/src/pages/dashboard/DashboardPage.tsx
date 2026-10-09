import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { expenseApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { Dashboard } from '../../types'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-')
  return new Date(+y, +mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const STATUS_STYLES: Record<string, string> = {
  within: 'bg-emerald-50 text-emerald-700',
  approaching: 'bg-amber-50 text-amber-700',
  over: 'bg-red-50 text-red-700',
  no_budget: 'bg-zinc-100 text-zinc-500',
}

const STATUS_LABEL: Record<string, string> = {
  within: 'On track',
  approaching: 'Approaching limit',
  over: 'Over budget',
  no_budget: 'No budget set',
}

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    expenseApi.dashboard()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Loading…</div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-500 text-sm">{error}</div>
  )

  if (!data) return null

  const categories = Object.entries(data.spendingByCategory).sort((a, b) => b[1] - a[1])
  const topCatTotal = categories[0]?.[1] || 1

  const budgetPct = data.budgetAmount > 0
    ? Math.min(100, (data.totalSpent / data.budgetAmount) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Sora, sans-serif' }} className="text-2xl font-bold text-zinc-900">
          Good {greeting()}, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{monthLabel(data.month)}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Spent this month" value={`$${fmt(data.totalSpent)}`} />
        <StatCard
          label="Budget"
          value={data.budgetAmount > 0 ? `$${fmt(data.budgetAmount)}` : '—'}
          sub={data.budgetAmount > 0 ? `$${fmt(Math.abs(data.remaining))} ${data.remaining >= 0 ? 'remaining' : 'over'}` : undefined}
        />
        <StatCard
          label="Status"
          value={STATUS_LABEL[data.budgetStatus]}
          badge={STATUS_STYLES[data.budgetStatus]}
        />
      </div>

      {/* Budget bar */}
      {data.budgetAmount > 0 && (
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>${fmt(data.totalSpent)} spent</span>
            <span>${fmt(data.budgetAmount)} budget</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                data.budgetStatus === 'over' ? 'bg-red-500' :
                data.budgetStatus === 'approaching' ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Spending by category */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Spending by category</h2>
          {categories.length === 0 ? (
            <p className="text-zinc-400 text-sm">No expenses this month.</p>
          ) : (
            <div className="space-y-3">
              {categories.map(([name, amount]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-700">{name}</span>
                    <span className="text-zinc-500">${fmt(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(amount / topCatTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Recent expenses</h2>
            <Link to="/expenses" className="text-xs text-emerald-600 hover:underline font-medium">View all</Link>
          </div>
          {data.recentExpenses.length === 0 ? (
            <p className="text-zinc-400 text-sm">No expenses yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentExpenses.map(e => (
                <div key={e.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-800 truncate">{e.title}</p>
                    <p className="text-xs text-zinc-400">{e.category.name} · {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-medium text-zinc-900 ml-4 shrink-0">${fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Highest expense */}
      {data.highestExpense && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Highest expense this month</p>
            <p className="text-sm font-semibold text-zinc-900">{data.highestExpense.title}</p>
            <p className="text-xs text-zinc-400">{data.highestExpense.category.name} · {new Date(data.highestExpense.date).toLocaleDateString()}</p>
          </div>
          <span className="text-xl font-bold text-zinc-900">${fmt(data.highestExpense.amount)}</span>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, badge }: { label: string; value: string; sub?: string; badge?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {badge ? (
        <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-semibold ${badge}`}>{value}</span>
      ) : (
        <p style={{ fontFamily: 'Sora, sans-serif' }} className="text-2xl font-bold text-zinc-900">{value}</p>
      )}
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
