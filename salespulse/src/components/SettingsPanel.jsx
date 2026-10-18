import { useEffect, useState } from "react";
import { Save, RotateCcw, Zap, Sun, Moon, Info } from "lucide-react";
import { brl } from "../lib/hooks.js";

/**
 * Configurações reais do app, persistidas em localStorage:
 *  - metas mensais por equipe (R$)
 *  - animações ligadas/desligadas (afeta gráficos e transições)
 *  - tema inicial já controlado pelo toggle do header
 */
export default function SettingsPanel({
  dadosDefault,
  settings,
  onChange,
  anim,
  dark,
  onTheme,
}) {
  // valores digitados locais (só persistem ao salvar)
  const [rascunho, setRascunho] = useState(() =>
    Object.fromEntries(
      Object.entries(dadosDefault).map(([k, v]) => [k, (settings.metas?.[k] ?? v).toString()])
    )
  );
  const [sujo, setSujo] = useState(false);

  useEffect(() => {
    setRascunho(
      Object.fromEntries(
        Object.entries(dadosDefault).map(([k, v]) => [k, (settings.metas?.[k] ?? v).toString()])
      )
    );
  }, [dadosDefault, settings.metas]);

  const salvar = () => {
    const metas = {};
    let invalido = false;
    Object.entries(rascunho).forEach(([k, raw]) => {
      const v = Number(String(raw).replace(",", "."));
      if (isNaN(v) || v < 0) invalido = true;
      else metas[k] = v;
    });
    if (invalido) return false;
    onChange({ ...settings, metas });
    return true;
  };

  const restaurar = () => {
    onChange({ ...settings, metas: {} });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Metas */}
      <div>
        <p className="micro-label mb-3 text-slate-500 dark:text-slate-400">
          Meta mensal por equipe (R$)
        </p>
        <div className="space-y-3">
          {Object.entries(dadosDefault).map(([equipe, valorDefault]) => (
            <div key={equipe}>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {equipe}
                {settings.metas?.[equipe] != null && settings.metas[equipe] !== valorDefault && (
                  <span className="ml-2 rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-500">
                    editada
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={rascunho[equipe] ?? ""}
                  onChange={(e) => {
                    setRascunho((r) => ({ ...r, [equipe]: e.target.value }));
                    setSujo(true);
                  }}
                  className="tnum w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-nightline dark:bg-white/[0.03] dark:text-white"
                />
                <span className="hidden whitespace-nowrap text-[11px] text-slate-400 sm:block">
                  default {brl(valorDefault)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              if (salvar()) setSujo(false);
            }}
            disabled={!sujo}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sujo
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600"
                : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
            }`}
          >
            <Save className="size-4" strokeWidth={2} /> Salvar metas
          </button>
          <button
            onClick={restaurar}
            disabled={Object.keys(settings.metas ?? {}).length === 0}
            className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-nightline dark:text-slate-300 dark:hover:bg-white/5"
          >
            <RotateCcw className="size-4" strokeWidth={2} /> Restaurar padrão
          </button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
          <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
          As metas ficam salvas no navegador (localStorage) e sobrepõem o JSON. Para
          persistir definitivamente no arquivo `data.json`, edite-o diretamente.
        </p>
      </div>

      {/* Preferências */}
      <div className="space-y-5 rounded-xl border border-line bg-surface p-4 dark:border-nightline dark:bg-white/[0.03]">
        <p className="micro-label text-slate-500 dark:text-slate-400">
          Preferências
        </p>

        {/* Animações */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Animações dos gráficos
            </p>
            <p className="text-[11px] text-slate-400">
              Desligue para leitura instantânea (acessibilidade/performance)
            </p>
          </div>
          <button
            onClick={() => onChange({ ...settings, anim: !anim })}
            aria-pressed={anim}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
              anim ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                anim ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Tema */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Tema atual
            </p>
            <p className="text-[11px] text-slate-400">
              Alterne também pelo botão do header
            </p>
          </div>
          <button
            onClick={onTheme}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-nightline dark:text-slate-300 dark:hover:bg-white/5"
          >
            {dark ? (
              <Sun className="size-4" strokeWidth={2} />
            ) : (
              <Moon className="size-4" strokeWidth={2} />
            )}
            {dark ? "Claro" : "Escuro"}
          </button>
        </div>

        <div className="flex items-start gap-1.5 rounded-lg bg-brand-500/5 p-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <Zap className="mt-0.5 size-3.5 shrink-0 text-brand-500" strokeWidth={2} />
          Todas as preferências impactam a sessão imediatamente — sem recarregar a
          página.
        </div>
      </div>
    </div>
  );
}
