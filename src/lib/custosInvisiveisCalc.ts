import type { CustosInvisiveis } from '@/types';

export interface CustosInvisiveisDetalhado {
  iptuMensal: number;
  totalSalarios: number;
  valeTransporte: number;
  depreciacao: number;
  brindes: number;
  veiculos: number;
  alimentacao: number;
  total: number;
}

export function calcularCustosInvisiveis(ci: CustosInvisiveis): CustosInvisiveisDetalhado {
  // 1. IPTU
  const iptuMensal = ci.iptuAnual / 12;

  // 2. Salários e Provisionamentos
  const funcs = ci.funcionarios;
  const somaSalarios = funcs.reduce((s, f) => s + f.salarioBase, 0);
  const mediaSalarial = funcs.length > 0 ? somaSalarios / funcs.length : 0;
  const avisoMensal = mediaSalarial / 12;
  const avisoComplementar = (mediaSalarial + mediaSalarial / 3 + mediaSalarial) * 0.08 / 12;

  let totalSalarios = 0;
  for (const f of funcs) {
    const sal = f.salarioBase;
    const fgts = sal * 0.08;
    const prov13 = sal / 12;
    const provFerias = (sal + sal / 3) / 12;
    const fgts13Ferias = (prov13 + provFerias) * 0.08;
    const multaFGTS = (fgts + fgts13Ferias) * 0.50;
    totalSalarios += sal + fgts + prov13 + provFerias + fgts13Ferias + avisoMensal + avisoComplementar + multaFGTS;
  }

  // 3. Vale Transporte
  const vt = ci.valeTransporte;
  const valeTransporte = vt.valorPassagem * vt.passagensPorDia * vt.diasTrabalhados * vt.qtdFuncionarios;

  // 4. Depreciação
  const depreciacao = ci.depreciacaoInventario > 0 ? (ci.depreciacaoInventario / 50) / 60 : 0;

  // 5. Brindes
  const br = ci.brindes;
  const brindes = br.qtdPorSemana * (br.cmvUnitario + br.entregaUnitaria) * br.fatorMensal;

  // 6. Veículos
  let veiculos = 0;
  for (const v of ci.veiculos) {
    const jurosTotal = Math.max(v.valorTotalFinanciamento - v.valorFipe, 0);
    const jurosMensal = v.qtdParcelas > 0 ? jurosTotal / v.qtdParcelas : 0;
    const pneuMensal = v.vidaUtilPneusMeses > 0 ? v.valorPneus / v.vidaUtilPneusMeses : 0;
    const manutMensal = v.manutencaoAnual / 12;
    const seguroMensal = v.seguroAnual / 12;
    const franquiaMensal = v.frequenciaFranquiaMeses > 0 ? v.franquiaSeguro / v.frequenciaFranquiaMeses : 0;
    const ipvaMensal = v.ipvaAnual / 12;
    const desvalorizacao = v.periodoUsoMeses > 0 ? Math.max(v.valorCompra - v.valorVendaFutura, 0) / v.periodoUsoMeses : 0;
    veiculos += v.combustivel + v.estacionamento + v.pedagio + v.lavaJato + jurosMensal + pneuMensal + manutMensal + seguroMensal + franquiaMensal + ipvaMensal + desvalorizacao;
  }

  // 7. Alimentação
  const al = ci.alimentacao;
  const alimentacao = al.qtdFuncionarios * al.custoDiario * al.diasTrabalhados;

  const total = iptuMensal + totalSalarios + valeTransporte + depreciacao + brindes + veiculos + alimentacao;

  return { iptuMensal, totalSalarios, valeTransporte, depreciacao, brindes, veiculos, alimentacao, total };
}
