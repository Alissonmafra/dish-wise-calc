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
  credito: number;
  ifood: number;
  motoboyDiaria: number;
  motoboyEntregas: number;
  comprasCMV: number;
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
}
