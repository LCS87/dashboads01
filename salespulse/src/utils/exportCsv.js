/**
 * Export real de CSV (com BOM + separador ";" — abre direto no Excel pt-BR).
 * Respeita os filtros ativos de mês e equipe.
 */
export function exportVendasCsv(dataset, equipeFiltro, mesFiltro) {
  const nomes = new Map(dataset.consultores.map((c) => [c.id, c]));
  const prefixoMes = { Maio: "2026-05", Junho: "2026-06" };

  let rows = dataset.vendas;
  if (mesFiltro in prefixoMes)
    rows = rows.filter((v) => v.data.startsWith(prefixoMes[mesFiltro]));
  if (equipeFiltro !== "Todas")
    rows = rows.filter(
      (v) => nomes.get(v.consultorId)?.equipe === equipeFiltro
    );

  const header = "Data;Consultor;Equipe;Valor";
  const lines = rows.map((v) => {
    const c = nomes.get(v.consultorId) || {};
    return [
      v.data,
      c.nome ?? "",
      c.equipe ?? "",
      String(v.valor.toFixed(2)).replace(".", ","),
    ].join(";");
  });
  const csv = "\uFEFF" + [header, ...lines].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mare_de_vendas_${String(mesFiltro).toLowerCase()}_${String(
    equipeFiltro
  ).toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return rows.length;
}
