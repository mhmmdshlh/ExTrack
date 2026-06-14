import { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  LogOut,
  Key,
  Sliders,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  GripVertical,
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import { useSettings, useUpdateSettings } from '../hooks/useSettings.js';
import { useCategories, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories.js';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Toast from '../components/Toast.jsx';

const TEMPLATE_OPTIONS = [
  { label: '{amount} {title} {category}', value: '{amount} {title} {category}' },
  { label: '{category} {amount} {title}', value: '{category} {amount} {title}' },
  { label: '{title} {amount} {category}', value: '{title} {amount} {category}' },
];

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const updateSettingsMutation = useUpdateSettings();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const navigate = useNavigate();

  const [template, setTemplate] = useState('');
  const [quickButtons, setQuickButtons] = useState([]);
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored !== null ? stored === 'true' : document.documentElement.classList.contains('dark');
  });

  const initRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (settings && !initRef.current) {
      initRef.current = true;
      setTemplate(settings.cli_template || TEMPLATE_OPTIONS[0].value);
      setQuickButtons(
        Array.isArray(settings.quick_buttons) ? settings.quick_buttons : []
      );
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        cli_template: template,
        quick_buttons: quickButtons,
      });
      setToast('Pengaturan berhasil disimpan');
    } catch {
      setToast('Gagal menyimpan pengaturan');
    }
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const updateQuickButton = (idx, field, value) => {
    setQuickButtons((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addQuickButton = () => {
    if (quickButtons.length >= 6) return;
    setQuickButtons([...quickButtons, { label: '', amount: '', category: '' }]);
  };

  const removeQuickButton = (idx) => {
    setQuickButtons(quickButtons.filter((_, i) => i !== idx));
  };

  const customCategories = categories?.filter((c) => c.user_id) || [];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4 lg:pb-6">
      <h1 className="mb-6 text-xl font-bold">Pengaturan</h1>

      <div className="mb-6 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Akun kamu</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-destructive hover:bg-accent"
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sliders size={16} />
          Tampilan
        </h2>
        <button
          onClick={toggleDark}
          className="flex w-full items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            <span className="text-sm">Mode Gelap</span>
          </div>
          <div
            className={`h-5 w-9 rounded-full transition-colors ${
              darkMode ? 'bg-primary' : 'bg-input'
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                darkMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Key size={16} />
          Smart CLI Template
        </h2>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
        >
          {TEMPLATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <GripVertical size={16} />
            Quick Buttons (max 6)
          </h2>
          {quickButtons.length < 6 && (
            <button
              onClick={addQuickButton}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Plus size={14} />
              Tambah
            </button>
          )}
        </div>

        {quickButtons.map((btn, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-xl border bg-card p-3"
          >
            <span className="text-xs text-muted-foreground">{idx + 1}</span>
            <input
              type="text"
              value={btn.label}
              onChange={(e) => updateQuickButton(idx, 'label', e.target.value)}
              placeholder="Label"
              className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none"
            />
            <input
              type="text"
              value={btn.amount}
              onChange={(e) =>
                updateQuickButton(idx, 'amount', e.target.value.replace(/\D/g, ''))
              }
              placeholder="Rp"
              className="w-20 rounded-md border bg-background px-2 py-1 text-sm text-right outline-none"
            />
            <input
              type="text"
              value={btn.category}
              onChange={(e) => updateQuickButton(idx, 'category', e.target.value)}
              placeholder="Kategori"
              className="w-24 rounded-md border bg-background px-2 py-1 text-sm outline-none"
            />
            <button
              onClick={() => removeQuickButton(idx)}
              className="rounded p-1 text-destructive hover:bg-accent"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Kategori Custom
        </h2>
        {customCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kategori custom</p>
        ) : (
          customCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border bg-card p-3"
            >
              {editingCat === cat.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      await updateCategoryMutation.mutateAsync({ id: cat.id, name: editCatName });
                      setEditingCat(null);
                      setToast('Kategori berhasil diubah');
                    }}
                    className="rounded p-1 text-green-600 hover:bg-accent"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingCat(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.name}</span>
                    {cat.expense_count > 0 && (
                      <span className="text-xs text-muted-foreground">({cat.expense_count} expense)</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingCat(cat.id);
                        setEditCatName(cat.name);
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-accent"
                    >
                      <Pencil size={14} />
                    </button>
                    {cat.expense_count === 0 && (
                      <button
                        onClick={() => setDeleteCatConfirm(cat)}
                        className="rounded p-1 text-destructive hover:bg-accent"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Simpan Pengaturan
      </button>

      <ConfirmModal
        open={!!deleteCatConfirm}
        title="Hapus Kategori"
        message={`Hapus kategori "${deleteCatConfirm?.name}"?`}
        onConfirm={async () => {
          if (!deleteCatConfirm) return;
          await deleteCategoryMutation.mutateAsync(deleteCatConfirm.id);
          setDeleteCatConfirm(null);
          setToast('Kategori berhasil dihapus');
        }}
        onCancel={() => setDeleteCatConfirm(null)}
      />

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
