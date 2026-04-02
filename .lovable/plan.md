

# Lucro Atual

## Resumo

Criar uma nova página "Lucro Atual" que mostra o diagnóstico de lucro/prejuízo de cada produto com ficha técnica, baseado no preço de venda praticado hoje.

## Alterações

### 1. `src/pages/LucroAtual.tsx` — Nova página

**Estrutura**: Tabela com linhas dinâmicas (adicionar/editar/excluir). Cada linha representa um produto em análise.

**Colunas da tabela:**
- **Item** — sequencial automático
- **Produto** — Select com `state.produtos` (somente produtos com ficha técnica/CMV > 0)
- **Valor de Venda Atual (R$)** — Input manual
- **DNA (%)** — Auto-preenchido com `dnaTotal` do contexto, não editável
- **Entrega (R$)** — Input manual (default 0)
- **CMV + Embalagem (R$)** — Auto-preenchido com `produto.cmv`, não editável
- **Lucro Atual (R$)** — Calculado: `vendaAtual - (vendaAtual × DNA/100) - entrega - cmv`
- **Lucro/Prejuízo Atual (%)** — Calculado: `(lucroAtual / vendaAtual) × 100`

**KPI/Resumo**: Card separado com "Média de Lucro/Prejuízo Atual (%)" — média dos percentuais de linhas com produto e valor de venda preenchidos.

**Validação visual**: Quando valor de venda é 0 ou vazio, exibir "-" nos campos calculados. Lucro negativo em vermelho, positivo em verde.

**Zebra-striping** nas linhas. Estado local para as linhas (produto selecionado, valor de venda, entrega).

### 2. `src/App.tsx` — Nova rota

Adicionar `/lucro-atual` → `<LucroAtual />`

### 3. `src/components/AppSidebar.tsx` — Novo item no menu

Adicionar "Lucro Atual" após "Ficha Técnica Produto", com ícone `TrendingUp` ou similar.

## Lógica de cálculo

```text
taxasDNA_reais = vendaAtual × (dnaTotal / 100)
lucroAtual     = vendaAtual - taxasDNA_reais - entrega - cmv
lucroPct       = (lucroAtual / vendaAtual) × 100
mediaPct       = média de lucroPct de todas as linhas válidas
```

## Arquivos afetados
- `src/pages/LucroAtual.tsx` (novo)
- `src/App.tsx` — nova rota
- `src/components/AppSidebar.tsx` — novo item menu

