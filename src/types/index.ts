export type UnidadeMedida = 'g' | 'kg' | 'L' | 'ml' | 'un';

export interface DespesaFixa {
  id: string;
  mes: string;
  descricao: string;
  valor: number;
}

export interface FaturamentoMensal {
  id: string;
  mes: string;
  valor: number;
}

export interface DNAEmpresa {
  custoFixoPercent: number; // auto-calculated
  composicaoMargem: number; // auto-calculated: max(custoFixoPercent - 33, 0)
  taxaDebito: number;
  taxaCredito: number;
  mediaCartao: number; // auto: (taxaDebito + taxaCredito) / 2
  impostos: number; // auto: alíquota efetiva do Simples Nacional
  voucher: number;
  franquia: number;
  isFranquia: boolean;
}

export interface Insumo {
  id: string;
  nome: string;
  quantidadeComprada: number;
  unidade: UnidadeMedida;
  precoPago: number;
  percentualPerda: number;
  // computed
  quantidadeReal: number;
  precoReal: number;
  custoPorUnidade: number;
}

export interface ReceitaIngrediente {
  id: string;
  insumoId: string;
  quantidade: number;
}

export interface ReceitaManipulacao {
  id: string;
  nome: string;
  quantidadeProduzida: number;
  unidade: UnidadeMedida;
  ingredientes: ReceitaIngrediente[];
  // computed
  custoTotal: number;
  custoPorUnidade: number;
}

export interface ProdutoIngrediente {
  id: string;
  tipo: 'insumo' | 'receita';
  referenciaId: string;
  quantidade: number;
}

export interface ProdutoCardapio {
  id: string;
  nome: string;
  ingredientes: ProdutoIngrediente[];
  custoEmbalagem: number;
  // computed
  cmv: number;
}

export interface Combo {
  id: string;
  nome: string;
  produtos: { produtoId: string; quantidade: number }[];
  // computed
  cmvTotal: number;
}

export interface FechamentoDia {
  id: string;
  data: string;
  dinheiroPix: number;
  debito: number;
  taxaDebito: number;
  credito: number;
  taxaCredito: number;
  ifood: number;
  taxaIfood: number;
  motoboyDiaria: number;
  motoboyEntregas: number;
  comprasCMV: number;
}

export interface ItemCardapio {
  id: string;
  nome: string;
}

export interface ItemManipulado {
  id: string;
  nome: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  salarioBase: number;
}

export interface Veiculo {
  id: string;
  nome: string;
  combustivel: number;
  estacionamento: number;
  pedagio: number;
  lavaJato: number;
  valorFipe: number;
  valorTotalFinanciamento: number;
  qtdParcelas: number;
  valorPneus: number;
  vidaUtilPneusMeses: number;
  manutencaoAnual: number;
  seguroAnual: number;
  franquiaSeguro: number;
  frequenciaFranquiaMeses: number;
  ipvaAnual: number;
  valorCompra: number;
  valorVendaFutura: number;
  periodoUsoMeses: number;
}

export interface CustosInvisiveis {
  iptuAnual: number;
  funcionarios: Funcionario[];
  valeTransporte: {
    valorPassagem: number;
    passagensPorDia: number;
    diasTrabalhados: number;
    qtdFuncionarios: number;
  };
  depreciacaoInventario: number;
  brindes: {
    qtdPorSemana: number;
    cmvUnitario: number;
    entregaUnitaria: number;
    fatorMensal: number;
  };
  veiculos: Veiculo[];
  alimentacao: {
    qtdFuncionarios: number;
    custoDiario: number;
    diasTrabalhados: number;
  };
}

export interface DREValoresMensais {
  [lineKey: string]: number[]; // 12 valores por linha
}

export interface DREState {
  valores: DREValoresMensais;
}

export interface PrecoProduto {
  produtoId: string;
  lucroEstimado: number;
  precoVenda: number;
  precoIfood: number | null;
  precoFantasma: number | null;
  precoIfoodFantasma: number | null;
}

export type CanalVenda = 'balcao' | 'delivery' | 'ifood' | 'fantasma';

export interface VendaDia {
  id: string;
  data: string;
  produtoId: string;
  nomeProduto: string;
  canal: CanalVenda;
  quantidade: number;
  precoUnitario: number;
  cmvUnitario: number;
  dnaPercent: number;
  faturamentoBruto: number;
  custoTotalProduto: number;
  custoVariavelUnitario: number;
  custoVariavelTotal: number;
  lucroUnitario: number;
  lucroTotal: number;
}

export interface DiagnosticoResposta {
  id: string;
  resposta: string;
}

export interface SimplesNacional {
  anexo: string; // 'I' | 'II' | 'III' | 'IV' | 'V' | ''
  rbt12Manual: number;
  modoSimulacao: boolean;
}

export interface AppState {
  despesasFixas: DespesaFixa[];
  faturamento: FaturamentoMensal[];
  dnaEmpresa: DNAEmpresa;
  insumos: Insumo[];
  receitas: ReceitaManipulacao[];
  produtos: ProdutoCardapio[];
  combos: Combo[];
  fechamentos: FechamentoDia[];
  itensCardapio: ItemCardapio[];
  itensManipulados: ItemManipulado[];
  custosInvisiveis: CustosInvisiveis;
  dre: DREState;
  simplesNacional: SimplesNacional;
  precosProdutos: PrecoProduto[];
  vendas: VendaDia[];
  diagnosticoRespostas: DiagnosticoResposta[];
}
