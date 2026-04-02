import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DespesaFixa, FaturamentoMensal } from '@/types';

export default function Financeiro() {
  const { state, dispatch, dnaTotal, mediaDespesas, mediaFaturamento } = useApp();
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [newDespesa, setNewDespesa] = useState({ mes: '', descricao: '', valor: '' });

  const addDespesa = () => {
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
              <Card className="px-4 py-2"><p className="text-xs text-muted-foreground">Média Mensal</p><p className="text-lg font-bold">{formatBRL(mediaDespesas)}</p></Card>
            </div>
            <Button onClick={() => setShowDespesaModal(true)}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
          </div>
          <Card>
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

          <Dialog open={showDespesaModal} onOpenChange={setShowDespesaModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Despesa Fixa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Mês</Label><Input value={newDespesa.mes} onChange={e => setNewDespesa(p => ({ ...p, mes: e.target.value }))} placeholder="Janeiro" /></div>
                <div><Label>Descrição</Label><Input value={newDespesa.descricao} onChange={e => setNewDespesa(p => ({ ...p, descricao: e.target.value }))} placeholder="Aluguel" /></div>
                <div><Label>Valor (R$)</Label><Input type="number" value={newDespesa.valor} onChange={e => setNewDespesa(p => ({ ...p, valor: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button onClick={addDespesa}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="faturamento" className="space-y-4">
          <Card className="px-4 py-2 w-fit"><p className="text-xs text-muted-foreground">Média de Faturamento</p><p className="text-lg font-bold">{formatBRL(mediaFaturamento)}</p></Card>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Mês</TableHead><TableHead className="text-right">Faturamento</TableHead></TableRow></TableHeader>
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
        </TabsContent>

        <TabsContent value="dna" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                DNA da Empresa
                <Tooltip>
                  <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>O DNA representa a soma de todos os percentuais de custos fixos e variáveis que incidem sobre o preço de venda. É usado para calcular o preço ideal dos produtos.</p></TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-muted-foreground">Custo Fixo % (automático)</Label>
                  <p className="text-2xl font-bold">{formatPercent(dna.custoFixoPercent)}</p>
                  <p className="text-xs text-muted-foreground">Média Despesas / Média Faturamento</p>
                </div>
                {([
                  ['taxaDebito', 'Taxa Débito (%)'],
                  ['taxaCredito', 'Taxa Crédito (%)'],
                  ['mediaCartao', 'Média Cartão (%)'],
                  ['impostos', 'Impostos (%)'],
                  ['royalties', 'Royalties (%)'],
                  ['marketing', 'Marketing (%)'],
                  ['voucher', 'Voucher/Benefícios (%)'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input type="number" step="0.1" value={dna[key]} onChange={e => updateDNA(key, parseFloat(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">DNA Total</p>
                <p className="text-3xl font-bold text-primary">{formatPercent(dnaTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
