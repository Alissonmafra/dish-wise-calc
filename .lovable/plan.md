

# Refatorar Cadastro de Insumos e Matéria-Prima

## Resumo

A tela de Insumos já existe com CRUD funcional. As alterações são incrementais para alinhar com a especificação.

## Alterações

### 1. `src/pages/Insumos.tsx` — Refatorar UI

**Título**: Alterar para "Cadastro de Insumos e Matéria-Prima" com subtítulo descritivo.

**Unidades simplificadas**: Reduzir para 3 opções obrigatórias:
- Grama (gr) → valor interno `g`
- Mililitro (ml) → valor interno `ml`
- Unidade (und) → valor interno `un`

Remover `kg` e `L` da lista.

**KPI Card**: Adicionar card "Total Insumos Cadastrados" com contagem automática (como nas telas de Itens do Cardápio e Itens Manipulados).

**Coluna "Item"**: Adicionar número sequencial (1, 2, 3...) como primeira coluna da tabela.

**Coluna "Preço por Unidade de Medida"**: Substituir a coluna genérica "Custo/Unidade" por exibição descritiva:
- `R$ 0,0444 por gr`
- `R$ 0,0111 por ml`
- `R$ 0,3000 por und`

Helper de sigla: `g → gr`, `ml → ml`, `un → und`.

**Validação de duplicidade**: Ao salvar, verificar se já existe insumo com mesmo nome (case-insensitive), excluindo o próprio item em edição. Exibir toast de alerta.

**Zebra-striping**: Adicionar alternância de cor nas linhas da tabela (padrão das outras telas).

**Renomear colunas** conforme imagem de referência:
- "Qtd Comprada" → "Peso/Qtd"
- "Preço Pago" → "Preço (R$)"
- "Perda %" → "Perda (%)"
- "Qtd Real" → "Peso/Qtd Real"
- "Custo/Unidade" → "Preço Real (R$)"
- Nova coluna: "Preço (R$) por Unidade de Medida"

### 2. Sem alterações em tipos ou contexto

A lógica de cálculo em `AppContext.tsx` já está correta:
- `quantidadeReal = quantidadeComprada * (1 - percentualPerda / 100)` ✓
- `custoPorUnidade = precoPago / quantidadeReal` ✓

A interface `Insumo` e o reducer `SET_INSUMOS` já existem.

## Arquivo afetado
- `src/pages/Insumos.tsx`

