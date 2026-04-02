import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { calcularImpostoSimples } from '@/lib/simplesNacionalCalc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { DREPercentuais } from '@/types';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type LineKey = keyof DREPercentuais;

interface DRELine {
  label: string;
  key?: LineKey;
  isSection?: boolean;
  isTotal?: boolean;
  isResult?: boolean;
  isIndicator?: boolean;
  negative?: boolean;
  compute?: (fat: number, pct: DREPercentuais, totals: Record<string, number>) => number;
  totalKey?: string;
}

const dreLines: DRELine[] = [
  { label: 'RECEITA', isSection: true },
  { label: 'Faturamento Bruto', totalKey: 'fatBruto' },
  { label: '(-) Impostos', key: 'impostos', negative: true, totalKey: 'impostos' },
  { label: '(=) Receita Líquida', isTotal: true, totalKey: 'recLiq', compute: (f, p) => f - f * p.impostos / 100 },

  { label: 'CUSTOS (CMV)', isSection: true },
  { label: 'Ingredientes / Matérias-primas', key: 'ingredientes', totalKey: 'ingredientes' },
  { label: 'Salários Produção', key: 'salariosProd', totalKey: 'salariosProd' },
  { label: 'Pró-labore / Salário do Sócio', key: 'proLabore', totalKey: 'proLabore' },
  { label: 'Bebidas / Produtos para Revenda', key: 'bebidasRevenda', totalKey: 'bebidasRevenda' },
  { label: '(=) CMV Total', isTotal: true, totalKey: 'cmvTotal', compute: (f, p) => f * (p.ingredientes + p.salariosProd + p.proLabore + p.bebidasRevenda) / 100 },

  { label: 'DESPESAS OPERACIONAIS', isSection: true },

  { label: 'Infraestrutura', isSection: true },
  { label: 'Aluguel / Condomínio', key: 'aluguel', totalKey: 'aluguel' },
  { label: 'Água / Luz / Energia', key: 'aguaLuz', totalKey: 'aguaLuz' },
  { label: 'Outros (manutenção, gás)', key: 'outrosInfra', totalKey: 'outrosInfra' },
  { label: '(=) Total Infraestrutura', isTotal: true, totalKey: 'infraTotal', compute: (f, p) => f * (p.aluguel + p.aguaLuz + p.outrosInfra) / 100 },

  { label: 'Custo Comercial', isSection: true },
  { label: 'Honorários Agência', key: 'honorariosAgencia', totalKey: 'honorariosAgencia' },
  { label: 'Investimento em Mídia Social', key: 'midiaSocial', totalKey: 'midiaSocial' },
  { label: 'Marketing (posts, material, outros)', key: 'marketing', totalKey: 'marketing' },
  { label: '(=) Total Comercial', isTotal: true, totalKey: 'comercialTotal', compute: (f, p) => f * (p.honorariosAgencia + p.midiaSocial + p.marketing) / 100 },

  { label: 'Despesas Administrativas', isSection: true },
  { label: 'Contabilidade / Jurídico', key: 'contabilidade', totalKey: 'contabilidade' },
  { label: 'Limpeza / Material de escritório', key: 'limpezaEscritorio', totalKey: 'limpezaEscritorio' },
  { label: 'Outros administrativos', key: 'outrosAdmin', totalKey: 'outrosAdmin' },
  { label: '(=) Total Administrativas', isTotal: true, totalKey: 'adminTotal', compute: (f, p) => f * (p.contabilidade + p.limpezaEscritorio + p.outrosAdmin) / 100 },

  { label: 'Investimentos / Financeiro', isSection: true },
  { label: 'Reformas / Expansão', key: 'reformas', totalKey: 'reformas' },
  { label: 'Empréstimos / Financiamentos', key: 'emprestimos', totalKey: 'emprestimos' },
  { label: 'Taxa de Maquininha', key: 'taxaMaquininha', totalKey: 'taxaMaquininha' },
  { label: 'Reserva de Caixa / Contingência', key: 'reservaCaixa', totalKey: 'reservaCaixa' },
  { label: '(=) Total Investimentos/Financeiro', isTotal: true, totalKey: 'investTotal', compute: (f, p) => f * (p.reformas + p.emprestimos + p.taxaMaquininha + p.reservaCaixa) / 100 },

  { label: 'RESULTADO', isSection: true },
  { label: '(-) Total Despesas Operacionais', isResult: true, totalKey: 'despOpTotal', compute: (f, p) => {
    const infra = f * (p.aluguel + p.aguaLuz + p.outrosInfra) / 100;
    const com = f * (p.honorariosAgencia + p.midiaSocial + p.marketing) / 100;
    const adm = f * (p.contabilidade + p.limpezaEscritorio + p.outrosAdmin) / 100;
    const inv = f * (p.reformas + p.emprestimos + p.taxaMaquininha + p.reservaCaixa) / 100;
    return infra + com + adm + inv;
  }},
  { label: '(-) CMV Total', isResult: true, totalKey: 'cmvTotalR', compute: (f, p) => f * (p.ingredientes + p.salariosProd + p.proLabore + p.bebidasRevenda) / 100 },
  { label: '(=) EBITDA', isResult: true, totalKey: 'ebitda', compute: (f, p) => {
    const recLiq = f - f * p.impostos / 100;
    const cmv = f * (p.ingredientes + p.salariosProd + p.proLabore + p.bebidasRevenda) / 100;
    const infra = f * (p.aluguel + p.aguaLuz + p.outrosInfra) / 100;
    const com = f * (p.honorariosAgencia + p.midiaSocial + p.marketing) / 100;
    const adm = f * (p.contabilidade + p.limpezaEscritorio + p.outrosAdmin) / 100;
    const inv = f * (p.reformas + p.emprestimos + p.taxaMaquininha + p.reservaCaixa) / 100;
    return recLiq - cmv - infra - com - adm - inv;
  }},
  { label: '(=) Lucro Líquido', isResult: true, totalKey: 'lucroLiq', compute: (f, p) => {
    const recLiq = f - f * p.impostos / 100;
    const cmv = f * (p.ingredientes + p.salariosProd + p.proLabore + p.bebidasRevenda) / 100;
    const infra = f * (p.aluguel + p.aguaLuz + p.outrosInfra) / 100;
    const com = f * (p.honorariosAgencia + p.midiaSocial + p.marketing) / 100;
    const adm = f * (p.contabilidade + p.limpezaEscritorio + p.outrosAdmin) / 100;
    const inv = f * (p.reformas + p.emprestimos + p.taxaMaquininha + p.reservaCaixa) / 100;
    return recLiq - cmv - infra - com - adm - inv;
  }},

  { label: 'INDICADORES', isSection: true },
  { label: 'CMV % do Faturamento', isIndicator: true, totalKey: 'cmvPct' },
  { label: 'Margem EBITDA', isIndicator: true, totalKey: 'margemEbitda' },
  { label: 'Margem Líquida', isIndicator: true, totalKey: 'margemLiq' },
  { label: 'Composição de Margem (%)', isIndicator: true, totalKey: 'composicaoMargem' },
  { label: 'Ponto de Equilíbrio (R$)', isIndicator: true, totalKey: 'pontoEq' },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

export default function DREAnual() {
  const { state, dispatch } = useApp();
  const { dre } = state;
  const p = dre.percentuais;
  const fatArr = dre.faturamentoBruto;

  const data = useMemo(() => {
    return dreLines.map(line => {
      if (line.isSection) return { ...line, values: [] as number[], totalAno: 0, pctMedio: '' };

      const values = fatArr.map((fat, _i) => {
        if (line.totalKey === 'fatBruto') return fat;
        if (line.key) return fat * p[line.key] / 100;
        if (line.compute) return line.compute(fat, p, {});
        if (line.isIndicator) {
          const cmv = fat * (p.ingredientes + p.salariosProd + p.proLabore + p.bebidasRevenda) / 100;
          const recLiq = fat - fat * p.impostos / 100;
          const infra = fat * (p.aluguel + p.aguaLuz + p.outrosInfra) / 100;
          const com = fat * (p.honorariosAgencia + p.midiaSocial + p.marketing) / 100;
          const adm = fat * (p.contabilidade + p.limpezaEscritorio + p.outrosAdmin) / 100;
          const inv = fat * (p.reformas + p.emprestimos + p.taxaMaquininha + p.reservaCaixa) / 100;
          const ebitda = recLiq - cmv - infra - com - adm - inv;
          if (line.totalKey === 'cmvPct') return fat > 0 ? cmv / fat : 0;
          if (line.totalKey === 'margemEbitda') return fat > 0 ? ebitda / fat : 0;
          if (line.totalKey === 'margemLiq') return fat > 0 ? ebitda / fat : 0;
          if (line.totalKey === 'composicaoMargem') {
            // Uses the global custoFixoPercent rule: excess over 33%
            // For per-month DRE, we approximate using total desp op as % of fat
            const totalDespPct = (infra + com + adm + inv) / (fat || 1) * 100;
            return totalDespPct > 33 ? (totalDespPct - 33) / 100 : 0;
          }
          if (line.totalKey === 'pontoEq') return cmv + infra + com + adm + inv;
        }
        return 0;
      });

      const totalAno = values.reduce((s, v) => s + v, 0);
      const fatTotal = fatArr.reduce((s, v) => s + v, 0);
      let pctMedio = '';
      if (line.isIndicator) {
        if (line.totalKey === 'pontoEq') pctMedio = '';
        else pctMedio = fatTotal > 0 ? fmtPct(totalAno / 12) : '0.0%';
      } else {
        pctMedio = fatTotal > 0 ? fmtPct(totalAno / fatTotal) : '0.0%';
      }

      return { ...line, values, totalAno, pctMedio };
    });
  }, [fatArr, p]);

  const updateFat = (month: number, val: number) => {
    const newFat = [...fatArr];
    newFat[month] = val;
    dispatch({ type: 'SET_DRE', payload: { ...dre, faturamentoBruto: newFat } });
  };

  const updatePct = (key: LineKey, val: number) => {
    dispatch({ type: 'SET_DRE', payload: { ...dre, percentuais: { ...p, [key]: val } } });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">DRE Anual</h1>
      <Card>
        <CardHeader><CardTitle>Demonstrativo de Resultado do Exercício</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 sticky left-0 bg-muted z-10 min-w-[220px]">Linha</th>
                  <th className="p-2 w-16 text-center">% Ref</th>
                  {MESES.map(m => <th key={m} className="p-2 text-center min-w-[90px]">{m}</th>)}
                  <th className="p-2 text-center min-w-[100px]">Total Ano</th>
                  <th className="p-2 text-center min-w-[70px]">% Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  if (row.isSection) {
                    return (
                      <tr key={idx} className="bg-primary/10">
                        <td colSpan={16} className="p-2 font-bold text-primary">{row.label}</td>
                      </tr>
                    );
                  }

                  const isFatBruto = row.totalKey === 'fatBruto';
                  const isAuto = !isFatBruto && !row.key;
                  const bgClass = idx % 2 === 0 ? 'bg-background' : 'bg-muted/30';
                  const textClass = row.isResult ? 'font-bold' : row.isTotal ? 'font-semibold' : '';
                  const valueClass = isAuto ? 'text-muted-foreground' : '';

                  return (
                    <tr key={idx} className={bgClass}>
                      <td className={`p-2 sticky left-0 ${bgClass} z-10 ${textClass}`}>
                        {row.label}
                      </td>
                      <td className="p-2 text-center">
                        {row.key ? (
                          <Input
                            type="number"
                            step="0.1"
                            className="w-14 h-7 text-xs text-center p-1"
                            value={p[row.key]}
                            onChange={e => updatePct(row.key!, parseFloat(e.target.value) || 0)}
                          />
                        ) : row.isIndicator ? '' : ''}
                      </td>
                      {(row.values || []).map((v, mi) => (
                        <td key={mi} className={`p-2 text-right ${valueClass}`}>
                          {isFatBruto ? (
                            <Input
                              type="number"
                              className="w-20 h-7 text-xs text-right p-1"
                              value={fatArr[mi] || ''}
                              onChange={e => updateFat(mi, parseFloat(e.target.value) || 0)}
                            />
                          ) : row.isIndicator && row.totalKey !== 'pontoEq' ? (
                            fmtPct(v)
                          ) : (
                            fmt(v)
                          )}
                        </td>
                      ))}
                      <td className={`p-2 text-right font-semibold ${valueClass}`}>
                        {row.isIndicator && row.totalKey !== 'pontoEq'
                          ? row.pctMedio
                          : fmt(row.totalAno)}
                      </td>
                      <td className="p-2 text-center text-muted-foreground">
                        {!row.isIndicator ? row.pctMedio : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
