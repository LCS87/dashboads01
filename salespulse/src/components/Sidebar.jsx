import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Target,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

const NAV = [
  { id: "visao", label: "Visão Geral", icon: LayoutDashboard },
  { id: "ranking", label: "Consultores", icon: Trophy },
  { id: "equipes", label: "Equipes", icon: Users },
  { id: "metas", label: "Metas", icon: Target },
  { id: "config", label: "Configurações", icon: Settings },
];

/**
 * Sidebar responsiva:
 *  - Desktop (≥lg): sticky, recolhível 240px ⇄ 68px;
 *  - Mobile (<lg): drawer off-canvas (translate-x) + backdrop; largura fixa 256px.
 * Scroll spy: App passa activeId; item ativo recebe pílula indigo animada.
 */
export default function Sidebar({
  collapsed,
  onToggle,
  activeId,
  onNav,
  mobileOpen,
  onClose,
}) {
  // fecha com ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mostraTexto = mobileOpen ? true : !collapsed;

  return (
    <>
      {/* Backdrop (somente mobile) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm
        transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        style={{ width: collapsed ? 68 : 240 }}
        className={`max-lg:w-64! max-lg:max-w-[80vw]! 
        fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r
        bg-white dark:bg-nightcard lg:bg-white/80 lg:dark:bg-nightcard/70
        backdrop-blur-sm border-line dark:border-nightline
        transition-[transform,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        lg:sticky lg:top-0 lg:z-30 lg:h-screen
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Fechar (somente mobile) */}
        <button
          onClick={onClose}
          aria-label="Fechar menu"
          className="absolute right-3 top-4 grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white lg:hidden"
        >
          <X className="size-4" strokeWidth={2} />
        </button>

        {/* Marca + Toggle topo (desktop) */}
        <div className="flex h-16 items-center gap-3 px-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 font-extrabold text-white shadow-lg shadow-brand-500/30">
            MV
          </div>
          <div
            className={`overflow-hidden whitespace-nowrap transition-opacity duration-200 flex-1 ${
              mostraTexto ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Maré de Vendas
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Jan–Jun 2026
            </p>
          </div>
          {/* Botão toggle no topo (apenas desktop) */}
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden lg:flex shrink-0 items-center justify-center size-8 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white ml-auto"
            title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" strokeWidth={1.8} />
            ) : (
              <PanelLeftClose className="size-5" strokeWidth={1.8} />
            )}
          </button>
        </div>

        {/* Navegação */}
        <nav className="mt-4 flex-1 space-y-1.5 px-3">
          {NAV.map(({ id, label, icon: Icon }, i) => {
            const ativo = activeId === id;
            return (
              <button
                key={id}
                title={label}
                onClick={() => onNav(id)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5
                text-sm font-medium transition-all duration-200 ease-out
                ${
                  ativo
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                {/* pílula indicadora deslizando */}
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-brand-500
                transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  ativo ? "h-6 w-1 opacity-100" : "h-0 w-1 opacity-0"
                }`}
                />
                <Icon
                  className={`size-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    ativo ? "scale-110" : ""
                  }`}
                  strokeWidth={1.8}
                />
                <span
                  className={`overflow-hidden whitespace-nowrap text-left transition-all duration-200 ${
                    mostraTexto ? "w-auto opacity-100 delay-75" : "w-0 opacity-0"
                  }`}
                >
                  {label}
                </span>
                {/* índice sutil no hover (estilo dashboard) */}
                {mostraTexto && (
                  <span className="ml-auto pr-1 text-[10px] font-semibold text-slate-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-slate-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Alternador no rodapé (somente desktop) */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="mx-3 mb-4 hidden items-center gap-3 rounded-xl px-2.5 py-2.5 text-slate-400
          transition-colors hover:bg-slate-100 hover:text-slate-600
          dark:hover:bg-white/5 dark:hover:text-slate-200 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" strokeWidth={1.8} />
          ) : (
            <>
              <PanelLeftClose className="size-5 shrink-0" strokeWidth={1.8} />
              <span className="whitespace-nowrap text-sm">Recolher</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}
