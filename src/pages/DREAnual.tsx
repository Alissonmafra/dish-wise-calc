import { useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// Keys for editable lines (manual R$ input)
const EDITABLE_KEYS = [
  'fatBruto','impostos','ingredientes','salariosProd','proLabore','bebidasRevenda',
  'aluguel','aguaLuz','outrosInfra','honorariosAgencia','midiaSocial','marketing',
  'contabilidade','limpezaEscritorio','outrosAdmin','reformas','emprestimos','taxaMaquininha','reservaCaixa',
] as const;

type EditableKey = typeof EDITABLE_KEYS[number];

interface DRELine {
  label: string;
  key?: EditableKey;
  isSection?: boolean;
  isTotal?: boolean;
  isResult?: boolean;
  isIndicator?: boolean;
  totalKey?: string;
  sumKeys?: EditableKey[];
  compute?: (vals: Record<string, number[]>, mi: number) => number;
}

const dreLines: DRELine[] = [
  { label: 'RECEITA', isSection: true },
  { label: 'Faturamento Bruto', key: 'fatBruto' },
  { label: '(-) Impostos', key: 'impostos' },
  { label: '(=) Receita Líquida', isTotal: true, totalKey: 'recLiq',
    compute: (v, i) => (v.fatBruto?.[i] || 0) - (v.impostos?.[i] || 0) },

  { label: 'CUSTOS (CMV)', isSection: true },
  { label: 'Ingredientes / Matérias-primas', key: 'ingredientes' },
  { label: 'Salários Produção', key: 'salariosProd' },
  { label: 'Pró-labore / Salário do Sócio', key: 'proLabore' },
  { label: 'Bebidas / Produtos para Revenda', key: 'bebidasRevenda' },
  { label: '(=) CMV Total', isTotal: true, totalKey: 'cmvTotal',
    sumKeys: ['ingredientes','salariosProd','proLabore','bebidasRevenda'] },

  { label: 'DESPESAS OPERACIONAIS', isSection: true },

  { label: 'Infraestrutura', isSection: true },
  { label: 'Aluguel / Condomínio', key: 'aluguel' },
  { label: 'Água / Luz / Energia', key: 'aguaLuz' },
  { label: 'Outros (manutenção, gás)', key: 'outrosInfra' },
  { label: '(=) Total Infraestrutura', isTotal: true, totalKey: 'infraTotal',
    sumKeys: ['aluguel','aguaLuz','outrosInfra'] },

  { label: 'Custo Comercial', isSection: true },
  { label: 'Honorários Agência', key: 'honorariosAgencia' },
  { label: 'Investimento em Mídia Social', key: 'midiaSocial' },
  { label: 'Marketing (posts, material, outros)', key: 'marketing' },
  { label: '(=) Total Comercial', isTotal: true, totalKey: 'comercialTotal',
    sumKeys: ['honorariosAgencia','midiaSocial','marketing'] },

  { label: 'Despesas Administrativas', isSection: true },
  { label: 'Contabilidade / Jurídico', key: 'contabilidade' },
  { label: 'Limpeza / Material de escritório', key: 'limpezaEscritorio' },
  { label: 'Outros administrativos', key: 'outrosAdmin' },
  { label: '(=) Total Administrativas', isTotal: true, totalKey: 'adminTotal',
    sumKeys: ['contabilidade','limpezaEscritorio','outrosAdmin'] },

  { label: 'Investimentos / Financeiro', isSection: true },
  { label: 'Reformas / Expansão', key: 'reformas' },
  { label: 'Empréstimos / Financiamentos', key: 'emprestimos' },
  { label: 'Taxa de Maquininha', key: 'taxaMaquininha' },
  { label: 'Reserva de Caixa / Contingência', key: 'reservaCaixa' },
  { label: '(=) Total Investimentos/Financeiro', isTotal: true, totalKey: 'investTotal',
    sumKeys: ['reformas','emprestimos','taxaMaquininha','reservaCaixa'] },

  { label: 'RESULTADO', isSection: true },
  { label: '(-) Total Despesas Operacionais', isResult: true, totalKey: 'despOpTotal',
    sumKeys: ['aluguel','aguaLuz','outrosInfra','honorariosAgencia','midiaSocial','marketing',
      'contabilidade','limpezaEscritorio','outrosAdmin','reformas','emprestimos','taxaMaquininha','reservaCaixa'] },
  { label: '(-) CMV Total', isResult: true, totalKey: 'cmvTotalR',
    sumKeys: ['ingredientes','salariosProd','proLabore','bebidasRevenda'] },
  { label: '(=) EBITDA', isResult: true, totalKey: 'ebitda',
    compute: (v, i) => {
      const fat = v.fatBruto?.[i] || 0;
      const imp = v.impostos?.[i] || 0;
      const cmvKeys: EditableKey[] = ['ingredientes','salariosProd','proLabore','bebidasRevenda'];
      const despKeys: EditableKey[] = ['aluguel','aguaLuz','outrosInfra','honorariosAgencia','midiaSocial','marketing',
        'contabilidade','limpezaEscritorio','outrosAdmin','reformas','emprestimos','taxaMaquininha','reservaCaixa'];
      const cmv = cmvKeys.reduce((s, k) => s + (v[k]?.[i] || 0), 0);
      const desp = despKeys.reduce((s, k) => s + (v[k]?.[i] || 0), 0);
      return (fat - imp) - cmv - desp;
    }},
  { label: '(=) Lucro Líquido', isResult: true, totalKey: 'lucroLiq',
    compute: (v, i) => {
      const fat = v.fatBruto?.[i] || 0;
      const imp = v.impostos?.[i] || 0;
      const cmvKeys: EditableKey[] = ['ingredientes','salariosProd','proLabore','bebidasRevenda'];
      const despKeys: EditableKey[] = ['aluguel','aguaLuz','outrosInfra','honorariosAgencia','midiaSocial','marketing',
        'contabilidade','limpezaEscritorio','outrosAdmin','reformas','emprestimos','taxaMaquininha','reservaCaixa'];
      const cmv = cmvKeys.reduce((s, k) => s + (v[k]?.[i] || 0), 0);
      const desp = despKeys.reduce((s, k) => s + (v[k]?.[i] || 0), 0);
      return (fat - imp) - cmv - desp;
    }},

  { label: 'INDICADORES', isSection: true },
  { label: 'CMV % do Faturamento', isIndicator: true, totalKey: 'cmvPct' },
  { label: 'Margem EBITDA', isIndicator: true, totalKey: 'margemEbitda' },
  { label: 'Margem Líquida', isIndicator: true, totalKey: 'margemLiq' },
  { label: 'Ponto de Equilíbrio (R$)', isIndicator: true, totalKey: 'pontoEq' },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

const sumArr = (arr: number[]) => arr.reduce((s, v) => s + v, 0);
const getVal = (vals: Record<string, number[]>, key: string, i: number) => vals[key]?.[i] || 0;

export default function DREAnual() {
  const { state, dispatch } = useApp();
  const { dre } = state;
  const vals = dre.valores;

  const data = useMemo(() => {
    return dreLines.map(line => {
      if (line.isSection) return { ...line, values: [] as number[], totalAno: 0, pctMedio: '' };

      const values = Array.from({ length: 12 }, (_, i) => {
        if (line.key) return getVal(vals, line.key, i);
        if (line.sumKeys) return line.sumKeys.reduce((s, k) => s + getVal(vals, k, i), 0);
        if (line.compute) return line.compute(vals, i);
        if (line.isIndicator) {
          const fat = getVal(vals, 'fatBruto', i);
          const cmvKeys: EditableKey[] = ['ingredientes','salariosProd','proLabore','bebidasRevenda'];
          const despKeys: EditableKey[] = ['aluguel','aguaLuz','outrosInfra','honorariosAgencia','midiaSocial','marketing',
            'contabilidade','limpezaEscritorio','outrosAdmin','reformas','emprestimos','taxaMaquininha','reservaCaixa'];
          const cmv = cmvKeys.reduce((s, k) => s + getVal(vals, k, i), 0);
          const imp = getVal(vals, 'impostos', i);
          const desp = despKeys.reduce((s, k) => s + getVal(vals, k, i), 0);
          const ebitda = (fat - imp) - cmv - desp;
          if (line.totalKey === 'cmvPct') return fat > 0 ? cmv / fat : 0;
          if (line.totalKey === 'margemEbitda') return fat > 0 ? ebitda / fat : 0;
          if (line.totalKey === 'margemLiq') return fat > 0 ? ebitda / fat : 0;
          if (line.totalKey === 'pontoEq') return cmv + desp;
        }
        return 0;
      });

      const totalAno = sumArr(values);
      const fatTotal = sumArr(vals.fatBruto || Array(12).fill(0));
      let pctMedio = '';
      if (line.isIndicator) {
        if (line.totalKey === 'pontoEq') pctMedio = '';
        else pctMedio = fatTotal > 0 ? fmtPct(totalAno / 12) : '0.0%';
      } else {
        pctMedio = fatTotal > 0 ? fmtPct(totalAno / fatTotal) : '0.0%';
      }

      return { ...line, values, totalAno, pctMedio };
    });
  }, [vals]);

  const updateVal = (key: EditableKey, month: number, val: number) => {
    const arr = [...(vals[key] || Array(12).fill(0))];
    arr[month] = val;
    dispatch({ type: 'SET_DRE', payload: { valores: { ...vals, [key]: arr } } });
  };

  const importarVendas = useCallback((month: number) => {
    const mesStr = `${new Date().getFullYear()}-${String(month + 1).padStart(2, '0')}`;
    const vendasMes = state.vendas.filter(v => v.data.startsWith(mesStr));
    if (vendasMes.length === 0) return;

    const fatBruto = vendasMes.reduce((s, v) => s + v.faturamentoBruto, 0);
    const ingredientes = vendasMes.reduce((s, v) => s + v.custoTotalProduto, 0);
    const dna = state.dnaEmpresa;
    const impostos = fatBruto * (dna.impostos / 100);
    const taxaMaq = fatBruto * (dna.mediaCartao / 100);

    const newVals = { ...vals };
    const update = (key: string, val: number) => {
      const arr = [...(newVals[key] || Array(12).fill(0))];
      arr[month] = val;
      newVals[key] = arr;
    };
    update('fatBruto', fatBruto);
    update('ingredientes', ingredientes);
    update('impostos', impostos);
    update('taxaMaquininha', taxaMaq);

    dispatch({ type: 'SET_DRE', payload: { valores: newVals } });
  }, [state.vendas, state.dnaEmpresa, vals, dispatch]);

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
                  {MESES.map(m => <th key={m} className="p-2 text-center min-w-[90px]">{m}</th>)}
                  <th className="p-2 text-center min-w-[100px]">Total Ano</th>
                  <th className="p-2 text-center min-w-[70px]">% Fat</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  if (row.isSection) {
                    return (
                      <tr key={idx} className="bg-primary/10">
                        <td colSpan={15} className="p-2 font-bold text-primary">{row.label}</td>
                      </tr>
                    );
                  }

                  const isEditable = !!row.key;
                  const bgClass = idx % 2 === 0 ? 'bg-background' : 'bg-muted/30';
                  const textClass = row.isResult ? 'font-bold' : row.isTotal ? 'font-semibold' : '';
                  const valueClass = !isEditable ? 'text-muted-foreground' : '';

                  return (
                    <tr key={idx} className={bgClass}>
                      <td className={`p-2 sticky left-0 ${bgClass} z-10 ${textClass}`}>
                        {row.label}
                      </td>
                      {(row.values || []).map((v, mi) => (
                        <td key={mi} className={`p-2 text-right ${valueClass}`}>
                          {isEditable ? (
                            <Input
                              type="number"
                              className="w-20 h-7 text-xs text-right p-1"
                              value={getVal(vals, row.key!, mi) || ''}
                              onChange={e => updateVal(row.key!, mi, parseFloat(e.target.value) || 0)}
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
