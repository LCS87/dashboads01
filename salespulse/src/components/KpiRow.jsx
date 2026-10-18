import { useCountUp, brl } from "../lib/hooks.js";

/** Card de esqueleto com shimmer — formas auditadas contra o card real. */
export function SkeletonCard({ tall = false }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white p-5 dark:border-nightline dark:bg-nightcard ${
        tall ? "min-h-[300px]" : "min-h-[112px]"
      }`}
    >
      {tall ? (
        <div className="flex h-full flex-col justify-between">
          <div className="skeleton h-3 w-28 bg-slate-200/70 dark:bg-white/5" />
          <div className="skeleton h-44 w-full bg-slate-200/70 dark:bg-white/5" />
          <div className="skeleton h-3 w-20 bg-slate-200/70 dark:bg-white/5" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="skeleton h-3 w-24 bg-slate-200/70 dark:bg-white/5" />
          <div className="skeleton h-7 w-32 bg-slate-200/70 dark:bg-white/5" />
          <div className="skeleton h-3 w-16 bg-slate-200/70 dark:bg-white/5" />
        </div>
      )}
    </div>
  );
}

/** Um KPI com contador animado. */
function KpiCard({ label, value, delta, format, icon: Icon, accent, delay }) {
  const animated = useCountUp(value);
  return (
    <div
      className="rise rounded-2xl border border-line bg-white p-5 dark:border-nightline dark:bg-nightcard"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="micro-label text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div
          className={`grid size-8 place-items-center rounded-lg ${accent.bg}`}
        >
          <Icon className={`size-4 ${accent.text}`} strokeWidth={2} />
        </div>
      </div>
      <p className="tnum mt-2 text-[1.55rem] font-bold leading-none text-slate-900 dark:text-white">
        {format(animated)}
      </p>
      {delta != null && (
        <p
          className={`mt-2 text-xs font-semibold ${
            delta >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs mês anterior
        </p>
      )}
    </div>
  );
}

export default function KpiRow({ kpis, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} {...k} delay={i * 70} />
      ))}
    </div>
  );
}
