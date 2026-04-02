export interface FaixaSimplesNacional {
  limiteInferior: number;
  limiteSuperior: number;
  aliquotaNominal: number; // em %
  parcelaADeduzir: number;
}

export interface ResultadoSimples {
  faixa: string;
  aliquotaNominal: number;
  parcelaADeduzir: number;
  aliquotaEfetiva: number;
  impostoMensal: number;
  alertas: string[];
}

const tabelaAnexoI: FaixaSimplesNacional[] = [
  { limiteInferior: 0, limiteSuperior: 180000, aliquotaNominal: 4, parcelaADeduzir: 0 },
  { limiteInferior: 180000.01, limiteSuperior: 360000, aliquotaNominal: 7.3, parcelaADeduzir: 5940 },
  { limiteInferior: 360000.01, limiteSuperior: 720000, aliquotaNominal: 9.5, parcelaADeduzir: 13860 },
  { limiteInferior: 720000.01, limiteSuperior: 1800000, aliquotaNominal: 10.7, parcelaADeduzir: 22500 },
  { limiteInferior: 1800000.01, limiteSuperior: 3600000, aliquotaNominal: 14.3, parcelaADeduzir: 87300 },
  { limiteInferior: 3600000.01, limiteSuperior: 4800000, aliquotaNominal: 19, parcelaADeduzir: 378000 },
];

const tabelas: Record<string, FaixaSimplesNacional[]> = {
  I: tabelaAnexoI,
  // Anexos II-V podem ser adicionados futuramente
};

export function obterTabela(anexo: string): FaixaSimplesNacional[] {
  return tabelas[anexo] || [];
}

export function calcularImpostoSimples(
  faturamentoMensal: number,
  rbt12: number,
  anexo: string
): ResultadoSimples {
  const alertas: string[] = [];

  if (!anexo) {
    alertas.push('Anexo do Simples Nacional não definido.');
    return { faixa: '-', aliquotaNominal: 0, parcelaADeduzir: 0, aliquotaEfetiva: 0, impostoMensal: 0, alertas };
  }

  const tabela = tabelas[anexo];
  if (!tabela) {
    alertas.push(`Tabela do Anexo ${anexo} ainda não cadastrada no sistema.`);
    return { faixa: '-', aliquotaNominal: 0, parcelaADeduzir: 0, aliquotaEfetiva: 0, impostoMensal: 0, alertas };
  }

  if (rbt12 <= 0) {
    alertas.push('RBT12 não informado. Preencha a receita bruta acumulada dos últimos 12 meses.');
    return { faixa: '-', aliquotaNominal: 0, parcelaADeduzir: 0, aliquotaEfetiva: 0, impostoMensal: 0, alertas };
  }

  if (faturamentoMensal <= 0) {
    alertas.push('Faturamento mensal é zero. Informe o faturamento do mês para calcular o imposto.');
    return { faixa: '-', aliquotaNominal: 0, parcelaADeduzir: 0, aliquotaEfetiva: 0, impostoMensal: 0, alertas };
  }

  if (rbt12 > 4800000) {
    alertas.push('RBT12 excede o limite do Simples Nacional (R$ 4.800.000,00). A empresa pode estar desenquadrada.');
  }

  const faixa = tabela.find(f => rbt12 >= f.limiteInferior && rbt12 <= f.limiteSuperior);

  if (!faixa) {
    alertas.push('RBT12 não se enquadra em nenhuma faixa da tabela.');
    return { faixa: '-', aliquotaNominal: 0, parcelaADeduzir: 0, aliquotaEfetiva: 0, impostoMensal: 0, alertas };
  }

  const faixaDesc = faixa.limiteInferior === 0
    ? `Até R$ ${faixa.limiteSuperior.toLocaleString('pt-BR')}`
    : `De R$ ${faixa.limiteInferior.toLocaleString('pt-BR')} a R$ ${faixa.limiteSuperior.toLocaleString('pt-BR')}`;

  const aliquotaEfetiva = ((rbt12 * faixa.aliquotaNominal / 100) - faixa.parcelaADeduzir) / rbt12 * 100;
  const impostoMensal = faturamentoMensal * aliquotaEfetiva / 100;

  return {
    faixa: faixaDesc,
    aliquotaNominal: faixa.aliquotaNominal,
    parcelaADeduzir: faixa.parcelaADeduzir,
    aliquotaEfetiva,
    impostoMensal,
    alertas,
  };
}
