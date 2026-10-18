import { useEffect, useState } from "react";
import { Target, CheckCircle2 } from "lucide-react";
import { brl } from "../lib/hooks.js";

/** Barra de progresso animada (width 0 → pct com easing CSS). */
function ProgressBar({ pct, cor }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setW(Math.min(pct, 100))
    );
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/[0.06]">
      <div
        className={`h-full rounded-full ${cor} transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/**
 * Metas por equipe (meta mensal em data.json × nº de meses em escopo).
 * Estados: ≥100% verde (atingida), ≥70% indigo, <70% âmbar.
 */
export default function MetasPanel({ metas, mesesEmEscopo, delay = 0 }) {
  return (
    <div className="space-y-5">
      {metas.map((m, i) => {
        const pct = m.meta ? (m.realizado / m.meta) * 100 : 0;
        const atingida = pct >= 100;
        const cor = atingida
          ? "bg-emerald-500"
          : pct >= 70
            ? "bg-brand-500"
            : "bg-amber-500";
        const falta = Math.max(0, m.meta - m.realizado);
        return (
          <div key={m.equipe}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                {atingida ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <Target className="size-4 text-slate-400" />
                )}
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {m.equipe}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    pct >= 100
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                  }`}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
              <p className="tnum text-xs text-slate-500 dark:text-slate-400">
                {brl(m.realizado)}{" "}
                <span className="text-slate-400">/ {brl(m.meta)}</span>
              </p>
            </div>
            <ProgressBar pct={pct} cor={cor} />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {atingida
                ? "✅ Meta atingida — superada em " + brl(m.realizado - m.meta)
                : "Faltam " + brl(falta) + " para a meta"}
              <span className="text-slate-400">
                {" · "}
                {mesesEmEscopo === 2
                  ? "meta dos 2 meses consolidados"
                  : "meta mensal"}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
