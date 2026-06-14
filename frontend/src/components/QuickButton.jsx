export default function QuickButton({ config, onClick }) {
  if (!config || !config.label) return null;

  return (
    <button
      onClick={() => onClick(config)}
      className="flex flex-col items-center justify-center rounded-xl border bg-card p-3 text-center transition-colors hover:bg-accent active:scale-95"
    >
      <span className="text-lg font-bold">{formatNominal(config.amount)}</span>
      <span className="mt-0.5 text-xs text-muted-foreground">{config.category}</span>
      <span className="text-[10px] text-muted-foreground">{config.label}</span>
    </button>
  );
}

function formatNominal(val) {
  if (!val) return 'Rp0';
  const num = Number(val);
  if (num >= 1000000) return `Rp${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `Rp${(num / 1000).toFixed(0)}rb`;
  return `Rp${num}`;
}
