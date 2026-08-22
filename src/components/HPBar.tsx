export default function HPBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color = pct > 50 ? "bg-moss" : pct > 20 ? "bg-gold" : "bg-ember";

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-parchment/70">
        <span>HP</span>
        <span>
          {current} / {max}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-night">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
