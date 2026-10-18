import json, openpyxl, collections

# Lê o Excel consolidado recém-criado
path = r'C:\Users\lcost\Documents\Codigos\Projetos lv1\dashboads01\Maré_de_Vendas_Jan_Jun_2026.xlsx'
wb = openpyxl.load_workbook(path, read_only=True)

# Dim_Consultores
consultores = []
for r in list(wb['Dim_Consultores'].iter_rows(values_only=True))[1:]:
    consultores.append({'id': r[0], 'nome': r[1], 'equipe': r[2]})

# Fato_Vendas (todas as vendas)
vendas = []
for r in list(wb['Fato_Vendas'].iter_rows(values_only=True))[1:]:
    data = str(r[0]).split('T')[0][:10] if r[0] else ''
    vendas.append({'data': data, 'consultorId': r[1], 'valor': round(float(r[2]), 2)})

print(f'Lido do Excel: {len(consultores)} consultores, {len(vendas)} vendas')

# Verifica
por_mes = collections.defaultdict(float)
for v in vendas:
    por_mes[v['data'][:7]] += v['valor']
for m in sorted(por_mes):
    n = len([v for v in vendas if v['data'].startswith(m)])
    print(f'  {m}: R$ {por_mes[m]:,.2f}  ({n} transações)')

id2info = {c['id']: c['nome'] for c in consultores}
for nome in ('VALERIA', 'JOICE'):
    cid = [cid for cid, n in id2info.items() if n == nome][0]
    print(f'\n{nome}:')
    for m in sorted(por_mes):
        total = sum(v['valor'] for v in vendas if v['data'].startswith(m) and v['consultorId'] == cid)
        print(f'  {m}: R$ {total:,.2f}')

# Salva JSON limpo
out = {'consultores': consultores, 'vendas': vendas, 'metas': {'Nathy': 5200, 'Gisele': 5000, 'Kalyne': 5000}}
json.dump(out, open(r'C:\Users\lcost\Documents\Codigos\Projetos lv1\dashboads01\salespulse\src\data.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\n✅ JSON do dashboard atualizado a partir do Excel consolidado')