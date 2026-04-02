
# Sistema SaaS de Precificação para Restaurantes

## Visão Geral
Aplicação web completa que transforma a lógica da planilha de precificação em um sistema SaaS moderno com sidebar de navegação, dashboard com KPIs, e todos os módulos interligados com cálculos reativos em tempo real. Dados armazenados em estado local (localStorage) com formatação BRL.

## Design & Layout
- **Sidebar** com navegação entre módulos usando ícones (Lucide) e texto
- **Paleta**: Fundo branco/cinza claro, destaque em azul (#2563EB) para ações, verde para valores positivos, vermelho para prejuízos
- **Responsivo** para desktop e tablet
- **Idioma**: Português brasileiro em toda a interface

## Módulos

### 1. Dashboard
- Cards de KPIs: Faturamento Médio, Custo Fixo Médio, Margem de Lucro Média, Total de Produtos
- Gráfico de distribuição do DNA da Empresa (pizza/donut)
- Gráfico de barras com rentabilidade dos produtos (lucro % por produto)

### 2. Financeiro (3 abas)
- **Despesas Fixas**: Tabela com Mês, Descrição, Valor. Resumo lateral com total por mês e média. Cálculo automático do % Custo Fixo
- **Faturamento**: Tabela mensal (Jan-Dez) com valor. Calcula média automática
- **DNA da Empresa**: Exibe Custo Fixo % (calculado: Média Custo Fixo / Média Faturamento), campos editáveis para Taxa Débito, Crédito, Média Cartão, Impostos, Royalties, Marketing, Voucher. Soma total = DNA (%) — ex: 27.14%

### 3. Gestão de Insumos
- CRUD completo em tabela com busca e paginação
- Campos: Nome, Quantidade Comprada, Unidade (Gramas/Kg/Litros/Mililitros/Unidade), Preço Pago, % Perda
- Cálculos automáticos: Quantidade Real, Preço Real, Custo por Unidade de Medida
- Modal para adicionar/editar insumo
- Dados exemplo da planilha pré-carregados (Carne, Queijo, Pão, etc.)

### 4. Fichas Técnicas (2 sub-seções)
- **Receitas de Manipulação**: Nome, Qtd produzida, Unidade. Adicionar insumos do cadastro com quantidade usada. Calcula custo total e custo por porção. Ex: Maionese Caseira = Óleo 300ml + Creme de Leite 200g + Ovo 4und = R$ 7,17 / 500g
- **Produtos do Cardápio**: Nome, Qtd produzida. Adicionar insumos E receitas de manipulação com quantidade. Calcula CMV. Ex: Hambúrguer = Carne 150g + Queijo 50g + Pão 1und + Caixa 1und + Maionese 15g = R$ 9,13
- Interface com modal de composição e busca de insumos/receitas

### 5. Precificação Inteligente (2 sub-seções)
- **Análise Preço Atual**: Tabela com Produto, Preço de Venda Atual (input), DNA%, CMV, Lucro R$, Lucro % — destaque vermelho se prejuízo. Ex: Hambúrguer vendido a R$12 → -3.23% prejuízo
- **Simulador de Preços**: Para cada produto: inputs de Margem desejada, Taxa iFood%, Entrega R$, Cupom R$, Margem Cardápio Fantasma%. Calcula automaticamente:
  - Preço Normal = CMV / (1 - DNA% - Margem%)
  - Preço Delivery = (CMV + Entrega + Cupom) / (1 - DNA% - iFood% - Margem%)
  - Preço Cardápio Fantasma com margem reduzida

### 6. Gestão de Combos
- Criar combo selecionando produtos do cardápio com quantidade
- Soma automática dos CMVs
- Inputs: Margem desejada, Taxa iFood%, Entrega, Cupom
- Calcula Preço Normal e Preço iFood do combo
- Ex: X-Burguer + Coca = CMV R$14,18 → PV R$22,56 (10% margem) → PV iFood R$39,02

### 7. Fechamento de Caixa
- Tabela diária: Data, Dinheiro+PIX, Débito (valor + taxa%), Crédito (valor + taxa%), iFood (valor + taxa%), Motoboy Diária, Motoboy Entregas, Compras CMV
- Calcula automaticamente: Entrada, Saída, Saldo por dia
- Consolidado mensal com totais

## Lógica Reativa (Core)
- **Estado centralizado** com React Context: quando o preço de um insumo muda, recalcula automaticamente todas as receitas que o usam, todos os produtos que usam essas receitas, e todas as telas de precificação
- Cadeia: Insumos → Receitas → Produtos → Precificação/Combos
- Todos os valores monetários formatados em R$ (BRL)
- Tooltips explicativos nos cálculos principais (ex: "DNA = soma de todas as taxas fixas e variáveis")

## Dados Exemplo Pré-carregados
Os dados da planilha serão carregados como estado inicial para demonstração imediata do sistema funcionando.
