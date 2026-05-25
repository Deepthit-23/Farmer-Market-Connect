import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

const API_BASE = '/api'

const RANGE_OPTIONS = ['30d', '90d', '1y']
const VIEW_OPTIONS = ['weekly', 'monthly']

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

const numberFormat = new Intl.NumberFormat('en-US')

const formatMoney = (value) => currency.format(Number(value || 0))
const formatCount = (value) => numberFormat.format(Number(value || 0))

const normalizeIncomeSeries = (items, labelKey) => items.map((item) => ({
  label: item[labelKey],
  total: Number(item.total || 0),
  order_count: Number(item.order_count || 0)
}))

export default function FarmerTrendsDashboard({ token }) {
  const { t } = useTranslation()
  const [rangeKey, setRangeKey] = useState('30d')
  const [viewMode, setViewMode] = useState('weekly')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [income, setIncome] = useState({ weekly: [], monthly: [] })
  const [products, setProducts] = useState({ top_by_qty: [], top_by_revenue: [], low_stock: [] })
  const [buyers, setBuyers] = useState({ monthly: [] })

  useEffect(() => {
    if (!token) return

    let cancelled = false
    const controller = new AbortController()

    const fetchTrends = async () => {
      setLoading(true)
      setError('')
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [incomeRes, productsRes, buyersRes] = await Promise.all([
          fetch(`${API_BASE}/farmer/trends/income?range=${rangeKey}`, { headers, signal: controller.signal }),
          fetch(`${API_BASE}/farmer/trends/products?range=${rangeKey}`, { headers, signal: controller.signal }),
          fetch(`${API_BASE}/farmer/trends/buyers?range=${rangeKey}`, { headers, signal: controller.signal })
        ])

        const [incomeData, productData, buyerData] = await Promise.all([
          incomeRes.json(),
          productsRes.json(),
          buyersRes.json()
        ])

        if (cancelled) return

        if (!incomeRes.ok) throw new Error(incomeData.detail || t('farmerDashboard.errors.loadFailed'))
        if (!productsRes.ok) throw new Error(productData.detail || t('farmerDashboard.errors.loadFailed'))
        if (!buyersRes.ok) throw new Error(buyerData.detail || t('farmerDashboard.errors.loadFailed'))

        setIncome(incomeData)
        setProducts(productData)
        setBuyers(buyerData)
      } catch (err) {
        if (err.name !== 'AbortError' && !cancelled) {
          setError(err.message || t('farmerDashboard.errors.loadFailed'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTrends()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [token, rangeKey, t])

  const incomeSeries = useMemo(() => {
    const source = viewMode === 'weekly' ? income.weekly : income.monthly
    const labelKey = viewMode === 'weekly' ? 'week_label' : 'month_label'
    return normalizeIncomeSeries(source, labelKey)
  }, [income, viewMode])

  const topProducts = useMemo(
    () => products.top_by_revenue.map((item) => ({
      label: item.name,
      total_revenue: Number(item.total_revenue || 0),
      total_quantity: Number(item.total_quantity || 0)
    })),
    [products.top_by_revenue]
  )

  const retentionSeries = useMemo(
    () => buyers.monthly.map((item) => ({
      month: item.month,
      repeat_buyers: Number(item.repeat_buyers || 0),
      new_buyers: Number(item.new_buyers || 0)
    })),
    [buyers.monthly]
  )

  const totalRevenue = useMemo(
    () => incomeSeries.reduce((sum, item) => sum + item.total, 0),
    [incomeSeries]
  )

  const totalOrders = useMemo(
    () => incomeSeries.reduce((sum, item) => sum + item.order_count, 0),
    [incomeSeries]
  )

  const lowStockItems = products.low_stock

  const tooltipStyle = {
    background: '#101A15',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    color: 'var(--color-text-primary)'
  }

  return (
    <div className="farmer-trends-dashboard">
      <div className="organic-card dashboard-hero-card">
        <div className="dashboard-header-row">
          <div>
            <div className="dashboard-kicker">{t('farmerDashboard.kicker')}</div>
            <h2 className="dashboard-title">{t('farmerDashboard.title')}</h2>
            <p className="dashboard-subtitle">{t('farmerDashboard.subtitle')}</p>
          </div>

          <div className="dashboard-controls">
            <label className="dashboard-control">
              <span>{t('farmerDashboard.range.label')}</span>
              <select className="form-control dashboard-select" value={rangeKey} onChange={(e) => setRangeKey(e.target.value)}>
                <option value="30d">{t('farmerDashboard.range.last30d')}</option>
                <option value="90d">{t('farmerDashboard.range.last90d')}</option>
                <option value="1y">{t('farmerDashboard.range.last1y')}</option>
              </select>
            </label>

            <div className="dashboard-toggle-group" role="tablist" aria-label={t('farmerDashboard.income.title')}>
              {VIEW_OPTIONS.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`dashboard-toggle ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {t(`farmerDashboard.view.${mode}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-metric-grid">
          <div className="stat-card dashboard-metric-card">
            <div className="stat-icon-wrapper" style={{ background: '#1B2E24', color: 'var(--color-forest)' }}>💰</div>
            <div>
              <div className="stat-label">{t('farmerDashboard.metrics.totalIncome')}</div>
              <div className="stat-value">{formatMoney(totalRevenue)}</div>
            </div>
          </div>
          <div className="stat-card dashboard-metric-card">
            <div className="stat-icon-wrapper" style={{ background: '#0D47A1', color: '#90CAF9' }}>📦</div>
            <div>
              <div className="stat-label">{t('farmerDashboard.metrics.orders')}</div>
              <div className="stat-value">{formatCount(totalOrders)}</div>
            </div>
          </div>
          <div className="stat-card dashboard-metric-card">
            <div className="stat-icon-wrapper" style={{ background: '#3E2723', color: '#FFB74D' }}>⚠️</div>
            <div>
              <div className="stat-label">{t('farmerDashboard.metrics.lowStock')}</div>
              <div className="stat-value">{formatCount(lowStockItems.length)}</div>
            </div>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="dashboard-alert-banner">
          <div>
            <strong>{t('farmerDashboard.alerts.lowStockTitle')}</strong>
            <p>{t('farmerDashboard.alerts.lowStockBody')}</p>
          </div>
          <div className="dashboard-low-stock-list">
            {lowStockItems.map((item) => (
              <span key={item.product_id} className="dashboard-low-stock-pill">
                {item.name} · {item.stock_quantity}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <div className="dashboard-alert-banner dashboard-error-banner">{error}</div>}

      <div className="dashboard-grid">
        <section className="organic-card dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <h3>{t('farmerDashboard.income.title')}</h3>
              <p>{t('farmerDashboard.income.subtitle')}</p>
            </div>
          </div>
          <div className="dashboard-chart-wrap">
            {loading ? (
              <div className="dashboard-loading">{t('farmerDashboard.loading')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={incomeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,154,0.15)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [name === 'total' ? formatMoney(value) : formatCount(value), name]}
                    labelFormatter={(label) => `${t('farmerDashboard.income.chartLabel')}: ${label}`}
                  />
                  <Legend formatter={(value) => (value === 'total' ? t('farmerDashboard.metrics.totalIncome') : value)} />
                  <Bar dataKey="total" fill="var(--color-forest)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="organic-card dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <h3>{t('farmerDashboard.products.title')}</h3>
              <p>{t('farmerDashboard.products.subtitle')}</p>
            </div>
          </div>
          <div className="dashboard-chart-wrap">
            {loading ? (
              <div className="dashboard-loading">{t('farmerDashboard.loading')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 8, right: 24, left: 28, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,154,0.15)" />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="label" width={120} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatMoney(value)}
                    labelFormatter={(label) => `${t('farmerDashboard.products.axisLabel')}: ${label}`}
                  />
                  <Legend formatter={() => t('farmerDashboard.products.revenueLegend')} />
                  <Bar dataKey="total_revenue" fill="#F4A261" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="organic-card dashboard-chart-card dashboard-chart-card-wide">
          <div className="dashboard-card-header">
            <div>
              <h3>{t('farmerDashboard.buyers.title')}</h3>
              <p>{t('farmerDashboard.buyers.subtitle')}</p>
            </div>
          </div>
          <div className="dashboard-chart-wrap">
            {loading ? (
              <div className="dashboard-loading">{t('farmerDashboard.loading')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={retentionSeries} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,154,0.15)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [formatCount(value), name === 'repeat_buyers' ? t('farmerDashboard.buyers.repeat') : t('farmerDashboard.buyers.new')]}
                  />
                  <Legend />
                  <Bar dataKey="new_buyers" stackId="buyers" fill="#52B788" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="repeat_buyers" stackId="buyers" fill="#0D47A1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}