import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { FechamentoDia } from '@/types';

const calcRow = (f: FechamentoDia) => {
  const taxaDebVal = f.debito * (f.taxaDebito / 100);
  const taxaCredVal = f.credito * (f.taxaCredito / 100);
  const taxaIfoodVal = f.ifood * (f.taxaIfood / 100);
  const debLiq = f.debito - taxaDebVal;
  const credLiq = f.credito - taxaCredVal;
  const ifoodLiq = f.ifood - taxaIfoodVal;
  const entrada = f.dinheiroPix + f.debito + f.credito + f.ifood;
  const saida = taxaDebVal + taxaCredVal + taxaIfoodVal + f.motoboyDiaria + f.motoboyEntregas + f.comprasCMV;
  const saldo = entrada - saida;
  return { taxaDebVal, taxaCredVal, taxaIfoodVal, debLiq, credLiq, ifoodLiq, entrada, saida, saldo };
};

const emptyForm = {
  data: '', dinheiroPix: '', debito: '', taxaDebito: '', credito: '', taxaCredito: '',
  ifood: '', taxaIfood: '', motoboyDiaria: '', motoboyEntregas: '', comprasCMV: '',
};

export default function Fechamento() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const save = () => {
    const f: FechamentoDia = {
      id: crypto.randomUUID(),
      data: form.data,
      dinheiroPix: parseFloat(form.dinheiroPix) || 0,
      debito: parseFloat(form.debito) || 0,
      taxaDebito: parseFloat(form.taxaDebito) || 0,
      credito: parseFloat(form.credito) || 0,
      taxaCredito: parseFloat(form.taxaCredito) || 0,
      ifood: parseFloat(form.ifood) || 0,
      taxaIfood: parseFloat(form.taxaIfood) || 0,
      motoboyDiaria: parseFloat(form.motoboyDiaria) || 0,
      motoboyEntregas: parseFloat(form.motoboyEntregas) || 0,
      comprasCMV: parseFloat(form.comprasCMV) || 0,
    };
    dispatch({ type: 'SET_FECHAMENTOS', payload: [...state.fechamentos, f] });
    setShowModal(false);
    setForm({ ...emptyForm });
  };

  const remove = (id: string) =>
    dispatch({ type: 'SET_FECHAMENTOS', payload: state.fechamentos.filter(f => f.id !== id) });

  const totais = useMemo(() =>
    state.fechamentos.reduce((acc, f) => {
      const c = calcRow(f);
      return { entrada: acc.entrada + c.entrada, saida: acc.saida + c.saida, saldo: acc.saldo + c.saldo };
    }, { entrada: 0, saida: 0, saldo: 0 }),
    [state.fechamentos]
  );

  const consolidado = useMemo(() => {
    const map = new Map<string, { entrada: number; saida: number; saldo: number }>();
    state.fechamentos.forEach(f => {
      const mes = f.data.slice(0, 7); // YYYY-MM
      if (!mes) return;
      const c = calcRow(f);
      const prev = map.get(mes) || { entrada: 0, saida: 0, saldo: 0 };
      map.set(mes, {
        entrada: prev.entrada + c.entrada,
        saida: prev.saida + c.saida,
        saldo: prev.saldo + c.saldo,
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [state.fechamentos]);

  const formatMes = (m: string) => {
    const [y, mo] = m.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mo) - 1]}/${y}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fechamento de Caixa</h1>
        <p className="text-muted-foreground">Registro diário de vendas e cálculo do saldo líquido</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-1" />Novo Dia</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Tabela diária */}
        <Card>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Data</TableHead>
                  <TableHead className="text-right min-w-[110px]">Din./PIX</TableHead>
                  <TableHead className="text-right min-w-[100px]">Débito</TableHead>
                  <TableHead className="text-right min-w-[80px]">Taxa Déb.%</TableHead>
                  <TableHead className="text-right min-w-[110px]">Déb.-Taxa</TableHead>
                  <TableHead className="text-right min-w-[100px]">Crédito</TableHead>
                  <TableHead className="text-right min-w-[80px]">Taxa Créd.%</TableHead>
                  <TableHead className="text-right min-w-[110px]">Créd.-Taxa</TableHead>
                  <TableHead className="text-right min-w-[100px]">iFood</TableHead>
                  <TableHead className="text-right min-w-[80px]">Taxa iFood%</TableHead>
                  <TableHead className="text-right min-w-[110px]">iFood-Taxa</TableHead>
                  <TableHead className="text-right min-w-[100px]">Motoboy Diár.</TableHead>
                  <TableHead className="text-right min-w-[100px]">Motoboy Entr.</TableHead>
                  <TableHead className="text-right min-w-[120px]">CMV+Emb.</TableHead>
                  <TableHead className="text-right min-w-[110px] font-bold">Entrada</TableHead>
                  <TableHead className="text-right min-w-[110px] font-bold">Saída</TableHead>
                  <TableHead className="text-right min-w-[110px] font-bold">Saldo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.fechamentos.map((f, idx) => {
                  const c = calcRow(f);
                  return (
                    <TableRow key={f.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium">{f.data}</TableCell>
                      <TableCell className="text-right">{formatBRL(f.dinheiroPix)}</TableCell>
                      <TableCell className="text-right">{formatBRL(f.debito)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatPercent(f.taxaDebito)}</TableCell>
                      <TableCell className="text-right">{formatBRL(c.debLiq)}</TableCell>
                      <TableCell className="text-right">{formatBRL(f.credito)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatPercent(f.taxaCredito)}</TableCell>
                      <TableCell className="text-right">{formatBRL(c.credLiq)}</TableCell>
                      <TableCell className="text-right">{formatBRL(f.ifood)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatPercent(f.taxaIfood)}</TableCell>
                      <TableCell className="text-right">{formatBRL(c.ifoodLiq)}</TableCell>
                      <TableCell className="text-right">{formatBRL(f.motoboyDiaria)}</TableCell>
                      <TableCell className="text-right">{formatBRL(f.motoboyEntregas)}</TableCell>
                      <TableCell className="text-right">{formatBRL(f.comprasCMV)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatBRL(c.entrada)}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">{formatBRL(c.saida)}</TableCell>
                      <TableCell className={`text-right font-bold ${c.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatBRL(c.saldo)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => remove(f.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              {state.fechamentos.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={14} className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{formatBRL(totais.entrada)}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{formatBRL(totais.saida)}</TableCell>
                    <TableCell className={`text-right font-bold ${totais.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatBRL(totais.saldo)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </Card>

        {/* Consolidado Mensal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Consolidado Mensal</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidado.map(([mes, v], idx) => (
                  <TableRow key={mes} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium">{formatMes(mes)}</TableCell>
                    <TableCell className="text-right">{formatBRL(v.entrada)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatBRL(v.saida)}</TableCell>
                    <TableCell className={`text-right font-bold ${v.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatBRL(v.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
                {consolidado.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Nenhum lançamento
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal novo dia */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Fechamento Diário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={set('data')} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dinheiro/PIX (R$)</Label><Input type="number" step="0.01" value={form.dinheiroPix} onChange={set('dinheiroPix')} /></div>
              <div><Label>Cartão de Débito (R$)</Label><Input type="number" step="0.01" value={form.debito} onChange={set('debito')} /></div>
              <div><Label>Taxa Débito (%)</Label><Input type="number" step="0.01" value={form.taxaDebito} onChange={set('taxaDebito')} /></div>
              <div><Label>Cartão de Crédito (R$)</Label><Input type="number" step="0.01" value={form.credito} onChange={set('credito')} /></div>
              <div><Label>Taxa Crédito (%)</Label><Input type="number" step="0.01" value={form.taxaCredito} onChange={set('taxaCredito')} /></div>
              <div><Label>iFood (R$)</Label><Input type="number" step="0.01" value={form.ifood} onChange={set('ifood')} /></div>
              <div><Label>Taxa iFood (%)</Label><Input type="number" step="0.01" value={form.taxaIfood} onChange={set('taxaIfood')} /></div>
              <div><Label>Motoboy Diária (R$)</Label><Input type="number" step="0.01" value={form.motoboyDiaria} onChange={set('motoboyDiaria')} /></div>
              <div><Label>Motoboy Entregas (R$)</Label><Input type="number" step="0.01" value={form.motoboyEntregas} onChange={set('motoboyEntregas')} /></div>
              <div><Label>Compras CMV+Emb. (R$)</Label><Input type="number" step="0.01" value={form.comprasCMV} onChange={set('comprasCMV')} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
