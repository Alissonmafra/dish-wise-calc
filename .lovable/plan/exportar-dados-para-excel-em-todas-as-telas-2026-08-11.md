# Exportar dados para Excel em todas as telas

Adicionar um botão "Exportar Excel" em cada tela do sistema, gerando um arquivo .xlsx com os dados já organizados em tabela (cabeçalho, colunas e formatação de moeda/percentual), exatamente como aparecem na tela.

## Como vai funcionar

- Cada tela ganha um botão "Exportar Excel" no topo (ao lado do título), com ícone de planilha.
- O clique baixa um arquivo .xlsx nomeado com a tela e a data, ex.: `Insumos_2026-08-11.xlsx`.
- O conteúdo exportado respeita filtros/pesquisa ativos na tela.
- Cabeçalhos em negrito, largura de coluna ajustada, valores numéricos exportados como número (com formato R$ ou %), não como texto — assim o Excel permite somar e filtrar.
- Telas com várias tabelas/abas (DRE Anual, Financeiro, Painel de Metas, Mini-DRE, Fichas Técnicas) exportam cada bloco em uma aba separada do mesmo arquivo.

## Telas cobertas

Dashboard, Financeiro, Insumos, Itens do Cardápio, Itens Manipulados, Ficha de Manipulação, Ficha de Produto, Fichas Técnicas, Precificação, Combos, Vendas do Dia, Ofertas, Lucro Atual, Fechamento de Caixa, DRE Anual, Painel de Metas, Mini-DRE, Diagnóstico e Painel Admin.

## Detalhes técnicos

- Adicionar a dependência `xlsx` (SheetJS) para geração no navegador.
- Criar `src/lib/exportExcel.ts` com helper `exportToExcel({ fileName, sheets })`, onde cada sheet é `{ name, columns: [{ header, key, type: 'text'|'currency'|'percent'|'number' }], rows }`. O helper aplica `numFmt` (`R$ #,##0.00`, `0.0%`), largura das colunas e cabeçalho em negrito.
- Criar `src/components/ExportExcelButton.tsx` (botão shadcn `variant="outline"`, ícone `FileSpreadsheet`, toast de sucesso/erro e aviso quando não há dados).
- Em cada página, montar o array de linhas a partir dos mesmos dados/derivações já usados na renderização (nenhuma mudança na lógica de cálculo) e passar ao botão.
