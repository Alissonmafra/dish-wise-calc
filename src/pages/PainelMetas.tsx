import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

interface Indicator {
  label: string;
  getValue: (fat: number, cmv: number, ebitda: number, infra: number, com: number) => number;
  format: (v: number) => string;
  getStatus: (v: number) => { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' };
}

export default function PainelMetas() {
  const { state } = useApp();
  const { dre } = state;
  const v = dre.valores;

  const getVal = (key: string, i: number) => v[key]?.[i] || 0;

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const fat = getVal('fatBruto', i);
      const imp = getVal('impostos', i);
      const cmvKeys = ['ingredientes','salariosProd','proLabore','bebidasRevenda'];
      const cmv = cmvKeys.reduce((s, k) => s + getVal(k, i), 0);
      const infraKeys = ['aluguel','aguaLuz','outrosInfra'];
      const infra = infraKeys.reduce((s, k) => s + getVal(k, i), 0);
      const comKeys = ['honorariosAgencia','midiaSocial','marketing'];
      const com = comKeys.reduce((s, k) => s + getVal(k, i), 0);
      const admKeys = ['contabilidade','limpezaEscritorio','outrosAdmin'];
      const adm = admKeys.reduce((s, k) => s + getVal(k, i), 0);
      const invKeys = ['reformas','emprestimos','taxaMaquininha','reservaCaixa'];
      const inv = invKeys.reduce((s, k) => s + getVal(k, i), 0);
      const ebitda = (fat - imp) - cmv - infra - com - adm - inv;
      return { fat, cmv, ebitda, infra, com };
    });
  }, [v]);

  const totals = useMemo(() => {
    const t = { fat: 0, cmv: 0, ebitda: 0, infra: 0, com: 0 };
    monthlyData.forEach(m => { t.fat += m.fat; t.cmv += m.cmv; t.ebitda += m.ebitda; t.infra += m.infra; t.com += m.com; });
    return t;
  }, [monthlyData]);

  const indicators: Indicator[] = [
    {
      label: 'Faturamento Bruto',
      getValue: (fat) => fat,
      format: fmt,
      getStatus: (v) => v > 0
        ? { label: '✅ Ativo', variant: 'default' }
        : { label: '⚠️ Sem dados', variant: 'secondary' },
    },
    {
      label: 'CMV % do Faturamento',
      getValue: (fat, cmv) => fat > 0 ? cmv / fat : 0,
      format: fmtPct,
      getStatus: (v) => v <= 0.55
        ? { label: '✅ OK', variant: 'default' }
        : { label: '🚨 Alto', variant: 'destructive' },
    },
    {
      label: 'Margem EBITDA',
      getValue: (fat, _cmv, ebitda) => fat > 0 ? ebitda / fat : 0,
      format: fmtPct,
      getStatus: (v) => v >= 0.20
        ? { label: '✅ Saudável', variant: 'default' }
        : { label: '🚨 Atenção', variant: 'destructive' },
    },
    {
      label: 'Margem Líquida',
      getValue: (fat, _cmv, ebitda) => fat > 0 ? ebitda / fat : 0,
      format: fmtPct,
      getStatus: (v) => v >= 0.10
        ? { label: '✅ OK', variant: 'default' }
        : { label: '🚨 Abaixo', variant: 'destructive' },
    },
    {
      label: 'Infraestrutura % do Faturamento',
      getValue: (fat, _cmv, _ebitda, infra) => fat > 0 ? infra / fat : 0,
      format: fmtPct,
      getStatus: (v) => v <= 0.06
        ? { label: '✅ OK', variant: 'default' }
        : { label: '⚠️ Acima', variant: 'secondary' },
    },
    {
      label: 'Custo Comercial % do Faturamento',
      getValue: (fat, _cmv, _ebitda, _infra, com) => fat > 0 ? com / fat : 0,
      format: fmtPct,
      getStatus: (v) => v <= 0.05
        ? { label: '✅ OK', variant: 'default' }
        : { label: '⚠️ Acima', variant: 'secondary' },
    },
    {
      label: 'Custo Fixo %',
      getValue: () => state.dnaEmpresa.custoFixoPercent / 100,
      format: fmtPct,
      getStatus: (v) => v <= 0.33
        ? { label: '✅ Saudável', variant: 'default' }
        : { label: '🚨 Acima do limite', variant: 'destructive' },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Painel de Metas</h1>
        <ExportExcelButton
          fileName="Painel_Metas"
          getSheets={() => [{
            name: 'Painel de Metas',
            columns: [
              { header: 'Indicador', key: 'indicador' },
              ...MESES.map(m => ({ header: m, key: m, type: 'number' as const })),
              { header: 'Total Ano', key: 'total', type: 'number' as const },
              { header: 'Status', key: 'status' },
            ],
            rows: indicators.map(ind => {
              const totalVal = ind.getValue(totals.fat, totals.cmv, totals.ebitda, totals.infra, totals.com);
              const row: Record<string, unknown> = {
                indicador: ind.label,
                total: ind.format(totalVal),
                status: ind.getStatus(totalVal).label,
              };
              monthlyData.forEach((m, mi) => {
                row[MESES[mi]] = ind.format(ind.getValue(m.fat, m.cmv, m.ebitda, m.infra, m.com));
              });
              return row;
            }),
          }]}
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map(ind => {
          const val = ind.getValue(totals.fat, totals.cmv, totals.ebitda, totals.infra, totals.com);
          const status = ind.getStatus(val);
          return (
            <Card key={ind.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{ind.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{ind.format(val)}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Detalhamento Mensal</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Indicador</th>
                  {MESES.map(m => <th key={m} className="p-2 text-center">{m}</th>)}
                  <th className="p-2 text-center">Total Ano</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((ind, idx) => {
                  const totalVal = ind.getValue(totals.fat, totals.cmv, totals.ebitda, totals.infra, totals.com);
                  const status = ind.getStatus(totalVal);
                  return (
                    <tr key={ind.label} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2 font-medium">{ind.label}</td>
                      {monthlyData.map((m, mi) => (
                        <td key={mi} className="p-2 text-center">
                          {ind.format(ind.getValue(m.fat, m.cmv, m.ebitda, m.infra, m.com))}
                        </td>
                      ))}
                      <td className="p-2 text-center font-semibold">{ind.format(totalVal)}</td>
                      <td className="p-2 text-center">
                        <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
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
