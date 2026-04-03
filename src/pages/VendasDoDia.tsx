import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import type { CanalVenda, VendaDia } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, ShoppingCart, TrendingUp, DollarSign, Package, ArrowUp, ArrowDown } from 'lucide-react';

const CANAIS: { value: CanalVenda; label: string }[] = [
  { value: 'balcao', label: 'Salão / Balcão' },
  { value: 'delivery', label: 'Delivery Próprio' },
  { value: 'ifood', label: 'iFood' },
  { value: 'fantasma', label: 'Cardápio Fantasma' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const MESES_LABEL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function VendasDoDia() {
  const { state, dispatch, dnaTotal } = useApp();
  const [dataFiltro, setDataFiltro] = useState(todayStr());
  const [mesFiltro, setMesFiltro] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form state
  const [produtoId, setProdutoId] = useState('');
  const [canal, setCanal] = useState<CanalVenda>('balcao');
  const [quantidade, setQuantidade] = useState<number | ''>('');

  // Products with ficha técnica (CMV > 0) — PV salvo é opcional
  const produtosDisponiveis = useMemo(() => {
    return state.produtos.filter(p => p.cmv > 0);
  }, [state.produtos]);

  const getPrecoByCanal = (produtoId: string, canal: CanalVenda): number => {
    const pp = state.precosProdutos.find(p => p.produtoId === produtoId);
    if (!pp) return 0;
    switch (canal) {
      case 'ifood': return pp.precoIfood ?? pp.precoVenda;
      case 'fantasma': return pp.precoFantasma ?? pp.precoVenda;
      default: return pp.precoVenda;
    }
  };

  const lancarVenda = () => {
    if (!produtoId || !quantidade || quantidade <= 0) return;
    const produto = state.produtos.find(p => p.id === produtoId);
    if (!produto) return;
    const preco = getPrecoByCanal(produtoId, canal);
    const cmv = produto.cmv;
    const dna = dnaTotal;
    const qty = Number(quantidade);

    const custoVarUnit = preco * (dna / 100);
    const lucroUnit = preco - cmv - custoVarUnit;

    const venda: VendaDia = {
      id: crypto.randomUUID(),
      data: dataFiltro,
      produtoId,
      nomeProduto: produto.nome,
      canal,
      quantidade: qty,
      precoUnitario: preco,
      cmvUnitario: cmv,
      dnaPercent: dna,
      faturamentoBruto: qty * preco,
      custoTotalProduto: qty * cmv,
      custoVariavelUnitario: custoVarUnit,
      custoVariavelTotal: qty * custoVarUnit,
      lucroUnitario: lucroUnit,
      lucroTotal: qty * lucroUnit,
    };

    dispatch({ type: 'ADD_VENDA', payload: venda });
    setQuantidade('');
  };

  const removerVenda = (id: string) => dispatch({ type: 'REMOVE_VENDA', payload: id });

  // Filter vendas
  const vendasDoDia = useMemo(() => state.vendas.filter(v => v.data === dataFiltro), [state.vendas, dataFiltro]);
  const vendasDoMes = useMemo(() => state.vendas.filter(v => v.data.startsWith(mesFiltro)), [state.vendas, mesFiltro]);

  // Daily summary
  const resumoDiario = useMemo(() => {
    const fat = vendasDoDia.reduce((s, v) => s + v.faturamentoBruto, 0);
    const cmv = vendasDoDia.reduce((s, v) => s + v.custoTotalProduto, 0);
    const custoVar = vendasDoDia.reduce((s, v) => s + v.custoVariavelTotal, 0);
    const lucro = vendasDoDia.reduce((s, v) => s + v.lucroTotal, 0);
    const qtd = vendasDoDia.reduce((s, v) => s + v.quantidade, 0);
    const ticketMedio = vendasDoDia.length > 0 ? fat / vendasDoDia.length : 0;

    // Most sold & most profitable
    const byProduto: Record<string, { nome: string; qtd: number; lucro: number }> = {};
    for (const v of vendasDoDia) {
      if (!byProduto[v.produtoId]) byProduto[v.produtoId] = { nome: v.nomeProduto, qtd: 0, lucro: 0 };
      byProduto[v.produtoId].qtd += v.quantidade;
      byProduto[v.produtoId].lucro += v.lucroTotal;
    }
    const entries = Object.values(byProduto);
    const maisVendido = entries.length > 0 ? entries.reduce((a, b) => a.qtd > b.qtd ? a : b).nome : '-';
    const maisLucrativo = entries.length > 0 ? entries.reduce((a, b) => a.lucro > b.lucro ? a : b).nome : '-';

    return { fat, cmv, custoVar, lucro, qtd, ticketMedio, maisVendido, maisLucrativo };
  }, [vendasDoDia]);

  // Monthly summary
  const resumoMensal = useMemo(() => {
    const fat = vendasDoMes.reduce((s, v) => s + v.faturamentoBruto, 0);
    const cmv = vendasDoMes.reduce((s, v) => s + v.custoTotalProduto, 0);
    const custoVar = vendasDoMes.reduce((s, v) => s + v.custoVariavelTotal, 0);
    const lucro = vendasDoMes.reduce((s, v) => s + v.lucroTotal, 0);
    const qtd = vendasDoMes.reduce((s, v) => s + v.quantidade, 0);
    const margem = fat > 0 ? (lucro / fat) * 100 : 0;

    const byProduto: Record<string, { nome: string; qtd: number; fat: number; lucro: number }> = {};
    for (const v of vendasDoMes) {
      if (!byProduto[v.produtoId]) byProduto[v.produtoId] = { nome: v.nomeProduto, qtd: 0, fat: 0, lucro: 0 };
      byProduto[v.produtoId].qtd += v.quantidade;
      byProduto[v.produtoId].fat += v.faturamentoBruto;
      byProduto[v.produtoId].lucro += v.lucroTotal;
    }
    const ranking = Object.values(byProduto).sort((a, b) => b.fat - a.fat);
    const entries = Object.values(byProduto);
    const maisVendido = entries.length > 0 ? entries.reduce((a, b) => a.qtd > b.qtd ? a : b).nome : '-';
    const maisLucrativo = entries.length > 0 ? entries.reduce((a, b) => a.lucro > b.lucro ? a : b).nome : '-';

    return { fat, cmv, custoVar, lucro, qtd, margem, maisVendido, maisLucrativo, ranking };
  }, [vendasDoMes]);

  const noProdutos = produtosDisponiveis.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vendas do Dia</h1>
        <p className="text-muted-foreground">Registre vendas e acompanhe faturamento, custos e lucro</p>
      </div>

      {noProdutos && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">
              Nenhum produto disponível. Cadastre produtos na <strong>Ficha Técnica</strong> e salve os preços na tela <strong>Preço de Venda (PV)</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lancamento">
        <TabsList>
          <TabsTrigger value="lancamento">Lançamento</TabsTrigger>
          <TabsTrigger value="resumo-diario">Resumo Diário</TabsTrigger>
          <TabsTrigger value="resumo-mensal">Resumo Mensal</TabsTrigger>
        </TabsList>

        {/* === LANÇAMENTO === */}
        <TabsContent value="lancamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Lançar Venda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Data</label>
                  <Input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} className="w-[150px]" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Produto</label>
                  <Select value={produtoId} onValueChange={setProdutoId}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {produtosDisponiveis.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Canal</label>
                  <Select value={canal} onValueChange={v => setCanal(v as CanalVenda)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CANAIS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Quantidade</label>
                  <Input
                    type="number" min={1} className="w-[100px]"
                    value={quantidade === '' ? '' : quantidade}
                    onChange={e => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <Button onClick={lancarVenda} disabled={noProdutos || !produtoId || !quantidade}>
                  <Plus className="h-4 w-4 mr-1" /> Lançar
                </Button>
              </div>
            </CardContent>
          </Card>

          {vendasDoDia.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">PV Unit.</TableHead>
                        <TableHead className="text-right">Fat. Bruto</TableHead>
                        <TableHead className="text-right">CMV Unit.</TableHead>
                        <TableHead className="text-right">Custo Total</TableHead>
                        <TableHead className="text-right">DNA%</TableHead>
                        <TableHead className="text-right">CV Unit.</TableHead>
                        <TableHead className="text-right">CV Total</TableHead>
                        <TableHead className="text-right">Lucro Unit.</TableHead>
                        <TableHead className="text-right">Lucro Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendasDoDia.map((v, idx) => (
                        <TableRow key={v.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                          <TableCell className="font-medium">{v.nomeProduto}</TableCell>
                          <TableCell>{CANAIS.find(c => c.value === v.canal)?.label}</TableCell>
                          <TableCell className="text-right">{v.quantidade}</TableCell>
                          <TableCell className="text-right">{formatBRL(v.precoUnitario)}</TableCell>
                          <TableCell className="text-right">{formatBRL(v.faturamentoBruto)}</TableCell>
                          <TableCell className="text-right">{formatBRL(v.cmvUnitario)}</TableCell>
                          <TableCell className="text-right">{formatBRL(v.custoTotalProduto)}</TableCell>
                          <TableCell className="text-right">{formatPercent(v.dnaPercent)}</TableCell>
                          <TableCell className="text-right">{formatBRL(v.custoVariavelUnitario)}</TableCell>
                          <TableCell className="text-right">{formatBRL(v.custoVariavelTotal)}</TableCell>
                          <TableCell className={`text-right font-semibold ${v.lucroUnitario >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatBRL(v.lucroUnitario)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${v.lucroTotal >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatBRL(v.lucroTotal)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removerVenda(v.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === RESUMO DIÁRIO === */}
        <TabsContent value="resumo-diario" className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Data:</label>
            <Input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} className="w-[180px]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard icon={DollarSign} title="Faturamento Bruto" value={formatBRL(resumoDiario.fat)} />
            <SummaryCard icon={Package} title="CMV Total" value={formatBRL(resumoDiario.cmv)} />
            <SummaryCard icon={ArrowDown} title="Custos Variáveis" value={formatBRL(resumoDiario.custoVar)} />
            <SummaryCard icon={TrendingUp} title="Lucro Total" value={formatBRL(resumoDiario.lucro)} positive={resumoDiario.lucro >= 0} />
            <SummaryCard icon={ShoppingCart} title="Itens Vendidos" value={String(resumoDiario.qtd)} />
            <SummaryCard icon={DollarSign} title="Ticket Médio" value={formatBRL(resumoDiario.ticketMedio)} />
            <SummaryCard icon={ArrowUp} title="Mais Vendido" value={resumoDiario.maisVendido} />
            <SummaryCard icon={TrendingUp} title="Mais Lucrativo" value={resumoDiario.maisLucrativo} />
          </div>
        </TabsContent>

        {/* === RESUMO MENSAL === */}
        <TabsContent value="resumo-mensal" className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Mês:</label>
            <Input type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="w-[180px]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard icon={DollarSign} title="Faturamento Mensal" value={formatBRL(resumoMensal.fat)} />
            <SummaryCard icon={Package} title="CMV Mensal" value={formatBRL(resumoMensal.cmv)} />
            <SummaryCard icon={ArrowDown} title="Custos Variáveis" value={formatBRL(resumoMensal.custoVar)} />
            <SummaryCard icon={TrendingUp} title="Lucro Mensal" value={formatBRL(resumoMensal.lucro)} positive={resumoMensal.lucro >= 0} />
            <SummaryCard icon={ShoppingCart} title="Qtd Total" value={String(resumoMensal.qtd)} />
            <SummaryCard icon={TrendingUp} title="Margem Média" value={formatPercent(resumoMensal.margem)} />
            <SummaryCard icon={ArrowUp} title="Mais Vendido" value={resumoMensal.maisVendido} />
            <SummaryCard icon={TrendingUp} title="Mais Lucrativo" value={resumoMensal.maisLucrativo} />
          </div>

          {resumoMensal.ranking.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Ranking por Produto</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="text-right">Part. Fat %</TableHead>
                      <TableHead className="text-right">Part. Lucro %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumoMensal.ranking.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell className="text-right">{r.qtd}</TableCell>
                        <TableCell className="text-right">{formatBRL(r.fat)}</TableCell>
                        <TableCell className={`text-right ${r.lucro >= 0 ? 'text-green-600' : 'text-destructive'}`}>{formatBRL(r.lucro)}</TableCell>
                        <TableCell className="text-right">{resumoMensal.fat > 0 ? formatPercent((r.fat / resumoMensal.fat) * 100) : '-'}</TableCell>
                        <TableCell className="text-right">{resumoMensal.lucro !== 0 ? formatPercent((r.lucro / resumoMensal.lucro) * 100) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, positive }: { icon: any; title: string; value: string; positive?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-lg font-bold ${positive === false ? 'text-destructive' : 'text-foreground'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
