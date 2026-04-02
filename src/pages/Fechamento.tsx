import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { FechamentoDia } from '@/types';

export default function Fechamento() {
  const { state, dispatch } = useApp();
  const dna = state.dnaEmpresa;

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    data: '', dinheiroPix: '', debito: '', credito: '', ifood: '',
    motoboyDiaria: '', motoboyEntregas: '', comprasCMV: '',
  });

  const save = () => {
    const f: FechamentoDia = {
      id: crypto.randomUUID(), data: form.data,
      dinheiroPix: parseFloat(form.dinheiroPix) || 0,
      debito: parseFloat(form.debito) || 0,
      credito: parseFloat(form.credito) || 0,
      ifood: parseFloat(form.ifood) || 0,
      motoboyDiaria: parseFloat(form.motoboyDiaria) || 0,
      motoboyEntregas: parseFloat(form.motoboyEntregas) || 0,
      comprasCMV: parseFloat(form.comprasCMV) || 0,
    };
    dispatch({ type: 'SET_FECHAMENTOS', payload: [...state.fechamentos, f] });
    setShowModal(false);
    setForm({ data: '', dinheiroPix: '', debito: '', credito: '', ifood: '', motoboyDiaria: '', motoboyEntregas: '', comprasCMV: '' });
  };

  const remove = (id: string) => dispatch({ type: 'SET_FECHAMENTOS', payload: state.fechamentos.filter(f => f.id !== id) });

  const calcRow = (f: FechamentoDia) => {
    const taxaDebVal = f.debito * (dna.taxaDebito / 100);
    const taxaCredVal = f.credito * (dna.taxaCredito / 100);
    const taxaIfoodVal = f.ifood * 0.19; // iFood typical 19%
    const entrada = f.dinheiroPix + (f.debito - taxaDebVal) + (f.credito - taxaCredVal) + (f.ifood - taxaIfoodVal);
    const saida = f.motoboyDiaria + f.motoboyEntregas + f.comprasCMV + taxaDebVal + taxaCredVal + taxaIfoodVal;
    const saldo = entrada - saida;
    return { entrada, saida, saldo, taxaDebVal, taxaCredVal, taxaIfoodVal };
  };

  const totais = state.fechamentos.reduce((acc, f) => {
    const c = calcRow(f);
    return { entrada: acc.entrada + c.entrada, saida: acc.saida + c.saida, saldo: acc.saldo + c.saldo };
  }, { entrada: 0, saida: 0, saldo: 0 });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Fechamento de Caixa</h1><p className="text-muted-foreground">Registro diário de vendas e cálculo do saldo líquido</p></div>
      <div className="flex justify-end"><Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-1" />Novo Dia</Button></div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead className="text-right">Dinheiro/PIX</TableHead>
              <TableHead className="text-right">Débito</TableHead><TableHead className="text-right">Crédito</TableHead>
              <TableHead className="text-right">iFood</TableHead><TableHead className="text-right">Entrada Líq.</TableHead>
              <TableHead className="text-right">Saídas</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.fechamentos.map(f => {
              const c = calcRow(f);
              return (
                <TableRow key={f.id}>
                  <TableCell>{f.data}</TableCell>
                  <TableCell className="text-right">{formatBRL(f.dinheiroPix)}</TableCell>
                  <TableCell className="text-right">{formatBRL(f.debito)}</TableCell>
                  <TableCell className="text-right">{formatBRL(f.credito)}</TableCell>
                  <TableCell className="text-right">{formatBRL(f.ifood)}</TableCell>
                  <TableCell className="text-right font-medium">{formatBRL(c.entrada)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatBRL(c.saida)}</TableCell>
                  <TableCell className={`text-right font-bold ${c.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>{formatBRL(c.saldo)}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {state.fechamentos.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">{formatBRL(totais.entrada)}</TableCell>
                <TableCell className="text-right font-bold text-destructive">{formatBRL(totais.saida)}</TableCell>
                <TableCell className={`text-right font-bold ${totais.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>{formatBRL(totais.saldo)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Fechamento Diário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dinheiro/PIX</Label><Input type="number" value={form.dinheiroPix} onChange={e => setForm(p => ({ ...p, dinheiroPix: e.target.value }))} /></div>
              <div><Label>Débito</Label><Input type="number" value={form.debito} onChange={e => setForm(p => ({ ...p, debito: e.target.value }))} /></div>
              <div><Label>Crédito</Label><Input type="number" value={form.credito} onChange={e => setForm(p => ({ ...p, credito: e.target.value }))} /></div>
              <div><Label>iFood</Label><Input type="number" value={form.ifood} onChange={e => setForm(p => ({ ...p, ifood: e.target.value }))} /></div>
              <div><Label>Motoboy Diária</Label><Input type="number" value={form.motoboyDiaria} onChange={e => setForm(p => ({ ...p, motoboyDiaria: e.target.value }))} /></div>
              <div><Label>Motoboy Entregas</Label><Input type="number" value={form.motoboyEntregas} onChange={e => setForm(p => ({ ...p, motoboyEntregas: e.target.value }))} /></div>
              <div><Label>Compras CMV</Label><Input type="number" value={form.comprasCMV} onChange={e => setForm(p => ({ ...p, comprasCMV: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
