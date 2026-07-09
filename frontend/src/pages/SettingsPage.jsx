import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories.js';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Toast from '../components/Toast.jsx';

const TEMPLATE_OPTIONS = [
  { label: '{amount} {title} {category}', value: '{amount} {title} {category}' },
  { label: '{category} {amount} {title}', value: '{category} {amount} {title}' },
  { label: '{title} {amount} {category}', value: '{title} {amount} {category}' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const updateSettingsMutation = useUpdateSettings();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const navigate = useNavigate();

  const [template, setTemplate] = useState('');
  const [quickButtons, setQuickButtons] = useState([]);
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
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
      setToast(t('settings.saved'));
    } catch {
      setToast(t('settings.saveFailed'));
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
    setQuickButtons([...quickButtons, { label: '', amount: '', category: 'Lain-lain' }]);
  };

  const removeQuickButton = (idx) => {
    setQuickButtons(quickButtons.filter((_, i) => i !== idx));
  };

  const customCategories = categories?.filter((c) => c.user_id) || [];

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    await createCategoryMutation.mutateAsync(newCatName.trim());
    setShowNewCat(false);
    setNewCatName('');
    setToast(t('settings.categoryCreated'));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4 lg:pb-6">
      <h1 className="mb-6 text-xl font-bold">{t('settings.title')}</h1>

      <div className="mb-6 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{t('settings.accountSubtitle')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-destructive hover:bg-accent"
          >
            <LogOut size={14} />
            {t('settings.logout')}
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sliders size={16} />
          {t('settings.appearance')}
        </h2>
        <button
          onClick={toggleDark}
          className="flex w-full items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            <span className="text-sm">{t('settings.darkMode')}</span>
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
          <Sliders size={16} />
          {t('settings.language')}
        </h2>
        <select
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="mb-6 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Key size={16} />
          {t('settings.cliTemplate')}
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
            {t('settings.quickButtons')}
          </h2>
          {quickButtons.length < 6 && (
            <button
              onClick={addQuickButton}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Plus size={14} />
              {t('settings.add')}
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
              placeholder={t('settings.label')}
              className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none"
            />
            <input
              type="text"
              value={btn.amount}
              onChange={(e) =>
                updateQuickButton(idx, 'amount', e.target.value.replace(/\D/g, ''))
              }
              placeholder={t('settings.amount')}
              className="w-20 rounded-md border bg-background px-2 py-1 text-sm text-right outline-none"
            />
            <select
              value={btn.category}
              onChange={(e) => updateQuickButton(idx, 'category', e.target.value)}
              className="w-24 rounded-md border bg-background px-2 py-1 text-sm outline-none"
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
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
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {t('settings.customCategories')}
          </h2>
          <button
            onClick={() => setShowNewCat(true)}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Plus size={14} />
            {t('settings.add')}
          </button>
        </div>

        {showNewCat && (
          <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              placeholder={t('settings.newCategoryPlaceholder')}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-sm outline-none"
              autoFocus
            />
            <button
              onClick={handleCreateCategory}
              className="rounded p-1 text-green-600 hover:bg-accent"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setShowNewCat(false);
                setNewCatName('');
              }}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {customCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('settings.noCustomCategories')}</p>
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
                      setToast(t('settings.categoryUpdated'));
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
                      <span className="text-xs text-muted-foreground">({cat.expense_count} {cat.expense_count > 1 ? t('settings.expenses') : t('settings.expense')})</span>
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
        {t('settings.save')}
      </button>

      <ConfirmModal
        open={!!deleteCatConfirm}
        title={t('settings.deleteCategoryTitle')}
        message={t('settings.deleteCategoryMessage', { name: deleteCatConfirm?.name })}
        onConfirm={async () => {
          if (!deleteCatConfirm) return;
          await deleteCategoryMutation.mutateAsync(deleteCatConfirm.id);
          setDeleteCatConfirm(null);
          setToast(t('settings.categoryDeleted'));
        }}
        onCancel={() => setDeleteCatConfirm(null)}
      />

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
