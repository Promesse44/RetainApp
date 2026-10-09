import { useEffect, useState } from 'react'
import { budgetApi, expenseApi } from '../../api'
import type { Budget, Dashboard } from '../../types'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-')
  return new Date(+y, +mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const STATUS_BAR: Record<string, string> = {
  within: 'bg-emerald-500',
  approaching: 'bg-amber-400',
  over: 'bg-red-500',
  no_budget: 'bg-zinc-200',
}

const STATUS_TEXT: Record<string, string> = {
  within: 'text-emerald-700',
  approaching: 'text-amber-700',
  over: 'text-red-600',
  no_budget: 'text-zinc-400',
}

const STATUS_LABEL: Record<string, string> = {
  within: 'On track',
  approaching: 'Approaching limit',
  over: 'Over budget',
  no_budget: 'No budget set',
}

export function BudgetPage() {
  const month = currentMonth()

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [history, setHistory] = useState<Budget[]>([])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([expenseApi.dashboard(), budgetApi.list()])
      .then(([d, b]) => {
        setDashboard(d.data)
        setInput(d.data.budgetAmount > 0 ? d.data.budgetAmount.toString() : '')
        setHistory(b.data)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(input)
    if (!amount || amount <= 0) return
    setSaving(true)
    try {
      await budgetApi.upsert(month, amount)
      const [d, b] = await Promise.all([expenseApi.dashboard(), budgetApi.list()])
      setDashboard(d.data)
      setHistory(b.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">Loading…</div>
  )

  const budgetPct = dashboard && dashboard.budgetAmount > 0
    ? Math.min(100, (dashboard.totalSpent / dashboard.budgetAmount) * 100)
    : 0

  const status = dashboard?.budgetStatus ?? 'no_budget'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <h1 style={{ fontFamily: 'Sora, sans-serif' }} className="text-2xl font-bold text-zinc-900">Budget</h1>

      {/* Current month card */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Current month</p>
            <p style={{ fontFamily: 'Sora, sans-serif' }} className="text-lg font-bold text-zinc-900">{monthLabel(month)}</p>
          </div>
          <span className={`text-xs font-semibold ${STATUS_TEXT[status]}`}>{STATUS_LABEL[status]}</span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>${fmt(dashboard?.totalSpent ?? 0)} spent</span>
            <span>{dashboard?.budgetAmount ? `$${fmt(dashboard.budgetAmount)} budget` : 'No budget'}</span>
          </div>
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR[status]}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          {dashboard?.budgetAmount > 0 && (
            <p className="text-xs text-zinc-400 mt-1.5">
              {dashboard.remaining >= 0
                ? `$${fmt(dashboard.remaining)} remaining`
                : `$${fmt(Math.abs(dashboard.remaining))} over budget`}
            </p>
          )}
        </div>

        {/* Set budget form */}
        <form onSubmit={handleSave} className="flex gap-3 pt-1">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Set monthly budget"
              className="w-full pl-7 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !input}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Set budget'}
          </button>
        </form>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-50">
            <h2 className="text-sm font-semibold text-zinc-900">Budget history</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {history.map(b => (
              <div key={b.id ?? b.month} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-700">{monthLabel(b.month)}</span>
                <span className="text-sm font-semibold text-zinc-900">${fmt(b.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
