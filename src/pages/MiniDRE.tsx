import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { calcularImpostoSimples } from '@/lib/simplesNacionalCalc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import ExportExcelButton from '@/components/ExportExcelButton';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

export default function MiniDRE() {
  const { state, mediaFaturamento, dnaTotal } = useApp();
  const { produtos } = state;

  const [selectedProduto, setSelectedProduto] = useState('');
  const [precoVendaManual, setPrecoVendaManual] = useState<number>(0);
  const [qtdMes, setQtdMes] = useState<number>(0);
  const [precoCompraBebida, setPrecoCompraBebida] = useState<number>(0);

  const produto = produtos.find(pr => pr.id === selectedProduto);

  // Get effective tax rate from Simples Nacional
  const taxaImpostos = useMemo(() => {
    const sn = state.simplesNacional;
    if (sn.regime === 'MEI') return 0;
    if (sn.anexo) {
      const rbt12 = sn.modoSimulacao ? mediaFaturamento * 12 : sn.rbt12Manual;
      const res = calcularImpostoSimples(mediaFaturamento, rbt12, sn.anexo, sn.regime);
      if (res.aliquotaEfetiva > 0) return res.aliquotaEfetiva;
    }
    return state.dnaEmpresa.impostos;
  }, [state.simplesNacional, mediaFaturamento, state.dnaEmpresa.impostos]);

  const calc = useMemo(() => {
    const pv = precoVendaManual;
    if (!pv || pv <= 0) return null;

    const impostos = pv * taxaImpostos / 100;
    const receitaLiquida = pv - impostos;
    const ingredientes = produto ? produto.cmv : 0;
    const embalagem = produto ? produto.custoEmbalagem : 0;
    // Use DNA percentages for rateio estimates
    const dna = state.dnaEmpresa;
    const custoFuncionario = pv * 0.10; // 10% estimate
    const proLabore = pv * 0.07; // 7% estimate
    const totalCustoProd = ingredientes + embalagem + custoFuncionario + proLabore;
    const pctCustoProd = totalCustoProd / pv;

    const aluguel = pv * 0.03;
    const energiaAgua = pv * 0.015;
    const honorariosMidia = pv * 0.04;
    const taxaMaq = pv * dna.mediaCartao / 100;
    const outros = pv * 0.02;
    const totalDespRateadas = aluguel + energiaAgua + honorariosMidia + taxaMaq + outros;

    const lucroBruto = receitaLiquida - totalCustoProd - totalDespRateadas;
    const margemLucro = lucroBruto / pv;

    const fatMensal = pv * qtdMes;
    const lucroMensal = lucroBruto * qtdMes;

    return {
      impostos, receitaLiquida, ingredientes, embalagem, custoFuncionario, proLabore,
      totalCustoProd, pctCustoProd, aluguel, energiaAgua, honorariosMidia, taxaMaq,
      outros, totalDespRateadas, lucroBruto, margemLucro, fatMensal, lucroMensal,
    };
  }, [precoVendaManual, produto, taxaImpostos, qtdMes, state.dnaEmpresa]);

  const Row = ({ label, value, bold, pct }: { label: string; value: number; bold?: boolean; pct?: boolean }) => (
    <div className={`flex justify-between py-1 ${bold ? 'font-bold' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{pct ? fmtPct(value) : `R$ ${fmt(value)}`}</span>
    </div>
  );

  const getSheets = () => {
    if (!calc) return [{ name: 'Mini-DRE', columns: [], rows: [] }];
    const rows = [
      { label: 'Preço de Venda', value: precoVendaManual, pct: false },
      { label: '(-) Impostos', value: calc.impostos, pct: false },
      { label: '(=) Receita Líquida', value: calc.receitaLiquida, pct: false },
      { label: 'Ingredientes / Insumos Diretos', value: calc.ingredientes, pct: false },
      { label: 'Embalagem / Descartável', value: calc.embalagem, pct: false },
      { label: 'Custo do Funcionário (rateio)', value: calc.custoFuncionario, pct: false },
      { label: 'Pró-labore do Sócio (rateio)', value: calc.proLabore, pct: false },
      { label: '(=) Total Custo de Produção', value: calc.totalCustoProd, pct: false },
      { label: '% Custo de Produção', value: calc.pctCustoProd, pct: true },
      { label: 'Aluguel (rateio)', value: calc.aluguel, pct: false },
      { label: 'Energia / Água (rateio)', value: calc.energiaAgua, pct: false },
      { label: 'Honorários + Mídia (rateio)', value: calc.honorariosMidia, pct: false },
      { label: 'Taxa de Maquininha', value: calc.taxaMaq, pct: false },
      { label: 'Outros (admin)', value: calc.outros, pct: false },
      { label: '(=) Total Despesas Rateadas', value: calc.totalDespRateadas, pct: false },
      { label: 'Lucro Bruto por Unidade', value: calc.lucroBruto, pct: false },
      { label: 'Margem de Lucro %', value: calc.margemLucro, pct: true },
      { label: 'Faturamento Bruto Mensal', value: calc.fatMensal, pct: false },
      { label: 'Lucro Total Mensal', value: calc.lucroMensal, pct: false },
    ];
    return [
      {
        name: 'Mini-DRE',
        columns: [
          { header: 'Linha', key: 'label', type: 'text' as const },
          { header: 'Valor', key: 'value', type: 'currency' as const },
        ],
        rows: rows.filter(r => !r.pct).map(r => ({ label: r.label, value: r.value })),
      },
      {
        name: 'Indicadores %',
        columns: [
          { header: 'Linha', key: 'label', type: 'text' as const },
          { header: 'Valor', key: 'value', type: 'percent' as const },
        ],
        rows: rows.filter(r => r.pct).map(r => ({ label: r.label, value: r.value })),
      },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Mini-DRE por Produto</h1>
        <ExportExcelButton fileName="Mini_DRE" getSheets={getSheets} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Configuração</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Produto</Label>
              <Select value={selectedProduto} onValueChange={v => { setSelectedProduto(v); const pr = produtos.find(x => x.id === v); if (pr) setPrecoVendaManual(0); }}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {produtos.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input type="number" value={precoVendaManual || ''} onChange={e => setPrecoVendaManual(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Quantidade de vendas/mês</Label>
              <Input type="number" value={qtdMes || ''} onChange={e => setQtdMes(parseInt(e.target.value) || 0)} />
            </div>
            <Separator />
            <div>
              <Label>Preço de Compra da Bebida (R$)</Label>
              <Input type="number" value={precoCompraBebida || ''} onChange={e => setPrecoCompraBebida(parseFloat(e.target.value) || 0)} />
            </div>
            {precoCompraBebida > 0 && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Markup mínimo (2x)</span><span>R$ {fmt(precoCompraBebida * 2)}</span></div>
                <div className="flex justify-between"><span>Markup médio (3x)</span><span>R$ {fmt(precoCompraBebida * 3)}</span></div>
                <div className="flex justify-between"><span>Markup máximo (4x)</span><span>R$ {fmt(precoCompraBebida * 4)}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Análise de Rentabilidade</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {calc ? (
              <>
                <Row label="Preço de Venda" value={precoVendaManual} bold />
                <Row label="(-) Impostos" value={calc.impostos} />
                <Row label="(=) Receita Líquida" value={calc.receitaLiquida} bold />
                <Separator className="my-2" />
                <Row label="Ingredientes / Insumos Diretos" value={calc.ingredientes} />
                <Row label="Embalagem / Descartável" value={calc.embalagem} />
                <Row label="Custo do Funcionário (rateio)" value={calc.custoFuncionario} />
                <Row label="Pró-labore do Sócio (rateio)" value={calc.proLabore} />
                <Row label="(=) Total Custo de Produção" value={calc.totalCustoProd} bold />
                <Row label="% Custo de Produção" value={calc.pctCustoProd} pct />
                <Separator className="my-2" />
                <Row label="Aluguel (rateio)" value={calc.aluguel} />
                <Row label="Energia / Água (rateio)" value={calc.energiaAgua} />
                <Row label="Honorários + Mídia (rateio)" value={calc.honorariosMidia} />
                <Row label="Taxa de Maquininha" value={calc.taxaMaq} />
                <Row label="Outros (admin)" value={calc.outros} />
                <Row label="(=) Total Despesas Rateadas" value={calc.totalDespRateadas} bold />
                <Separator className="my-2" />
                <Row label="Lucro Bruto por Unidade" value={calc.lucroBruto} bold />
                <Row label="Margem de Lucro %" value={calc.margemLucro} pct bold />
                <Separator className="my-2" />
                <Row label="Faturamento Bruto Mensal" value={calc.fatMensal} />
                <Row label="Lucro Total Mensal" value={calc.lucroMensal} bold />
              </>
            ) : (
              <p className="text-muted-foreground">Selecione um produto e informe o preço de venda para ver a análise.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
