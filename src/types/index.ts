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
  taxaDebito: number;
  taxaCredito: number;
  mediaCartao: number;
  impostos: number;
  royalties: number;
  marketing: number;
  voucher: number;
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

export interface DREPercentuais {
  impostos: number;
  ingredientes: number;
  salariosProd: number;
  proLabore: number;
  bebidasRevenda: number;
  aluguel: number;
  aguaLuz: number;
  outrosInfra: number;
  honorariosAgencia: number;
  midiaSocial: number;
  marketing: number;
  contabilidade: number;
  limpezaEscritorio: number;
  outrosAdmin: number;
  reformas: number;
  emprestimos: number;
  taxaMaquininha: number;
  reservaCaixa: number;
}

export interface DREState {
  percentuais: DREPercentuais;
  faturamentoBruto: number[]; // 12 meses
}

export interface DiagnosticoResposta {
  id: string;
  resposta: string;
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
  dre: DREState;
  diagnosticoRespostas: DiagnosticoResposta[];
}
