import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, Filter, FileDown } from 'lucide-react';
import Toast from '../components/Toast.jsx';
import { useExpensesInfinite, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses.js';
import { useCategories } from '../hooks/useCategories.js';
import ExpenseList from '../components/ExpenseList.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { formatDate, formatRupiah, getStartOfYear } from '../utils/format.js';
import * as expenseService from '../services/expenseService.js';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sortOption, setSortOption] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const exportMenuRef = useRef(null);

  const SORT_OPTIONS = useMemo(() => [
    { label: t('history.sortOptions.0'), sortBy: 'date', sortOrder: 'desc' },
    { label: t('history.sortOptions.1'), sortBy: 'date', sortOrder: 'asc' },
    { label: t('history.sortOptions.2'), sortBy: 'amount', sortOrder: 'desc' },
    { label: t('history.sortOptions.3'), sortBy: 'amount', sortOrder: 'asc' },
    { label: t('history.sortOptions.4'), sortBy: 'title', sortOrder: 'asc' },
    { label: t('history.sortOptions.5'), sortBy: 'title', sortOrder: 'desc' },
    { label: t('history.sortOptions.6'), sortBy: 'category', sortOrder: 'asc' },
    { label: t('history.sortOptions.7'), sortBy: 'category', sortOrder: 'desc' },
  ], [t]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParams = useMemo(() => {
    const p = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (categoryFilter) p.categoryId = categoryFilter;
    if (dateRange.start && dateRange.end) {
      p.startDate = new Date(dateRange.start + 'T00:00:00.000Z').toISOString();
      p.endDate = new Date(dateRange.end + 'T23:59:59.999Z').toISOString();
    } else if (timeFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      p.startDate = today.toISOString();
    } else if (timeFilter === 'week') {
      const week = new Date();
      week.setDate(week.getDate() - 7);
      p.startDate = week.toISOString();
    } else if (timeFilter === 'month') {
      const month = new Date();
      month.setMonth(month.getMonth() - 1);
      p.startDate = month.toISOString();
    } else if (timeFilter === 'year') {
      p.startDate = getStartOfYear().toISOString();
    }
    const opt = SORT_OPTIONS[sortOption];
    p.sortBy = opt.sortBy;
    p.sortOrder = opt.sortOrder;
    return p;
  }, [debouncedSearch, categoryFilter, timeFilter, sortOption, dateRange, SORT_OPTIONS]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useExpensesInfinite(filterParams);

  const allExpenses = useMemo(
    () => data?.pages?.flatMap(p => p.expenses ?? []) ?? [],
    [data]
  );

  const { data: categories = [] } = useCategories();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const handleEdit = useCallback((id, data) => {
    updateExpenseMutation.mutateAsync({ id, data });
  }, [updateExpenseMutation]);

  const handleDelete = useCallback((id) => {
    setDeleteConfirm(id);
  }, []);

  const saveFile = async (blob, suggestedName, mimeType, ext) => {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ accept: { [mimeType]: [`.${ext}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);
    try {
      const res = await expenseService.getExpenses(filterParams);
      const rows = res.data.expenses;
      const now = Date.now();

      if (format === 'csv') {
        const csvRows = rows.map((e) => [
          `"${e.title}"`,
          e.amount,
          `"${e.category_name}"`,
          `"${e.notes || ''}"`,
          formatDate(e.created_at),
        ]);
        const headers = [t('export.csvHeaders.0'), t('export.csvHeaders.1'), t('export.csvHeaders.2'), t('export.csvHeaders.3'), t('export.csvHeaders.4')];
        const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        await saveFile(blob, `${t('export.filename')}${now}.csv`, 'text/csv', 'csv');
      } else if (format === 'txt') {
        const txt = rows.map((e) =>
          `${t('export.txtLabels.title')}${e.title}\n${t('export.txtLabels.amount')}${formatRupiah(e.amount)}\n${t('export.txtLabels.category')}${e.category_name}\n${t('export.txtLabels.date')}${formatDate(e.created_at)}\n`
        ).join('\n');
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
        await saveFile(blob, `${t('export.filename')}${now}.txt`, 'text/plain', 'txt');
      } else if (format === 'xlsx') {
        const data = rows.map((e) => ({
          [t('export.csvHeaders.0')]: e.title,
          [t('export.csvHeaders.1')]: e.amount,
          [t('export.csvHeaders.2')]: e.category_name,
          [t('export.csvHeaders.3')]: e.notes || '',
          [t('export.csvHeaders.4')]: formatDate(e.created_at),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t('export.sheetName'));
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        await saveFile(blob, `${t('export.filename')}${now}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setToast(t('export.error'));
    }
  };

  const sentinelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-4 lg:pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('history.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-lg border bg-card p-2 text-muted-foreground hover:bg-accent"
          >
            <Filter size={18} />
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="rounded-lg border bg-card p-2 text-muted-foreground hover:bg-accent"
            >
              <Download size={18} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border bg-card py-1 shadow-lg">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <FileDown size={14} />
                  {t('history.export.csv')}
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <FileDown size={14} />
                  {t('history.export.txt')}
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <FileDown size={14} />
                  {t('history.export.xlsx')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('history.search')}
          className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
        />
      </div>

      {showFilters && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setDateRange({ start: '', end: '' });
              }}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="all">{t('history.timeOptions.all')}</option>
              <option value="today">{t('history.timeOptions.today')}</option>
              <option value="week">{t('history.timeOptions.week')}</option>
              <option value="month">{t('history.timeOptions.month')}</option>
              <option value="year">{t('history.timeOptions.year')}</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="">{t('history.categoryAll')}</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(Number(e.target.value))}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
            >
              {SORT_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>{opt.label}</option>
              ))}
            </select>
          </div>
          {timeFilter === 'all' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
          )}
        </div>
      )}

      <ExpenseList
        expenses={allExpenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        skeletonCount={PAGE_SIZE}
      />

      {isFetchingNextPage && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t('history.loadingMore')}
        </p>
      )}

      <div ref={sentinelRef} className="h-4" />

      {!hasNextPage && allExpenses.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t('history.allLoaded')}
        </p>
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title={t('history.deleteConfirmTitle')}
        message={t('history.deleteConfirmMessage')}
        onConfirm={async () => {
          await deleteExpenseMutation.mutateAsync(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
