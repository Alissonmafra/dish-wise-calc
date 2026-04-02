

# Ficha Técnica de Manipulação

## Resumo

Criar uma nova página dedicada exclusivamente às fichas técnicas de receitas manipuladas, separada da tela genérica atual `FichasTecnicas.tsx`. A página permitirá montar a composição de cada receita base com cálculos automáticos de custo.

## Abordagem

A tela atual `FichasTecnicas.tsx` mistura receitas e produtos em abas. A nova tela será independente, focada apenas em receitas manipuladas, com interface alinhada à imagem de referência (cabeçalho com nome/quantidade/medida/custo + tabela de insumos).

Os dados já existem no estado global (`state.receitas` do tipo `ReceitaManipulacao[]`) e a lógica de cálculo em cascata já funciona no `AppContext`.

## Alterações

### 1. `src/pages/FichaManipulacao.tsx` — Nova página

**Cabeçalho da ficha (por receita):**
- **Nome da Receita**: Select puxando de `state.itensManipulados` (não digitação livre)
- **Quantidade Produzida**: Input numérico manual
- **Medida**: Select com Gramas/Mililitros/Unidade
- **Custo da Receita (R$)**: Calculado automaticamente (soma das linhas), não editável

**Tabela de insumos (por receita):**
- Item (sequencial)
- Insumos (select puxando de `state.insumos`)
- Unidade de Medida (auto-preenchida do insumo selecionado, não editável)
- Quantidade (input manual)
- Preço R$ (calculado: quantidade × custoPorUnidade do insumo, não editável)

**Layout**: Exibir cada receita como um card individual (similar à imagem de referência — formulário de cabeçalho + tabela). Botão para criar nova ficha. Zebra-striping nas linhas.

**Validação ao salvar**:
- Nome da receita obrigatório
- Quantidade produzida > 0
- Medida obrigatória
- Pelo menos 1 insumo adicionado
- Toast de erro para campos faltantes

**Cálculos automáticos (já existentes no AppContext)**:
- `custoTotal` = soma de (quantidade × custoPorUnidade) de cada ingrediente
- `custoPorUnidade` = custoTotal / quantidadeProduzida
- Recálculo em cascata quando insumos mudam

### 2. `src/App.tsx` — Nova rota

Adicionar `/ficha-manipulacao` → `<FichaManipulacao />`

### 3. `src/components/AppSidebar.tsx` — Novo item no menu

Adicionar "Ficha Técnica Manipulação" posicionado após "Insumos", antes de "Fichas Técnicas" existente.

### 4. Sem alterações em tipos ou contexto

- `ReceitaManipulacao` e `ReceitaIngrediente` já existem nos tipos
- `SET_RECEITAS` e `computeReceitaCusto` já existem no AppContext
- A lógica de cascata (receita → produto → combo) já funciona

## Arquivos afetados
- `src/pages/FichaManipulacao.tsx` (novo)
- `src/App.tsx` — nova rota
- `src/components/AppSidebar.tsx` — novo item menu

