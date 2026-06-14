import { useState, memo } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { formatRupiah, formatDateTime, isWithin24Hours } from '../utils/format.js';

const ExpenseCard = memo(function ExpenseCard({ expense, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(expense.title);
  const [editAmount, setEditAmount] = useState(String(expense.amount));
  const modifiable = isWithin24Hours(expense.created_at);

  const handleSave = () => {
    onEdit(expense.id, {
      title: editTitle,
      amount: parseInt(editAmount) || 0,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
        <input
          className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
        />
        <input
          className="w-24 rounded-md border bg-background px-2 py-1 text-sm text-right"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ''))}
        />
        <button onClick={handleSave} className="rounded p-1 text-green-600 hover:bg-accent">
          <Check size={16} />
        </button>
        <button onClick={() => setEditing(false)} className="rounded p-1 text-muted-foreground hover:bg-accent">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{expense.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{expense.category_name}</span>
          <span>·</span>
          <span>{formatDateTime(expense.created_at)}</span>
        </div>
        {expense.notes && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {expense.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-sm font-semibold">
          {formatRupiah(expense.amount)}
        </span>
        {modifiable && (
          <div className="flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <button
              onClick={() => {
                setEditTitle(expense.title);
                setEditAmount(String(expense.amount));
                setEditing(true);
              }}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(expense.id)}
              className="rounded p-1 text-destructive hover:bg-accent"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ExpenseCard;
