import { useState } from 'react';
import { previewFromCLI, getCLIPlaceholder } from '../utils/cliParser.js';
import { formatRupiah } from '../utils/format.js';
import { Send } from 'lucide-react';

export default function SmartCLIInput({ template, categories, onSubmit }) {
  const toTitleCase = (str) =>
    str ? str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const [input, setInput] = useState('');
  const preview = previewFromCLI(input, template);
  const placeholder = getCLIPlaceholder(template);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const parsed = previewFromCLI(input, template);
    if (!parsed.amount || !parsed.title) return;

    const matchedCategory = parsed.category
      ? categories?.find((c) => c.name.toLowerCase() === parsed.category.toLowerCase())
      : null;

    // Do not fallback to "Lainnya" automatically. If the category is not found we send null so the caller can ask the user to create it.
    onSubmit({
      title: parsed.title,
      amount: parsed.amount,
      categoryInput: parsed.category,
      category_id: matchedCategory?.id || null,
      category_name: matchedCategory?.name || toTitleCase(parsed.category) || 'Lainnya',
      notes: parsed.notes,
      dateInput: parsed.dateInput,
      timeInput: parsed.timeInput,
    });

    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border bg-background px-4 py-3 pr-12 text-sm outline-none ring-ring focus:ring-2"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary p-1.5 text-primary-foreground disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
      {preview.title && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">{preview.title}</span>
            <span className="font-semibold">{formatRupiah(preview.amount)}</span>
          </div>
          {preview.category && (
            <p className="mt-1 text-xs text-muted-foreground">
              Kategori: {toTitleCase(preview.category)}
            </p>
          )}
          {(preview.dateInput || preview.timeInput) && (
            <p className="text-xs text-muted-foreground">
              Waktu: {preview.dateInput || '(hari ini)'} {preview.timeInput || ''}
            </p>
          )}
          {preview.notes && (
            <p className="text-xs text-muted-foreground">
              Catatan: {preview.notes}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
