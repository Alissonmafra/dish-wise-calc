import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Info, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DespesaFixa } from '@/types';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function Financeiro() {
  const { state, dispatch, dnaTotal } = useApp();
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [newDespesa, setNewDespesa] = useState({ mes: '', descricao: '', valor: '' });

  // Monthly summary
  const resumoMensal = useMemo(() => {
    const despPorMes: Record<string, number> = {};
    for (const d of state.despesasFixas) {
      despPorMes[d.mes] = (despPorMes[d.mes] || 0) + d.valor;
    }
    const mesesComDespesa = Object.keys(despPorMes);
    const rows = mesesComDespesa.map(mes => {
      const total = despPorMes[mes];
      const fat = state.faturamento.find(f => f.mes === mes);
      const fatVal = fat?.valor || 0;
      const percent = fatVal > 0 ? (total / fatVal) * 100 : null;
      return { mes, total, percent };
    });

    const mesesComPercent = rows.filter(r => r.percent !== null);
    const mediaR = rows.length > 0 ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0;
    const mediaPercent = mesesComPercent.length > 0
      ? mesesComPercent.reduce((s, r) => s + r.percent!, 0) / mesesComPercent.length
      : null;

    return { rows, mediaR, mediaPercent };
  }, [state.despesasFixas, state.faturamento]);

  const addDespesa = () => {
    if (!newDespesa.mes) return;
    const d: DespesaFixa = { id: crypto.randomUUID(), mes: newDespesa.mes, descricao: newDespesa.descricao, valor: parseFloat(newDespesa.valor) || 0 };
    dispatch({ type: 'SET_DESPESAS', payload: [...state.despesasFixas, d] });
    setShowDespesaModal(false);
    setNewDespesa({ mes: '', descricao: '', valor: '' });
  };

  const removeDespesa = (id: string) => dispatch({ type: 'SET_DESPESAS', payload: state.despesasFixas.filter(d => d.id !== id) });

  const updateFaturamento = (id: string, valor: number) => {
    dispatch({ type: 'SET_FATURAMENTO', payload: state.faturamento.map(f => f.id === id ? { ...f, valor } : f) });
  };

  const updateDNA = (field: string, value: number) => {
    dispatch({ type: 'SET_DNA', payload: { [field]: value } });
  };

  const dna = state.dnaEmpresa;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Configure as bases financeiras do seu negócio</p>
      </div>

      <Tabs defaultValue="despesas">
        <TabsList>
          <TabsTrigger value="despesas">Despesas Fixas</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="dna">DNA da Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Card className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Média Custo Fixo (R$)</p>
                <p className="text-lg font-bold">{formatBRL(resumoMensal.mediaR)}</p>
              </Card>
              <Card className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Média Custo Fixo (%)</p>
                <p className="text-lg font-bold">
                  {resumoMensal.mediaPercent !== null ? formatPercent(resumoMensal.mediaPercent) : '-'}
                </p>
              </Card>
            </div>
            <Button onClick={() => setShowDespesaModal(true)}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
          </div>

          {/* Lançamentos */}
          <Card>
            <CardHeader><CardTitle className="text-base">Lançamentos</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Mês</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-12" /></TableRow>
              </TableHeader>
              <TableBody>
                {state.despesasFixas.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.mes}</TableCell>
                    <TableCell>{d.descricao}</TableCell>
                    <TableCell className="text-right">{formatBRL(d.valor)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeDespesa(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Resumo Mensal */}
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo Mensal</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Total Custo Fixo (R$)</TableHead>
                  <TableHead className="text-right">Custo Fixo (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumoMensal.rows.map(r => (
                  <TableRow key={r.mes}>
                    <TableCell>{r.mes}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.total)}</TableCell>
                    <TableCell className="text-right">
                      {r.percent !== null ? formatPercent(r.percent) : <span className="text-muted-foreground italic">aguardando faturamento</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {resumoMensal.rows.length > 0 && (
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Média</TableCell>
                    <TableCell className="text-right">{formatBRL(resumoMensal.mediaR)}</TableCell>
                    <TableCell className="text-right">
                      {resumoMensal.mediaPercent !== null ? formatPercent(resumoMensal.mediaPercent) : '-'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Modal */}
          <Dialog open={showDespesaModal} onOpenChange={setShowDespesaModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Despesa Fixa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Mês</Label>
                  <Select value={newDespesa.mes} onValueChange={v => setNewDespesa(p => ({ ...p, mes: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
                    <SelectContent>
                      {MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição</Label><Input value={newDespesa.descricao} onChange={e => setNewDespesa(p => ({ ...p, descricao: e.target.value }))} placeholder="Aluguel" /></div>
                <div><Label>Valor (R$)</Label><Input type="number" value={newDespesa.valor} onChange={e => setNewDespesa(p => ({ ...p, valor: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button onClick={addDespesa}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="faturamento" className="space-y-4">
          <Card className="px-4 py-2 w-fit">
            <p className="text-xs text-muted-foreground">Média Faturamento Mensal (R$)</p>
            <p className="text-lg font-bold">{formatBRL(state.faturamento.filter(f => f.valor > 0).length > 0 ? state.faturamento.filter(f => f.valor > 0).reduce((s, f) => s + f.valor, 0) / state.faturamento.filter(f => f.valor > 0).length : 0)}</p>
          </Card>

          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">IMPORTANTE</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">Faturamento: deverá ser preenchido com o valor do faturamento do mês, isso refletirá no cálculo do % Custo Fixo.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Mês</TableHead><TableHead className="text-right">Faturamento (R$)</TableHead></TableRow></TableHeader>
              <TableBody>
                {state.faturamento.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{f.mes}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" className="w-40 ml-auto text-right" value={f.valor || ''} onChange={e => updateFaturamento(f.id, parseFloat(e.target.value) || 0)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Faturamento Mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={state.faturamento.map(f => ({ mes: f.mes.substring(0, 3), valor: f.valor }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis tickFormatter={(v: number) => formatBRL(v)} className="text-xs" width={100} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="valor" position="top" formatter={(v: number) => v > 0 ? formatBRL(v) : ''} className="text-xs fill-foreground" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dna" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                DNA da Empresa
                <Tooltip>
                  <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>O DNA representa a soma de todos os percentuais de custos fixos e variáveis que incidem sobre o preço de venda.</p></TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Custo Fixo - automático */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-muted-foreground">Custo Fixo (%) — automático</Label>
                <p className="text-2xl font-bold">{formatPercent(dna.custoFixoPercent)}</p>
                <p className="text-xs text-muted-foreground">Média dos percentuais mensais (Despesas Fixas / Faturamento)</p>
              </div>

              {/* Campos manuais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['taxaDebito', 'Taxa Máquina de Cartão Débito (%)'],
                  ['taxaCredito', 'Taxa Máquina de Cartão Crédito (%)'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input type="number" step="0.1" value={dna[key]} onChange={e => updateDNA(key, parseFloat(e.target.value) || 0)} />
                  </div>
                ))}
              </div>

              {/* Média Cartão - automático */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-muted-foreground">Média Taxa de Cartão Débito e Crédito (%) — automático</Label>
                <p className="text-2xl font-bold">{formatPercent(dna.mediaCartao)}</p>
                <p className="text-xs text-muted-foreground">(Taxa Débito + Taxa Crédito) / 2</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['impostos', 'Imposto (%)'],
                  ['royalties', 'Royalties (%)'],
                  ['marketing', 'Marketing (%)'],
                  ['voucher', 'Voucher (%)'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input type="number" step="0.1" value={dna[key]} onChange={e => updateDNA(key, parseFloat(e.target.value) || 0)} />
                  </div>
                ))}
              </div>

              {/* Percentual Total Taxas - automático */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Percentual Total Taxas (%)</p>
                <p className="text-3xl font-bold text-primary">{formatPercent(dnaTotal)}</p>
                <p className="text-xs text-muted-foreground">Custo Fixo + Média Cartão + Imposto + Royalties + Marketing + Voucher</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">IMPORTANTE</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">O Custo Fixo (%) é calculado automaticamente com base na média do percentual de custo fixo dos últimos 12 meses (Despesas Fixas / Faturamento). Preencha corretamente as despesas fixas e o faturamento mensal para que este valor reflita a realidade do seu negócio.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
