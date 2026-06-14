import { memo } from 'react';
import ExpenseCard from './ExpenseCard.jsx';
import Skeleton from './Skeleton.jsx';

const ExpenseList = memo(function ExpenseList({ expenses, onEdit, onDelete, isLoading, skeletonCount }) {
  if (isLoading) {
    return <Skeleton count={skeletonCount || 5} />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada pengeluaran
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

export default ExpenseList;
