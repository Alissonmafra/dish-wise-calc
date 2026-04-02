

# Ficha Técnica do Produto (Cardápio)

## Resumo

Criar uma nova página dedicada para montar fichas técnicas dos produtos do cardápio, permitindo combinar insumos simples e receitas manipuladas com cálculo automático de custo. A página substituirá a aba "Produtos do Cardápio" da tela genérica `FichasTecnicas.tsx`.

## Alterações

### 1. `src/pages/FichaProduto.tsx` — Nova página

**Layout por produto**: Cada ficha como um card individual (similar à referência), com:

**Cabeçalho:**
- **Item do Cardápio**: Select puxando de `state.itensCardapio`
- **Quantidade Produzida**: Input numérico (default 1)
- **Custo do Produto (R$)**: Calculado automaticamente, não editável

**Tabela de composição:**
- Item (sequencial)
- Insumos (select unificado: insumos do cadastro + receitas manipuladas, agrupados)
- Unidade de Medida (auto-preenchida conforme origem, não editável)
- Quantidade (manual)
- Preço R$ (calculado: quantidade × custo unitário da origem)

**Seleção de insumos**: O select combina `state.insumos` e `state.receitas` num único dropdown, com prefixo ou grupo para distinguir tipo. Ao selecionar, o sistema identifica se é `tipo: 'insumo'` ou `tipo: 'receita'` e preenche a unidade automaticamente.

**KPI Card**: "Total de Fichas Cadastradas" com contagem.

**Validação ao salvar**:
- Item do cardápio obrigatório
- Quantidade produzida > 0
- Pelo menos 1 item na composição

**Zebra-striping** nas linhas da tabela.

**Custo unitário por linha**:
- Insumo: `quantidade × insumo.custoPorUnidade`
- Receita manipulada: `quantidade × receita.custoPorUnidade`

### 2. `src/App.tsx` — Nova rota

Adicionar `/ficha-produto` → `<FichaProduto />`

### 3. `src/components/AppSidebar.tsx` — Atualizar menu

Renomear "Fichas Técnicas" para "Ficha Técnica Produto" e apontar para `/ficha-produto`. Usar a rota da nova página.

### 4. Sem alterações em tipos ou contexto

- `ProdutoCardapio`, `ProdutoIngrediente` já existem com `tipo: 'insumo' | 'receita'`
- `SET_PRODUTOS` e `computeProdutoCMV` já existem no AppContext
- A lógica de cascata (insumo → receita → produto → combo) já funciona
- O campo `custoEmbalagem` do tipo será mantido (pode ser incorporado como linha de insumo embalagem na ficha)

## Arquivos afetados
- `src/pages/FichaProduto.tsx` (novo)
- `src/App.tsx` — nova rota
- `src/components/AppSidebar.tsx` — atualizar item menu

