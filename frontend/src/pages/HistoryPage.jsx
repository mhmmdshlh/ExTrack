import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Download, Filter, FileDown } from 'lucide-react';
import { useExpensesInfinite, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses.js';
import { useCategories } from '../hooks/useCategories.js';
import ExpenseList from '../components/ExpenseList.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { formatDate, formatRupiah, getStartOfYear } from '../utils/format.js';
import * as expenseService from '../services/expenseService.js';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParams = useMemo(() => {
    const p = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (categoryFilter) p.categoryId = categoryFilter;
    if (timeFilter === 'today') {
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
    return p;
  }, [debouncedSearch, categoryFilter, timeFilter]);

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

  const downloadBlob = (content, mimeType, ext) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrack-export-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);
    try {
      const res = await expenseService.getExpenses(filterParams);
      const rows = res.data.expenses;

      if (format === 'csv') {
        const csvRows = rows.map((e) => [
          `"${e.title}"`,
          e.amount,
          `"${e.category_name}"`,
          `"${e.notes || ''}"`,
          formatDate(e.created_at),
        ]);
        const headers = ['Title', 'Amount', 'Category', 'Notes', 'Date'];
        const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
        downloadBlob(csv, 'text/csv;charset=utf-8;', 'csv');
      } else if (format === 'txt') {
        const txt = rows.map((e) =>
          `Judul: ${e.title}\nJumlah: ${formatRupiah(e.amount)}\nKategori: ${e.category_name}\nTanggal: ${formatDate(e.created_at)}\n`
        ).join('\n');
        downloadBlob(txt, 'text/plain;charset=utf-8;', 'txt');
      } else if (format === 'xlsx') {
        const data = rows.map((e) => ({
          Title: e.title,
          Amount: e.amount,
          Category: e.category_name,
          Notes: e.notes || '',
          Date: formatDate(e.created_at),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
        XLSX.writeFile(wb, `extrack-export-${Date.now()}.xlsx`);
      }
    } catch {
      // export failed silently
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
        <h1 className="text-xl font-bold">Riwayat</h1>
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
                  CSV
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <FileDown size={14} />
                  TXT
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <FileDown size={14} />
                  XLSX
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
          placeholder="Cari pengeluaran..."
          className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
        />
      </div>

      {showFilters && (
        <div className="mb-4 flex gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
          Memuat lebih banyak...
        </p>
      )}

      <div ref={sentinelRef} className="h-4" />

      {!hasNextPage && allExpenses.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Semua data telah dimuat
        </p>
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title="Hapus Pengeluaran"
        message="Hapus pengeluaran ini?"
        onConfirm={async () => {
          await deleteExpenseMutation.mutateAsync(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
