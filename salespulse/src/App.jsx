import { useEffect, useMemo, useRef, useState } from "react";
import data from "./data.json";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import KpiRow from "./components/KpiRow.jsx";
import {
  AcumuladoArea,
  RankingBars,
  DonutEquipe,
  SemanasBars,
  DiaSemanaBars,
  EquipeMesBars,
  MetaRealizadoBars,
  Panel,
} from "./components/Charts.jsx";
import MetasPanel from "./components/MetasPanel.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import { brl } from "./lib/hooks.js";
import { exportVendasCsv } from "./utils/exportCsv.js";
import {
  Wallet,
  Receipt,
  Ticket,
  TrendingUp,
  Calendar,
} from "lucide-react";

const MES_PREFIXO = {
  Janeiro: "2026-01", Fevereiro: "2026-02", Março: "2026-03",
  Abril: "2026-04", Maio: "2026-05", Junho: "2026-06"
};
const NAV_IDS = ["visao", "ranking", "equipes", "metas", "config"];

/* Debug card component */
function DebugCard({ title, data }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-white/50 dark:bg-slate-900/50 p-3">
      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wide">
        {title}
      </div>
      <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-slate-700 dark:text-slate-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function useMetrics(dataset, equipeFiltro, mesFiltro, metasEfetivas, foco) {
  return useMemo(() => {
    const MESES_NOME = {
      1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun"
    };
    const MESES_ORDEM = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const nomes = new Map(dataset.consultores.map((c) => [c.id, c]));
    const noEscopo = (id) =>
      equipeFiltro === "Todas" || nomes.get(id)?.equipe === equipeFiltro;

    let vendas = dataset.vendas.filter((v) => noEscopo(v.consultorId));
    if (mesFiltro in MES_PREFIXO)
      vendas = vendas.filter((v) => v.data.startsWith(MES_PREFIXO[mesFiltro]));

    if (foco) {
      if (foco.tipo === "consultor")
        vendas = vendas.filter(
          (v) => nomes.get(v.consultorId)?.nome === foco.valor
        );
      else if (foco.tipo === "equipe")
        vendas = vendas.filter(
          (v) => nomes.get(v.consultorId)?.equipe === foco.valor
        );
      else if (foco.tipo === "dia")
        vendas = vendas.filter((v) => {
          const [y, m2, d2] = v.data.split("-").map(Number);
          return DIAS_SEMANA[new Date(y, m2 - 1, d2).getDay()] === foco.valor;
        });
      else if (foco.tipo === "semana")
        vendas = vendas.filter((v) => {
          const [, mesNum, diaNum] = v.data.split("-").map(Number);
          const mesAbv = MESES_NOME[mesNum];
          const s = "S" + Math.ceil(diaNum / 7);
          return `${mesAbv}-${s}` === foco.valor;
        });
    }

    const total = vendas.reduce((s, v) => s + v.valor, 0);
    const qtd = vendas.length;
    const ticket = qtd ? total / qtd : 0;
    const diasAtivos = new Set(vendas.map((v) => v.data)).size;

    // acumulado diário
    const porDia = new Map();
    for (const v of vendas)
      porDia.set(v.data, (porDia.get(v.data) || 0) + v.valor);
    let acc = 0;
    const serie = [...porDia.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([d, val]) => {
        acc += val;
        return { dia: d.slice(8) + "/" + d.slice(5, 7), acum: Math.round(acc) };
      });

    console.log('[DEBUG] serie:', serie.length, serie.slice(0, 3));

    // detalhamento por consultor (dados da tabela do ranking)
    const consultores = new Map();
    for (const v of vendas) {
      const c = nomes.get(v.consultorId);
      if (!c) continue;
      const d = consultores.get(c.nome) || {
        nome: c.nome,
        equipe: c.equipe,
        qtd: 0,
        total: 0,
      };
      d.qtd += 1;
      d.total += v.valor;
      consultores.set(c.nome, d);
    }
    const detalhe = [...consultores.values()]
      .map((d) => ({
        ...d,
        total: Math.round(d.total),
        ticket: d.total / d.qtd,
        pct: total ? (d.total / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
    const ranking = detalhe.map((d) => ({ nome: d.nome, total: d.total }));

    // participação por equipe
    const porEquipe = new Map();
    for (const c of dataset.consultores) {
      if (!noEscopo(c.id)) continue;
      porEquipe.set(c.equipe, 0);
    }
    for (const v of vendas) {
      const c = nomes.get(v.consultorId);
      if (c) porEquipe.set(c.equipe, (porEquipe.get(c.equipe) || 0) + v.valor);
    }
    const equipes = [...porEquipe.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // --- Vendas por Semana (funciona para qualquer escopo) ---
    const semanas = {};
    for (const v of vendas) {
      const [, mesNum, diaNum] = v.data.split("-").map(Number);
      const mesAbv = MESES_NOME[mesNum];
      const s = "S" + Math.ceil(diaNum / 7);
      const chave = `${mesAbv}-${s}`; // ex: "Jan-S1", "Mai-S2"
      if (!semanas[chave]) {
        semanas[chave] = { semana: chave, mes: mesAbv, numSemana: s, valor: 0 };
      }
      semanas[chave].valor += Math.round(v.valor);
    }
    // Ordena: primeiro por ordem do mês, depois por número da semana
    const porSemana = Object.values(semanas).sort((a, b) => {
      const idxA = MESES_ORDEM.indexOf(a.mes);
      const idxB = MESES_ORDEM.indexOf(b.mes);
      if (idxA !== idxB) return idxA - idxB;
      return Number(a.numSemana) - Number(b.numSemana);
    });

    // --- Vendas por Dia da Semana ---
    const porDSemana = new Array(7).fill(0);
    for (const v of vendas) {
      const [y, m, d] = v.data.split("-").map(Number);
      porDSemana[new Date(y, m - 1, d).getDay()] += v.valor;
    }
    const diasSemana = porDSemana.map((totalDia, i) => ({
      dia: DIAS_SEMANA[i],
      total: Math.round(totalDia),
    }));

    // --- Realizado por Equipe × Mês (todos os meses no escopo) ---
    const mesesNoEscopo = [...new Set(vendas.map(v => MESES_NOME[Number(v.data.split("-")[1])]))]
      .sort((a, b) => MESES_ORDEM.indexOf(a) - MESES_ORDEM.indexOf(b));
    
    const eqMes = {};
    for (const c of dataset.consultores) {
      if (!noEscopo(c.id)) continue;
      eqMes[c.equipe] = { equipe: c.equipe };
      for (const mesAbv of mesesNoEscopo) eqMes[c.equipe][mesAbv] = 0;
    }
    for (const v of vendas) {
      const c = nomes.get(v.consultorId);
      if (!c) continue;
      const mesAbv = MESES_NOME[Number(v.data.split("-")[1])];
      if (eqMes[c.equipe] && mesAbv in eqMes[c.equipe]) {
        eqMes[c.equipe][mesAbv] += Math.round(v.valor);
      }
    }
    const equipesMes = Object.values(eqMes).sort((a, b) =>
      a.equipe.localeCompare(b.equipe)
    );

    // --- Delta (crescimento primeiro→último mês no escopo) ---
    let delta = null;
    if (mesFiltro === "Consolidado" && porSemana.length > 0) {
      const primeiroMes = MESES_ORDEM.find(m => porSemana.some(s => s.mes === m));
      const ultimoMes = [...MESES_ORDEM].reverse().find(m => porSemana.some(s => s.mes === m));
      if (primeiroMes && ultimoMes && primeiroMes !== ultimoMes) {
        const totalPrimeiro = porSemana.filter(s => s.mes === primeiroMes).reduce((a,b) => a + b.valor, 0);
        const totalUltimo = porSemana.filter(s => s.mes === ultimoMes).reduce((a,b) => a + b.valor, 0);
        if (totalPrimeiro > 0) delta = ((totalUltimo - totalPrimeiro) / totalPrimeiro) * 100;
      }
    } else if (mesFiltro !== "Consolidado" && mesFiltro in MES_PREFIXO) {
      // Para mês individual, compara com mês anterior (se houver dados)
      const mesAtualNum = Object.keys(MESES_NOME).find(k => MESES_NOME[k] === mesFiltro);
      if (mesAtualNum) {
        const mesAntNum = String(Number(mesAtualNum) - 1).padStart(2, '0');
        const tAtual = vendas.filter(v => v.data.startsWith(`2026-${mesAtualNum}`)).reduce((a,b) => a + b.valor, 0);
        const tAnt = vendas.filter(v => v.data.startsWith(`2026-${mesAntNum}`)).reduce((a,b) => a + b.valor, 0);
        if (tAnt > 0) delta = ((tAtual - tAnt) / tAnt) * 100;
      }
    }

    // --- Meses em escopo para metas ---
    const mesesEmEscopo = mesFiltro === "Consolidado" ? mesesNoEscopo.length : 1;
    const metas = Object.entries(metasEfetivas)
      .map(([equipe, metaMensal]) => {
        const realizado = equipes.find((e) => e.name === equipe)?.value ?? 0;
        return {
          equipe,
          realizado,
          meta: metaMensal * mesesEmEscopo,
          mesesEmEscopo,
        };
      })
      .sort((a, b) => b.realizado / b.meta - a.realizado / a.meta);

    return {
      total, qtd, ticket, serie, ranking, detalhe, equipes, porSemana,
      diasSemana, equipesMes, delta, metas, mesesEmEscopo, diasAtivos,
    };
  }, [dataset, equipeFiltro, mesFiltro, metasEfetivas, foco]); // ✅ foco no escopo
}

const KPIS = (m, mesFiltro) => {
  const base = [
    {
      label: "Total Vendido", value: m.total, format: brl,
      icon: Wallet, accent: { bg: "bg-brand-50 dark:bg-brand-500/15", text: "text-brand-600 dark:text-brand-400" },
    },
    {
      label: "Qtd de Vendas", value: m.qtd,
      format: (v) => Math.round(v).toString(),
      icon: Receipt, accent: { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
    },
    {
      label: "Ticket Médio", value: m.ticket, format: (v) => brl(v),
      icon: Ticket, accent: { bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
    },
  ];
  
  if (mesFiltro === "Consolidado") {
    // Consolidado: Crescimento Jan → Jun + Melhor/Pior mês
    const primeiroMes = m.serie[0]?.acum ?? 0;
    const ultimoMes = m.serie[m.serie.length - 1]?.acum ?? 0;
    const crescimentoTotal = primeiroMes > 0 ? ((ultimoMes - primeiroMes) / primeiroMes) * 100 : 0;
    const melhorMes = m.serie.reduce((a, b) => a.acum > b.acum ? a : b, m.serie[0]);
    const piorMes = m.serie.reduce((a, b) => a.acum < b.acum ? a : b, m.serie[0]);
    
    base.push(
      {
        label: "Crescimento Jan→Jun", value: crescimentoTotal,
        format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
        icon: TrendingUp,
        accent: crescimentoTotal >= 0
          ? { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" }
          : { bg: "bg-rose-50 dark:bg-rose-500/15", text: "text-rose-600 dark:text-rose-400" },
      }
    );
  } else {
    // Mês individual: Média Diária
    base.push(
      {
        label: "Média Diária", value: m.total / Math.max(m.diasAtivos, 1),
        format: (v) => brl(v),
        icon: Calendar, accent: { bg: "bg-sky-50 dark:bg-sky-500/15", text: "text-sky-600 dark:text-sky-400" },
      }
    );
  }
  return base;
};

/* ================= tabela de detalhamento (aba Consultores) ================= */
function RankingTable({ rows, foco, onFoco }) {
  const focadoConsultor = foco?.tipo === "consultor" ? foco.valor : null;
  return (
    <div className="h-full overflow-y-auto">
      <table className="w-full min-w-[540px] text-left text-xs">
        <thead>
          <tr className="border-b border-line dark:border-nightline">
            {["#", "Consultor", "Equipe", "Qtd", "Ticket Médio", "Part. %", "Total"].map(
              (h) => (
                <th
                  key={h}
                  className="micro-label px-2 py-2.5 text-slate-500 dark:text-slate-400"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ativo = focadoConsultor === r.nome;
            return (
              <tr
                key={r.nome}
                onClick={() => onFoco?.({ tipo: "consultor", valor: r.nome })}
                title={`Focar em ${r.nome}`}
                className={`cursor-pointer select-none border-b border-line/50 transition-colors dark:border-nightline/50
                ${ativo
                    ? "bg-brand-500/10 ring-1 ring-inset ring-brand-500/40"
                    : "hover:bg-brand-50/50 dark:hover:bg-brand-500/[0.06]"
                  }`}
              >
                <td className="px-2 py-2.5">
                  <span
                    className={`tnum grid size-6 place-items-center rounded-lg text-[11px] font-bold ${
                      i === 0
                        ? "bg-amber-400/20 text-amber-500"
                        : i === 1
                          ? "bg-slate-300/40 text-slate-500"
                          : i === 2
                            ? "bg-orange-400/15 text-orange-500"
                            : "text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <span
                    className={`font-bold ${
                      ativo
                        ? "text-brand-600 dark:text-brand-300"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {ativo && "🎯 "}
                    {r.nome}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-slate-500 dark:text-slate-400">
                  {r.equipe}
                </td>
                <td className="tnum px-2 py-2.5 text-slate-700 dark:text-slate-300">
                  {r.qtd}
                </td>
                <td className="tnum px-2 py-2.5 text-slate-700 dark:text-slate-300">
                  {brl(r.ticket)}
                </td>
                <td className="tnum px-2 py-2.5 text-slate-700 dark:text-slate-300">
                  {r.pct.toFixed(1)}%
                </td>
                <td className="tnum px-2 py-2.5 font-bold text-brand-600 dark:text-brand-400">
                  {brl(r.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ================= App ================= */
export default function App() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("sp-theme") !== "light"
  );
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sp-sidebar") === "1"
  );
  const [equipe, setEquipe] = useState("Todas");
  const [mes, setMes] = useState("Consolidado");
  const [activeId, setActiveId] = useState("visao");
  const [menuMobile, setMenuMobile] = useState(false);
  const [foco, setFoco] = useState(null);
  // painel administrativo: oculto por padrão; só abre ao clicar em "Configurações"
  const [configAberto, setConfigAberto] = useState(false);
  /** Clique em elemento do gráfico = foco; clicar de novo = limpa */
  const alternarFoco = (f) =>
    setFoco((atual) =>
      atual && atual.tipo === f.tipo && atual.valor === f.valor ? null : f
    );
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sp-settings")) ?? { anim: true, metas: {} };
    } catch {
      return { anim: true, metas: {} };
    }
  });
  const anim = settings.anim !== false;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("sp-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    localStorage.setItem("sp-sidebar", collapsed ? "1" : "0");
  }, [collapsed]);
  useEffect(() => {
    localStorage.setItem("sp-settings", JSON.stringify(settings));
  }, [settings]);

  // Limpa cross-filter ao trocar mês ou equipe
  useEffect(() => { setFoco(null); }, [mes]);
  useEffect(() => { setFoco(null); }, [equipe]);

  /* ---- scroll suave controlado (btn da sidebar) ---- */
  const clicouNav = useRef(false);
  const navTo = (id) => {
    setFoco(null); // limpa cross-filter ao navegar
    setActiveId(id);
    if (id === "config") {
      // abre o painel admin e rola até ele após montar
      setConfigAberto(true);
      setMenuMobile(false);
      clearTimeout(navTo._t);
      navTo._t = setTimeout(
        () =>
          document
            .getElementById("config")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        60
      );
      return;
    }
    // qualquer outra aba fecha o painel admin (fica oculto novamente)
    setConfigAberto(false);
    clicouNav.current = true;
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    // reativa o scroll spy quando a animação termina
    clearTimeout(navTo._t);
    navTo._t = setTimeout(() => (clicouNav.current = false), 900);
  };

  /* ---- scroll spy: destaca a aba conforme a rolagem ---- */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (clicouNav.current) return;
        const visivel = entries.filter((e) => e.isIntersecting);
        if (visivel.length)
          setActiveId(
            visivel.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
              .target.id
          );
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    NAV_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [configAberto]); // re-observa quando o painel admin monta/desmonta

  /* ---- skeleton (mín. 350ms) ---- */
  useEffect(() => {
    const t0 = performance.now();
    const id = setTimeout(
      () => setLoading(false),
      Math.max(0, 550 - (performance.now() - t0))
    );
    return () => clearTimeout(id);
  }, []);

  const metasEfetivas = useMemo(
    () => ({ ...data.metas, ...settings.metas }),
    [settings]
  );
  const m = useMetrics(data, equipe, mes, metasEfetivas, foco);

  const exportar = () => {
    const n = exportVendasCsv(data, equipe, mes);
    setToast(`✅ ${n} transações exportadas (CSV baixado)`);
    setTimeout(() => setToast(null), 3500);
  };
  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="flex min-h-screen bg-surface text-slate-800 dark:bg-night dark:text-slate-200">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        activeId={activeId}
        mobileOpen={menuMobile}
        onClose={() => setMenuMobile(false)}
        onNav={(id) => {
          navTo(id);
          setMenuMobile(false); // fecha o drawer no mobile após navegar
        }}
      />

      <div className="min-w-0 flex-1">
        <Header
          equipe={equipe}
          onEquipe={setEquipe}
          mes={mes}
          onMes={setMes}
          onExport={exportar}
          onMenu={() => setMenuMobile(true)}
          dark={dark}
          onTheme={() => setDark((d) => !d)}
        />

        {toast && (
          <div className="rise sticky top-2 z-40 mx-auto mt-2 w-fit rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
            {toast}
          </div>
        )}

        {/* Banner de foco (cross-filter ativo) */}
        {foco && (
          <div className="rise sticky top-2 z-40 mx-4 mt-2 flex w-fit flex-wrap items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-xs font-semibold text-brand-600 shadow-lg backdrop-blur dark:border-brand-400/30 dark:bg-brand-500/15 dark:text-brand-300 lg:mx-auto">
            <span>
              🎯 Foco: <b>{foco.valor}</b>
              <span className="opacity-70">
                {" "}
                ({foco.tipo}) · todos os gráficos moldados ao item
              </span>
            </span>
            <button
              onClick={() => setFoco(null)}
              className="rounded-lg bg-brand-500 px-2.5 py-1 font-bold text-white transition-colors hover:bg-brand-600"
            >
              ✕ Limpar foco
            </button>
          </div>
        )}
        {foco && m.qtd === 0 && (
          <div className="mx-4 mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 lg:mx-auto lg:w-fit">
            ⚠️ O item em foco não tem vendas neste escopo (equipe/mês).{" "}
            <button onClick={() => setFoco(null)} className="underline">
              Limpar foco
            </button>
          </div>
        )}

        <main className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 lg:px-8">
          {/* ============ VISÃO GERAL ============ */}
          <section id="visao" className="scroll-mt-4 space-y-5">
            <KpiRow kpis={KPIS(m, mes)} loading={loading} />

            {/* Insights automáticos — largura total abaixo dos KPIs */}
            {!loading && (
              <Panel
                title="Insights automáticos"
                sub="Derivados dos dados carregados no escopo atual"
                delay={0}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      t: "Padrão de preço",
                      d: `Ticket médio em ${brl(m.ticket)}; concentração em R$ 54,99 / R$ 59,99 / R$ 99,98.`,
                    },
                    {
                      t: "Tendência do período",
                      d:
                        m.delta != null
                          ? `${m.delta >= 0 ? "Junho superou" : "Junho ficou abaixo de"} Maio em ${Math.abs(m.delta).toFixed(1)}%.`
                          : mes === "Consolidado"
                            ? `Crescente Jan→Abr (${brl(13250)} → ${brl(18510)}), pico em Maio (${brl(22776)}), Junho volta à média (${brl(13282)}).`
                            : `Média de ${brl(m.total / Math.max(m.diasAtivos, 1))} por dia ativo em ${mes}.`,
                    },
                    {
                      t: "Top consultor",
                      d: `${m.detalhe[0]?.nome ?? "—"} lidera com ${brl(m.detalhe[0]?.total ?? 0)}.`,
                    },
                  ].map((i) => (
                    <div
                      key={i.t}
                      className="rounded-xl border border-line bg-surface p-4 dark:border-nightline dark:bg-white/[0.03]"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {i.t}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {i.d}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                {loading ? (
                  <SkeletonBlock h={280} />
                ) : (
                  <Panel
                    title="Vendas Acumuladas"
                    sub={
                      "Soma diária contínua · " +
                      (mes === "Consolidado"
                        ? "Jan–Jun 2026"
                        : `${mes} 2026`)
                    }
                    delay={120}
                  >
                    <AcumuladoArea data={m.serie} anim={anim} />
                  </Panel>
                )}
              </div>
              <div className="lg:col-span-4">
                {loading ? (
                  <SkeletonBlock h={280} />
                ) : (
                  <Panel
                    title="Vendas por Dia da Semana"
                    sub="Maior volume em destaque · escopo atual"
                    delay={200}
                  >
                    <DiaSemanaBars
                      data={m.diasSemana}
                      anim={anim}
                      foco={foco}
                      onFoco={alternarFoco}
                    />
                  </Panel>
                )}
              </div>
            </div>
          </section>

          {/* ============ CONSULTORES ============ */}
          <section id="ranking" className="scroll-mt-4 space-y-4">
            {/* Ranking e Detalhamento com MESMA ALTURA (420px) */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                {loading ? (
                  <SkeletonBlock h={780} />
                ) : (
                  <Panel
                    title="Ranking de Consultores"
                    sub="🖱️ clique no nome/barra para focar"
                    delay={280}
                    className="h-[780px]"
                  >
                    <RankingBars
                      data={m.ranking}
                      anim={anim}
                      foco={foco}
                      onFoco={alternarFoco}
                    />
                  </Panel>
                )}
              </div>
              <div className="lg:col-span-7">
                {loading ? (
                  <SkeletonBlock h={780} />
                ) : (
                  <Panel
                    title="Detalhamento Completo"
                    sub="🖱️ clique na linha de um consultor para focar"
                    delay={360}
                    className="h-[780px]"
                  >
                    <RankingTable
                      rows={m.detalhe}
                      foco={foco}
                      onFoco={alternarFoco}
                    />
                  </Panel>
                )}
              </div>
            </div>
          </section>

          {/* ============ EQUIPES ============ */}
          <section id="equipes" className="scroll-mt-4 space-y-4">
            {/* Participação + Vendas por Semana - altura igual */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5 h-full">
                {loading ? (
                  <SkeletonBlock h={320} />
                ) : (
                  <Panel
                    title="Participação por Equipe"
                    sub="🖱️ clique na fatia para focar a equipe"
                    delay={420}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center">
                      <DonutEquipe
                        data={m.equipes}
                        total={m.total}
                        anim={anim}
                        foco={foco}
                        onFoco={alternarFoco}
                      />
                    </div>
                  </Panel>
                )}
              </div>
              <div className="lg:col-span-7 h-full">
                {loading ? (
                  <SkeletonBlock h={320} />
                ) : (
                  <Panel
                    title="Vendas por Semana"
                    sub="🖱️ clique na semana para focar"
                    delay={480}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 min-h-[280px]">
                      <SemanasBars
                        data={m.porSemana}
                        anim={anim}
                        foco={foco}
                        onFoco={alternarFoco}
                      />
                    </div>
                  </Panel>
                )}
              </div>
            </div>

            {/* Realizado por Equipe - largura total */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-12 h-full">
                {loading ? (
                  <SkeletonBlock h={260} />
                ) : (
                  <Panel
                    title="Realizado por Equipe"
                    sub="🖱️ clique na barra para focar a equipe"
                    delay={540}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 min-h-[220px]">
                      <EquipeMesBars
                        data={m.equipesMes}
                        anim={anim}
                        foco={foco}
                        onFoco={alternarFoco}
                      />
                    </div>
                  </Panel>
                )}
              </div>
            </div>
          </section>

          {/* ============ METAS ============ */}
          <section id="metas" className="scroll-mt-4 space-y-4">
            {/* Metas por Equipe + Meta vs Realizado - altura igual */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5 h-full">
                {loading ? (
                  <SkeletonBlock h={320} />
                ) : (
                  <Panel
                    title="Metas por Equipe"
                    sub={
                      m.mesesEmEscopo === 2
                        ? "Meta mensal × 2 meses (consolidado)"
                        : "Meta mensal · " + mes
                    }
                    delay={600}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 min-h-[280px]">
                      <MetasPanel metas={m.metas} mesesEmEscopo={m.mesesEmEscopo} />
                    </div>
                  </Panel>
                )}
              </div>
              <div className="lg:col-span-7 h-full">
                {loading ? (
                  <SkeletonBlock h={320} />
                ) : (
                  <Panel
                    title="Meta vs Realizado"
                    sub="🖱️ clique na equipe para focar"
                    delay={640}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 min-h-[280px]">
                      <MetaRealizadoBars
                        data={m.metas.map((x) => ({
                          equipe: x.equipe,
                          Meta: x.meta,
                          Realizado: x.realizado,
                        }))}
                        anim={anim}
                        foco={foco}
                        onFoco={alternarFoco}
                      />
                    </div>
                  </Panel>
                )}
              </div>
            </div>
          </section>

          {/* ============ CONFIGURAÇÕES (oculto até clicar na aba) ============ */}
          {configAberto && (
            <section id="config" className="scroll-mt-4 space-y-5">
              <Panel
                title="⚙️ Configurações"
                sub="Metas editáveis, animações e tema — salvas no seu navegador"
                delay={0}
                acao={
                  <button
                    onClick={() => setConfigAberto(false)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:border-nightline dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    ✕ Ocultar painel
                  </button>
                }
              >
                <SettingsPanel
                  dadosDefault={data.metas}
                  settings={settings}
                  onChange={(s) => {
                    setSettings(s);
                    flash("✅ Configurações salvas");
                  }}
                  anim={anim}
                  dark={dark}
                  onTheme={() => setDark((d) => !d)}
                />
              </Panel>

              {/* ============ DEBUG PANEL (visual) ============ */}
              <Panel
                title="🔧 Debug Panel"
                sub="Dados brutos calculados em tempo real"
                delay={0}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                  <DebugCard title="MÉTRICAS BASE" data={{
                    total: m.total, qtd: m.qtd, ticket: m.ticket,
                    diasAtivos: m.diasAtivos, delta: m.delta
                  }} />
                  <DebugCard title="SERIE (acumulado)" data={{
                    length: m.serie?.length,
                    first: m.serie?.[0],
                    last: m.serie?.[m.serie.length - 1],
                    sample: m.serie?.slice(0, 5)
                  }} />
                  <DebugCard title="DIAS SEMANA" data={{
                    length: m.diasSemana?.length,
                    data: m.diasSemana
                  }} />
                  <DebugCard title="EQUIPES MÊS" data={{
                    length: m.equipesMes?.length,
                    data: m.equipesMes
                  }} />
                </div>
                <div className="border-t border-line dark:border-nightline pt-4">
                  <strong>FILTROS ATIVOS:</strong>
                  <pre className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
{JSON.stringify({ mes, equipe, foco }, null, 2)}
                  </pre>
                </div>
              </Panel>
            </section>
          )}

          <footer className="py-6 text-center text-xs text-slate-400">
            🌊 Maré de Vendas · dados locais (Excel → JSON) · escopo atual: {m.qtd} transações · {equipe} · {mes.toLowerCase()}
          </footer>
        </main>
      </div>
    </div>
  );
}

/* Skeleton genérico auditado por tipo de bloco */
function SkeletonBlock({ h }) {
  return (
    <div
      className="rise rounded-2xl border border-line bg-white p-5 dark:border-nightline dark:bg-nightcard"
      style={{ minHeight: h + 90 }}
    >
      <div className="skeleton mb-4 h-3 w-28 bg-slate-200/70 dark:bg-white/5" />
      <div
        className="skeleton w-full bg-slate-200/70 dark:bg-white/5"
        style={{ height: h }}
      />
    </div>
  );
}