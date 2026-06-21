import { useState, useCallback, useMemo } from 'react';
import { TrendingDown, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExpenses, useCreateExpense, useDeleteExpense, useUpdateExpense } from '../hooks/useExpenses.js';
import { useCategories, useCreateCategory, findCategoryByName } from '../hooks/useCategories.js';
import { useSettings } from '../hooks/useSettings.js';
import { formatRupiah, getStartOfWeek, getStartOfMonth, getStartOfYear } from '../utils/format.js';
import ExpenseList from '../components/ExpenseList.jsx';
import SmartCLIInput from '../components/SmartCLIInput.jsx';
import QuickButton from '../components/QuickButton.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Toast from '../components/Toast.jsx';

const TIME_OPTIONS = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Minggu Ini', value: 'week' },
  { label: 'Bulan Ini', value: 'month' },
  { label: 'Tahun Ini', value: 'year' },
  { label: 'Semua', value: 'all' },
];

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('dashboard_timeRange') || 'month');

  const updateTimeRange = (val) => {
    setTimeRange(val);
    localStorage.setItem('dashboard_timeRange', val);
  };

  const params = useMemo(() => {
    if (timeRange === 'all') return {};
    let start;
    if (timeRange === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === 'week') start = getStartOfWeek();
    else if (timeRange === 'year') start = getStartOfYear();
    else start = getStartOfMonth();
    return { startDate: start.toISOString() };
  }, [timeRange]);
  const { data: expenseData, isLoading, isError, error: queryError } = useExpenses(params);
  const expenses = useMemo(() => expenseData?.expenses || [], [expenseData]);
  const total = useMemo(() => expenseData?.total || 0, [expenseData]);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSettings();
  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const updateExpenseMutation = useUpdateExpense();
  const createCategoryMutation = useCreateCategory();

  const formatNow = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return {
      date: `${dd}/${mm}/${yyyy}`,
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
  };

  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(formatNow().date);
  const [formTime, setFormTime] = useState(formatNow().time);
  const [newCategoryConfirm, setNewCategoryConfirm] = useState(null);
  const [pendingQuickBtn, setPendingQuickBtn] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState('');

  const handleEditExpense = useCallback((id, data) => {
    updateExpenseMutation.mutateAsync({ id, data });
  }, [updateExpenseMutation]);

  const handleDeleteClick = useCallback((id) => {
    setDeleteConfirm(id);
  }, []);

  const findOrCreateCategory = async (name) => {
    if (!name) return null;
    let cat = findCategoryByName(categories, name);
    if (!cat) {
      try {
        const res = await createCategoryMutation.mutateAsync(name);
        cat = res.data;
      } catch {
        cat = findCategoryByName(categories, name);
      }
    }
    return cat;
  };

  const handleCreateExpense = async (data) => {
    if (data.categoryInput && !data.category_id) {
      setNewCategoryConfirm(data);
      return;
    }
    if (!data.category_id) {
      setToast('Kategori diperlukan. Contoh: 6000 kopi minuman');
      return;
    }
    try {
      let created_at;
      if (data.dateInput || data.timeInput) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const [d, m, y] = (data.dateInput || `${dd}/${mm}/${yyyy}`).split('/');
        const [h, mi = '00'] = (data.timeInput || '00:00').split(':');
        const hh = h.padStart(2, '0');
        created_at = new Date(`${y}-${m}-${d}T${hh}:${mi.padStart(2, '0')}:00`).toISOString();
      }

      await createExpenseMutation.mutateAsync({
        title: data.title,
        amount: data.amount,
        category_id: data.category_id,
        notes: data.notes || null,
        ...(created_at && { created_at }),
      });
      setToast('Pengeluaran berhasil dicatat');
    } catch {
      // error handled by query
    }
  };

  const handleConfirmCategory = async () => {
    if (!newCategoryConfirm) return;
    const cat = await findOrCreateCategory(newCategoryConfirm.categoryInput);
    if (cat) {
      try {
        await createExpenseMutation.mutateAsync({
          title: newCategoryConfirm.title,
          amount: newCategoryConfirm.amount,
          category_id: cat.id,
          notes: newCategoryConfirm.notes || null,
        });
        setToast('Pengeluaran berhasil dicatat');
      } catch {
        // error handled by query
      }
    }
    setNewCategoryConfirm(null);
  };

  const handleQuickButton = async (config) => {
    if (!config.category) return;
    const cat = findCategoryByName(categories, config.category);
    if (cat) {
      await createExpenseMutation.mutateAsync({
        title: config.label,
        amount: Number(config.amount),
        category_id: cat.id,
      });
    } else {
      setPendingQuickBtn(config);
    }
  };

  const handleConfirmQuickCategory = async () => {
    if (!pendingQuickBtn) return;
    const cat = await findOrCreateCategory(pendingQuickBtn.category);
    if (cat) {
      await createExpenseMutation.mutateAsync({
        title: pendingQuickBtn.label,
        amount: Number(pendingQuickBtn.amount),
        category_id: cat.id,
      });
    }
    setPendingQuickBtn(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle || !formAmount || !formCategory) return;

    const cat = await findOrCreateCategory(formCategory);
    if (cat) {
      const [dd, mm, yyyy] = formDate.split('/');
      const created_at = new Date(`${yyyy}-${mm}-${dd}T${formTime}:00`).toISOString();

      await createExpenseMutation.mutateAsync({
        title: formTitle,
        amount: Number(formAmount),
        category_id: cat.id,
        notes: formNotes || null,
        created_at,
      });
      const now = formatNow();
      setFormTitle('');
      setFormAmount('');
      setFormCategory('');
      setFormNotes('');
      setFormDate(now.date);
      setFormTime(now.time);
      setShowForm(false);
    }
  };

  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  const chartData = useMemo(() => Object.values(
    expenses.reduce((acc, e) => {
      const name = e.category_name;
      acc[name] = acc[name] || { name, value: 0 };
      acc[name].value += Number(e.amount);
      return acc;
    }, {})
  ).filter((d) => d.value > 0), [expenses]);

  const template = useMemo(() => settings?.cli_template || '{amount} {title} {category}', [settings]);
  const quickButtons = useMemo(() => settings?.quick_buttons || [], [settings]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 lg:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ikhtisar pengeluaranmu</p>
      </header>

      <div className="mb-4 flex gap-2">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateTimeRange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              timeRange === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'border bg-card text-muted-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {queryError?.response?.data?.error || 'Gagal memuat data'}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          Memuat data...
        </div>
      )}

      <div className="lg:flex lg:gap-4">
        <div className="mb-6 rounded-2xl bg-primary p-5 text-primary-foreground lg:mb-0 lg:w-1/3 lg:self-start">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <TrendingDown size={16} />
            <span>Total Pengeluaran</span>
          </div>
          <p className="mt-1 text-3xl font-bold">{formatRupiah(total)}</p>
        </div>

        {chartData.length > 0 && (
          <div className="mb-6 rounded-xl border bg-card p-4 lg:mb-0 lg:w-2/3">
            <h2 className="mb-3 text-sm font-semibold">Per Kategori</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {chartData.map((d, idx) => (
                <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3">
        {!showForm && (
          <>
            <SmartCLIInput
              template={template}
              categories={categories}
              onSubmit={handleCreateExpense}
            />

            {quickButtons.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {quickButtons.map((btn, idx) => (
                  <QuickButton
                    key={idx}
                    config={btn}
                    onClick={handleQuickButton}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              <Plus size={16} />
              Form Lengkap
            </button>
          </>
        )}

        {showForm && (
          <form onSubmit={handleFormSubmit} className="space-y-3 rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold">Form Pengeluaran</h3>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Nama pengeluaran"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              required
            />
            <input
              type="text"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="Nominal (Rp)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Kategori"
                list="category-list"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                required
              />
              <datalist id="category-list">
                {categories?.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Catatan (opsional)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              rows={2}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              />
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-32 rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Transaksi Terbaru
        </h2>
        <ExpenseList
        expenses={recentExpenses}
        onEdit={handleEditExpense}
        onDelete={handleDeleteClick}
      />
      </div>

      <ConfirmModal
        open={!!newCategoryConfirm}
        title="Kategori Baru"
        message={`Kategori "${newCategoryConfirm?.categoryInput}" belum ada. Buat sekarang?`}
        confirmLabel="Buat & Simpan"
        onConfirm={handleConfirmCategory}
        onCancel={() => setNewCategoryConfirm(null)}
      />

      <ConfirmModal
        open={!!pendingQuickBtn}
        title="Kategori Baru"
        message={`Kategori "${pendingQuickBtn?.category}" belum ada. Buat sekarang?`}
        confirmLabel="Buat & Simpan"
        onConfirm={handleConfirmQuickCategory}
        onCancel={() => setPendingQuickBtn(null)}
      />

      <ConfirmModal
        open={!!deleteConfirm}
        title="Hapus Pengeluaran"
        message="Hapus pengeluaran ini?"
        onConfirm={async () => {
          await deleteExpenseMutation.mutateAsync(deleteConfirm);
          setDeleteConfirm(null);
          setToast('Pengeluaran berhasil dihapus');
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
