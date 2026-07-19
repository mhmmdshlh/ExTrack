import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingDown, TrendingUp, Receipt, CalendarDays, ArrowUpRight } from 'lucide-react';
import { useExpensesSummary, useExpensesTrends, useExpenses } from '../hooks/useExpenses.js';
import { formatRupiah, getStartOfYear } from '../utils/format.js';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

const PERIOD_OPTIONS = [
  { value: 'all', labelKey: 'statistics.periodAll' },
  { value: 'year', labelKey: 'statistics.periodYear' },
  { value: 'month', labelKey: 'statistics.periodMonth' },
  { value: 'week', labelKey: 'statistics.periodWeek' },
];

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function getDateRange(period) {
  const now = new Date();
  if (period === 'year') return { startDate: getStartOfYear().toISOString() };
  if (period === 'month') return { startDate: startOfMonth(now).toISOString() };
  if (period === 'week') {
    const week = new Date();
    week.setDate(week.getDate() - 7);
    return { startDate: week.toISOString() };
  }
  return {};
}

export default function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'id' ? id : undefined;

  const [period, setPeriod] = useState('year');

  const dateRange = useMemo(() => getDateRange(period), [period]);

  const summaryParams = useMemo(() => dateRange, [dateRange]);
  const trendsParams = useMemo(() => ({ ...dateRange, groupBy: 'month' }), [dateRange]);
  const topParams = useMemo(() => ({ ...dateRange, sortBy: 'amount', sortOrder: 'desc', limit: 5 }), [dateRange]);

  const { data: summary, isLoading: summaryLoading } = useExpensesSummary(summaryParams);
  const { data: trends, isLoading: trendsLoading } = useExpensesTrends(trendsParams);
  const { data: topData, isLoading: topLoading } = useExpenses(topParams);

  const chartData = useMemo(() => {
    if (!trends) return [];
    return trends.map((d) => ({
      label: format(new Date(d.period), 'MMM', { locale: dateLocale }),
      total: d.total,
      count: d.count,
    }));
  }, [trends, dateLocale]);

  const categoryChartData = useMemo(() => {
    if (!summary?.categories) return [];
    return summary.categories.map((c, i) => ({
      name: c.name,
      total: Number(c.total),
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [summary]);

  const topExpenses = topData?.expenses || [];

  const avgPerDay = useMemo(() => {
    if (!summary?.total || !dateRange.startDate) return null;
    const start = new Date(dateRange.startDate);
    const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    return Math.round(summary.total / days);
  }, [summary, dateRange]);

  const comparison = useMemo(() => {
    if (period === 'all') return null;
    const thisStart = dateRange.startDate ? new Date(dateRange.startDate) : null;
    if (!thisStart) return null;
    const monthStart = startOfMonth(thisStart);
    const lastStart = subMonths(monthStart, 1);
    const lastEnd = subMonths(endOfMonth(thisStart), 1);
    return { thisStart, lastStart, lastEnd };
  }, [period, dateRange]);

  const { data: prevSummary } = useExpensesSummary(
    comparison ? { startDate: comparison.lastStart.toISOString(), endDate: comparison.lastEnd.toISOString() } : {},
  );

  const percentChange = useMemo(() => {
    if (!prevSummary?.total || !summary?.total) return null;
    return ((summary.total - prevSummary.total) / prevSummary.total * 100).toFixed(1);
  }, [summary, prevSummary]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-4 lg:pb-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('statistics.title')}</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
          ))}
        </select>
      </div>

      {summaryLoading ? (
        <p className="text-sm text-muted-foreground">{t('statistics.loading')}</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard
              icon={TrendingDown}
              label={t('statistics.totalSpent')}
              value={formatRupiah(summary?.total || 0)}
            />
            <SummaryCard
              icon={Receipt}
              label={t('statistics.transactionCount')}
              value={trends?.reduce((s, d) => s + d.count, 0)?.toLocaleString() || '0'}
            />
            <SummaryCard
              icon={CalendarDays}
              label={t('statistics.avgPerDay')}
              value={avgPerDay ? formatRupiah(avgPerDay) : '-'}
            />
            <SummaryCard
              icon={ArrowUpRight}
              label={t('statistics.largest')}
              value={topExpenses[0] ? formatRupiah(topExpenses[0].amount) : '-'}
            />
          </div>

          {comparison && percentChange && (
            <div className="mb-6 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('statistics.vsLastMonth')}</p>
                <div className={`flex items-center gap-1 text-sm font-semibold ${Number(percentChange) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {Number(percentChange) > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Number(percentChange) > 0 ? '+' : ''}{percentChange}%
                </div>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>{t('statistics.thisPeriod')}: {formatRupiah(summary?.total || 0)}</span>
                <span>{t('statistics.lastPeriod')}: {formatRupiah(prevSummary?.total || 0)}</span>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-xl border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold">{t('statistics.monthlyTrend')}</h2>
            {trendsLoading ? (
              <p className="text-sm text-muted-foreground">{t('statistics.loading')}</p>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('statistics.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => formatRupiah(value)}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
                  />
                  <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mb-6 rounded-xl border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold">{t('statistics.perCategory')}</h2>
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('statistics.noData')}</p>
            ) : (
              <div className="space-y-3">
                {categoryChartData.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="font-medium">{formatRupiah(cat.total)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(cat.total / categoryChartData[0].total) * 100}%`, background: cat.fill }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">{t('statistics.topExpenses')}</h2>
            {topLoading ? (
              <p className="text-sm text-muted-foreground">{t('statistics.loading')}</p>
            ) : topExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('statistics.noData')}</p>
            ) : (
              <div className="space-y-2">
                {topExpenses.map((e, i) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.category_name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatRupiah(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon size={16} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
