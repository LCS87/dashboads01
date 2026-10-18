import { Sun, Moon, Download, Menu } from "lucide-react";

const EQUIPES = ["Todas", "Roberta", "Fernanda", "Patricia"];
const MESES = ["Consolidado", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"];

export default function Header({
  equipe,
  onEquipe,
  mes,
  onMes,
  onExport,
  onMenu,
  dark,
  onTheme,
}) {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-4 dark:border-nightline sm:px-6 lg:px-8">
      {/* Hamburger (somente mobile) */}
      <button
        onClick={onMenu}
        aria-label="Abrir menu"
        className="grid size-9 shrink-0 place-items-center rounded-xl border border-line text-slate-600 transition-colors hover:bg-slate-50 dark:border-nightline dark:text-slate-300 dark:hover:bg-white/5 lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.8} />
      </button>

      <div className="mr-auto">
        <div className="flex items-center gap-2.5">
          <h1
            className="bg-gradient-to-r from-brand-500 via-brand-400 to-bronze
            bg-clip-text text-xl font-extrabold tracking-tight text-transparent
            dark:from-brand-400 dark:via-brand-300 dark:to-bronze-light"
          >
            🌊 Maré de Vendas
          </h1>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            NO AR
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {mes === "Consolidado"
            ? "Radar completo do time · Jan–Jun 2026"
            : `Radar completo do time · ${mes} de 2026`}
        </p>
      </div>

      {/* Filtros de equipe */}
      <div className="flex max-w-full shrink-0 justify-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        {EQUIPES.map((e) => (
          <button
            key={e}
            onClick={() => onEquipe(e)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              equipe === e
                ? "bg-white text-brand-600 shadow-sm dark:bg-brand-500/20 dark:text-brand-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Filtro de período */}
      <div className="shrink-0">
        <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
          Período
        </p>
        <div className="mt-0 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-white/5 sm:mt-1">
          {MESES.map((m) => (
            <button
              key={m}
              onClick={() => onMes(m)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                mes === m
                  ? "bg-white text-brand-600 shadow-sm dark:bg-brand-500/20 dark:text-brand-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onExport}
        title="Baixa o CSV das transações filtradas"
        className="hidden items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-nightline dark:text-slate-300 dark:hover:bg-white/5 sm:flex"
      >
        <Download className="size-4" strokeWidth={1.8} /> Exportar CSV
      </button>

      <button
        onClick={onTheme}
        aria-label="Alternar tema"
        className="grid size-9 place-items-center rounded-xl border border-line text-slate-600 transition-colors hover:bg-slate-50 dark:border-nightline dark:text-slate-300 dark:hover:bg-white/5"
      >
        {dark ? (
          <Sun className="size-4" strokeWidth={1.8} />
        ) : (
          <Moon className="size-4" strokeWidth={1.8} />
        )}
      </button>
    </header>
  );
}