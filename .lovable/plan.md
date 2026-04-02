

# Ajuste na Aba Faturamento Mensal

## O que muda

A aba "Faturamento" atual tem apenas uma tabela simples e um card de média. Precisa adicionar:
1. Um gráfico de barras com valores acima das barras
2. Um bloco de aviso "IMPORTANTE" com texto explicativo
3. Melhorar o card de média com título correto
4. Manter a coluna "Faturamento (R$)" com label correto

## Alterações em `src/pages/Financeiro.tsx`

### Aba Faturamento (linhas 174-194)

Reestruturar para conter:

1. **Card "Média Faturamento Mensal (R$)"** — já existe, ajustar título para "Média Faturamento Mensal (R$)"

2. **Bloco de aviso** — Card amarelo/amber com:
   - Título: "IMPORTANTE"
   - Texto: "Faturamento: deverá ser preenchido com o valor do faturamento do mês, isso refletirá no cálculo do % Custo Fixo."

3. **Tabela** — manter como está, ajustar header para "Faturamento (R$)"

4. **Gráfico de barras** — usar Recharts (já instalado no projeto):
   - `BarChart` com eixo X = meses, eixo Y = faturamento
   - `LabelList` para mostrar valor em R$ acima de cada barra
   - Mostrar apenas meses com valor > 0 nas barras (todos os meses no eixo X)
   - Título "Faturamento Mensal" acima do gráfico

### Imports necessários
- Adicionar `BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList` de `recharts`
- Adicionar `AlertTriangle` de `lucide-react` (opcional, para o ícone do aviso)

## Arquivo afetado
- `src/pages/Financeiro.tsx` — apenas a seção `TabsContent value="faturamento"`

