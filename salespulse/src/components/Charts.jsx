import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ---------- Tooltip premium (dark, rounded) ---------- */
function TipBox({ active, payload, label, fmt, dica }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:bg-slate-800/95">
      {label != null && <p className="mb-1 font-semibold text-white">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="font-medium text-slate-200">
          <span
            className="mr-2 inline-block size-2 rounded-full align-middle"
            style={{ background: p.color || p.payload?.fill }}
          />
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
      {dica && (
        <p className="mt-1.5 border-t border-white/10 pt-1.5 text-[10px] font-semibold text-brand-300">
          🖱️ clique para focar
        </p>
      )}
    </div>
  );
}

/* ---------- Painel base ---------- */
export function Panel({ title, sub, children, delay = 0, acao, className }) {
  return (
    <section
      className={`rise rounded-2xl border border-line bg-white p-5 dark:border-nightline dark:bg-nightcard ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          {sub && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {sub}
            </p>
          )}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

const AXIS = {
  stroke: "#64748b",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const fmtBRL = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

const coresMes = {
  Jan: "#1f6f78", Fev: "#3ba58d", Mar: "#b08d57",
  Abr: "#6366f1", Mai: "#8f6f3e", Jun: "#ec4899"
};

/* ---------- 1. Vendas acumuladas (área animada; responde ao foco) ---------- */
export function AcumuladoArea({ data, anim = true }) {
  return (
    <div className="h-[280px]">
      {data.length === 0 ? (
        <SemDados />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f6f78" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#1f6f78" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(128,132,152,0.18)"
              vertical={false}
            />
            <XAxis dataKey="dia" {...AXIS} interval="preserveStartEnd" />
            <YAxis {...AXIS} tickFormatter={fmtBRL} width={64} />
            <Tooltip
              content={<TipBox fmt={fmtBRL} />}
              cursor={{ stroke: "#1f6f78", strokeOpacity: 0.35 }}
            />
            <Area
              type="monotone"
              dataKey="acum"
              name="Acumulado"
              stroke="#1f6f78"
              strokeWidth={2.4}
              fill="url(#gradArea)"
              animationDuration={1200}
              animationEasing="ease-out"
              isAnimationActive={anim}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function SemDados() {
  return (
    <div className="grid h-full place-items-center">
      <p className="text-xs font-semibold text-slate-400">
        Nenhum dado no escopo atual · limpe o foco para voltar 👆
      </p>
    </div>
  );
}

/* ---------- 2. Ranking de consultores (clique = foco no consultor) ---------- */
export function RankingBars({ data, anim = true, foco, onFoco }) {
  const focadoConsultor = foco?.tipo === "consultor" ? foco.valor : null;
  return (
    <div className="h-[700px]">
      {data.length === 0 ? (
        <SemDados />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 16, right: 16, left: 8, bottom: 16 }}
          >
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(128,132,152,0.18)"
              horizontal={false}
            />
            <XAxis type="number" {...AXIS} tickFormatter={fmtBRL} />
            <YAxis
              type="category"
              dataKey="nome"
              width={100}
              {...AXIS}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip
              content={<TipBox fmt={fmtBRL} dica={!!onFoco} />}
              cursor={{ fill: "rgba(59,165,141,0.08)" }}
            />
            <Bar
              dataKey="total"
              name="Total"
              radius={[0, 6, 6, 0]}
              barSize={18}
              maxBarSize={22}
              animationDuration={1000}
              animationBegin={150}
              animationEasing="ease-out"
              isAnimationActive={anim}
              style={onFoco ? { cursor: "pointer" } : undefined}
              onClick={(d) =>
                d?.payload?.nome &&
                onFoco?.({ tipo: "consultor", valor: d.payload.nome })
              }
            >
              {data.map((d) => (
                <Cell
                  key={d.nome}
                  fill={
                    !focadoConsultor
                      ? "#1f6f78"
                      : focadoConsultor === d.nome
                        ? "#3ba58d"
                        : "rgba(31,111,120,0.22)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ---------- 3. Participação por equipe (clique = foco na equipe) ---------- */
const CORES = { Nathy: "#1f6f78", Gisele: "#3ba58d", Kalyne: "#b08d57" };

export function DonutEquipe({ data, total, anim = true, foco, onFoco }) {
  const focadaEquipe = foco?.tipo === "equipe" ? foco.valor : null;
  return (
    <div>
      <div className="relative h-[220px]">
        {data.length === 0 ? (
          <SemDados />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={(p) => (
                  <TipBox
                    {...p}
                    label={p?.payload?.name}
                    fmt={(v) =>
                      `${fmtBRL(v)} (${((v / Math.max(total, 1)) * 100).toFixed(1)}%)`
                    }
                    dica={!!onFoco}
                  />
                )}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={3}
                cornerRadius={6}
                animationDuration={1100}
                animationEasing="ease-out"
                isAnimationActive={anim}
                style={onFoco ? { cursor: "pointer" } : undefined}
                onClick={(entry) =>
                  entry?.name && onFoco?.({ tipo: "equipe", valor: entry.name })
                }
              >
                {data.map((d) => (
                  <Cell
                    key={d.name}
                    fill={CORES[d.name] || "#94a3b8"}
                    fillOpacity={
                      !focadaEquipe
                        ? 1
                        : focadaEquipe === d.name
                          ? 1
                          : 0.22
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="tnum text-2xl font-extrabold text-slate-900 dark:text-white">
              {fmtBRL(total)}
            </p>
            <p className="micro-label text-slate-500 dark:text-slate-400">
              total
            </p>
          </div>
        </div>
      </div>
      <div className="mt-1 flex justify-center gap-4">
        {data.map((d) => (
          <button
            key={d.name}
            onClick={() => onFoco?.({ tipo: "equipe", valor: d.name })}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
              focadaEquipe === d.name
                ? "bg-brand-500/10 font-bold text-brand-600 dark:text-brand-300"
                : "hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
            style={onFoco ? { cursor: "pointer" } : undefined}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: CORES[d.name] }}
            />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {d.name}
            </span>
            <span className="text-slate-400">
              {((d.value / Math.max(total, 1)) * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4. Vendas por semana (novo formato: todos os meses) ---------- */
export function SemanasBars({ data, anim = true, foco, onFoco }) {
  const focadaSemana = foco?.tipo === "semana" ? foco.valor : null;
  
  // Agrupa por mês para gráfico agrupado (consolidado) ou usa direto (mês único)
  const mesesUnicos = [...new Set(data.map(d => d.mes))].sort(
    (a, b) => ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].indexOf(a) - 
               ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].indexOf(b)
  );
  const ehConsolidado = mesesUnicos.length > 1;
  
  if (ehConsolidado) {
    // Gráfico agrupado: uma barra por mês para cada semana
    // Prepara dados: cada semana vira uma entrada com valores por mês
    const semanasUnicas = [...new Set(data.map(d => d.numSemana))].sort(
      (a, b) => Number(a.replace('S','')) - Number(b.replace('S',''))
    );
    
    const chartData = semanasUnicas.map(s => {
      const entry = { semana: s };
      for (const mes of mesesUnicos) {
        const d = data.find(x => x.numSemana === s && x.mes === mes);
        entry[mes] = d ? d.valor : 0;
      }
      return entry;
    });
    
    return (
      <div className="h-[240px]">
        {data.length === 0 ? <SemDados /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(128,132,152,0.18)" vertical={false} />
              <XAxis dataKey="semana" {...AXIS} tickFormatter={s => `S${s.replace('S','')}`} />
              <YAxis {...AXIS} width={44} tickFormatter={fmtIntTick} />
              <Tooltip content={<TipBox fmt={fmtBRL} dica={!!onFoco} />} cursor={{ fill: "rgba(59,165,141,0.08)" }} />
              {mesesUnicos.map((mes, idx) => (
                <Bar
                  key={mes}
                  dataKey={mes}
                  name={mes}
                  radius={[5, 5, 0, 0]}
                  barSize={14}
                  animationDuration={900}
                  animationBegin={idx * 100}
                  isAnimationActive={anim}
                  style={onFoco ? { cursor: "pointer" } : undefined}
                  onClick={(d) => d?.payload?.semana && onFoco?.({ tipo: "semana", valor: `${mes}-${d.payload.semana}` })}
                >
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={
                      focadaSemana === `${mes}-${d.semana}` ? coresMes[mes] : 
                      (focadaSemana && focadaSemana.startsWith(mes)) ? coresMes[mes] :
                      `${coresMes[mes]}33` // 20% opacity
                    } />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }
  
  // Mês único: barras simples por semana
  const chartData = data.map(d => ({ semana: d.numSemana, valor: d.valor }));
  const corMes = coresMes[mesesUnicos[0]] || "#1f6f78";
  
  return (
    <div className="h-[240px]">
      {data.length === 0 ? <SemDados /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(128,132,152,0.18)" vertical={false} />
            <XAxis dataKey="semana" {...AXIS} tickFormatter={s => `S${s.replace('S','')}`} />
            <YAxis {...AXIS} width={44} tickFormatter={fmtIntTick} />
            <Tooltip content={<TipBox fmt={fmtBRL} dica={!!onFoco} />} cursor={{ fill: `rgba(31,111,120,0.08)` }} />
            <Bar
              dataKey="valor"
              radius={[5, 5, 0, 0]}
              barSize={24}
              animationDuration={1000}
              animationEasing="ease-out"
              isAnimationActive={anim}
              style={onFoco ? { cursor: "pointer" } : undefined}
              onClick={(d) => d?.payload?.semana && onFoco?.({ tipo: "semana", valor: `${mesesUnicos[0]}-${d.payload.semana}` })}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={
                  focadaSemana === `${mesesUnicos[0]}-${d.semana}` ? corMes : 
                  `${corMes}33`
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function fmtIntTick(v) {
  return v.toLocaleString("pt-BR");
}

/* ---------- 5. Vendas por dia da semana (clique = foco no dia) ---------- */
export function DiaSemanaBars({ data, anim = true, foco, onFoco }) {
  const focadoDia = foco?.tipo === "dia" ? foco.valor : null;
  const max = data.length ? Math.max(...data.map((x) => x.total)) : 0;
  return (
    <div className="h-[280px]">
      {data.length === 0 ? (
        <SemDados />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(128,132,152,0.18)"
              vertical={false}
            />
            <XAxis dataKey="dia" {...AXIS} />
            <YAxis {...AXIS} width={48} tickFormatter={fmtIntTick} />
            <Tooltip
              content={<TipBox fmt={fmtBRL} dica={!!onFoco} />}
              cursor={{ fill: "rgba(59,165,141,0.08)" }}
            />
            <Bar
              dataKey="total"
              name="Vendido"
              radius={[5, 5, 0, 0]}
              barSize={24}
              animationDuration={1000}
              animationEasing="ease-out"
              isAnimationActive={anim}
              style={onFoco ? { cursor: "pointer" } : undefined}
              onClick={(d) =>
                d?.payload?.dia &&
                onFoco?.({ tipo: "dia", valor: d.payload.dia })
              }
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    focadoDia
                      ? focadoDia === d.dia
                        ? "#3ba58d"
                        : "rgba(31,111,120,0.22)"
                      : d.total === max && max > 0
                        ? "#3ba58d"
                        : "#1f6f78"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ---------- 6. Equipes × mês (dinâmico: todos os meses no escopo) ---------- */
export function EquipeMesBars({ data, anim = true, foco, onFoco }) {
  const focadaEquipe = foco?.tipo === "equipe" ? foco.valor : null;
  
  // Detecta meses disponíveis nos dados (exceto 'equipe')
  const mesesDisponiveis = data.length > 0 
    ? Object.keys(data[0]).filter(k => k !== "equipe").sort(
        (a, b) => ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].indexOf(a) - 
                   ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].indexOf(b)
      )
    : [];
  
  return (
    <div className="h-[240px]">
      {data.length === 0 || mesesDisponiveis.length === 0 ? (
        <SemDados />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(128,132,152,0.18)"
              vertical={false}
            />
            <XAxis dataKey="equipe" {...AXIS} />
            <YAxis {...AXIS} width={48} tickFormatter={fmtBRL} />
            <Tooltip
              content={<TipBox fmt={fmtBRL} dica={!!onFoco} />}
              cursor={{ fill: "rgba(59,165,141,0.08)" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "#64748b" }}
            />
            {mesesDisponiveis.map((mes, idx) => (
              <Bar
                key={mes}
                dataKey={mes}
                name={mes}
                radius={[5, 5, 0, 0]}
                barSize={Math.max(14, 22 / mesesDisponiveis.length)}
                animationDuration={900}
                animationBegin={idx * 100}
                isAnimationActive={anim}
                style={onFoco ? { cursor: "pointer" } : undefined}
                onClick={(d) =>
                  d?.payload?.equipe &&
                  onFoco?.({ tipo: "equipe", valor: d.payload.equipe })
                }
              >
                {data.map((d) => (
                  <Cell
                    key={d.equipe}
                    fill={
                      focadaEquipe === d.equipe
                        ? coresMes[mes] || "#1f6f78"
                        : `${coresMes[mes] || "#1f6f78"}33`
                    }
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ---------- 7. Meta × realizado por equipe (clique = foco na equipe) ---------- */
export function MetaRealizadoBars({ data, anim = true, foco, onFoco }) {
  const focadaEquipe = foco?.tipo === "equipe" ? foco.valor : null;
  return (
    <div className="h-[220px]">
      {data.length === 0 ? (
        <SemDados />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(128,132,152,0.18)"
              vertical={false}
            />
            <XAxis dataKey="equipe" {...AXIS} />
            <YAxis {...AXIS} width={48} tickFormatter={fmtBRL} />
            <Tooltip
              content={<TipBox fmt={fmtBRL} dica={!!onFoco} />}
              cursor={{ fill: "rgba(59,165,141,0.08)" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "#64748b" }}
            />
            <Bar
              dataKey="Meta"
              radius={[5, 5, 0, 0]}
              barSize={20}
              animationDuration={900}
              isAnimationActive={anim}
              style={onFoco ? { cursor: "pointer" } : undefined}
              onClick={(d) =>
                d?.payload?.equipe &&
                onFoco?.({ tipo: "equipe", valor: d.payload.equipe })
              }
            >
              {data.map((d) => (
                <Cell
                  key={"m" + d.equipe}
                  fill={
                    focadaEquipe
                      ? focadaEquipe === d.equipe
                        ? "#b08d57"
                        : "rgba(232,238,240,0.07)"
                      : "rgba(232,238,240,0.14)"
                  }
                />
              ))}
            </Bar>
            <Bar
              dataKey="Realizado"
              radius={[5, 5, 0, 0]}
              barSize={20}
              animationDuration={900}
              animationBegin={200}
              isAnimationActive={anim}
              style={onFoco ? { cursor: "pointer" } : undefined}
              onClick={(d) =>
                d?.payload?.equipe &&
                onFoco?.({ tipo: "equipe", valor: d.payload.equipe })
              }
            >
              {data.map((d) => (
                <Cell
                  key={"r" + d.equipe}
                  fill={
                    focadaEquipe
                      ? focadaEquipe === d.equipe
                        ? "#3ba58d"
                        : "rgba(31,111,120,0.22)"
                      : "#1f6f78"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
