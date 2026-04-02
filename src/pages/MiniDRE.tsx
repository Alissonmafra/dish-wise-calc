import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { calcularImpostoSimples } from '@/lib/simplesNacionalCalc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

export default function MiniDRE() {
  const { state, mediaFaturamento } = useApp();
  const { produtos, dre } = state;
  const p = dre.percentuais;

  const [selectedProduto, setSelectedProduto] = useState('');
  const [precoVendaManual, setPrecoVendaManual] = useState<number>(0);
  const [qtdMes, setQtdMes] = useState<number>(0);
  const [precoCompraBebida, setPrecoCompraBebida] = useState<number>(0);

  const produto = produtos.find(pr => pr.id === selectedProduto);

  const calc = useMemo(() => {
    const pv = precoVendaManual;
    if (!pv || pv <= 0) return null;

    const impostos = pv * p.impostos / 100;
    const receitaLiquida = pv - impostos;
    const ingredientes = produto ? produto.cmv : 0;
    const embalagem = produto ? produto.custoEmbalagem : 0;
    const custoFuncionario = pv * p.salariosProd / 100;
    const proLabore = pv * p.proLabore / 100;
    const totalCustoProd = ingredientes + embalagem + custoFuncionario + proLabore;
    const pctCustoProd = totalCustoProd / pv;

    const aluguel = pv * p.aluguel / 100;
    const energiaAgua = pv * p.aguaLuz / 100;
    const honorariosMidia = pv * (p.honorariosAgencia + p.midiaSocial) / 100;
    const taxaMaq = pv * p.taxaMaquininha / 100;
    const outros = pv * p.outrosAdmin / 100;
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
  }, [precoVendaManual, produto, p, qtdMes]);

  const Row = ({ label, value, bold, pct }: { label: string; value: number; bold?: boolean; pct?: boolean }) => (
    <div className={`flex justify-between py-1 ${bold ? 'font-bold' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{pct ? fmtPct(value) : `R$ ${fmt(value)}`}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Mini-DRE por Produto</h1>

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
