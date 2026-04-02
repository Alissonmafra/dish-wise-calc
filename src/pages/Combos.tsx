import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Pencil } from 'lucide-react';
import type { Combo } from '@/types';

export default function Combos() {
  const { state, dispatch, dnaTotal } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', produtos: [] as { produtoId: string; quantidade: number }[] });
  const [simParams, setSimParams] = useState<Record<string, { margem: number; taxaIfood: number; entrega: number; cupom: number }>>({});

  const openNew = () => { setForm({ nome: '', produtos: [] }); setEditId(null); setShowModal(true); };
  const openEdit = (c: Combo) => { setForm({ nome: c.nome, produtos: [...c.produtos] }); setEditId(c.id); setShowModal(true); };

  const save = () => {
    const data: Combo = { id: editId || crypto.randomUUID(), nome: form.nome, produtos: form.produtos, cmvTotal: 0 };
    if (editId) dispatch({ type: 'SET_COMBOS', payload: state.combos.map(c => c.id === editId ? data : c) });
    else dispatch({ type: 'SET_COMBOS', payload: [...state.combos, data] });
    setShowModal(false);
  };

  const remove = (id: string) => dispatch({ type: 'SET_COMBOS', payload: state.combos.filter(c => c.id !== id) });

  const getSim = (id: string) => simParams[id] || { margem: 10, taxaIfood: 19, entrega: 5, cupom: 3 };
  const setSim = (id: string, upd: Partial<ReturnType<typeof getSim>>) => setSimParams(p => ({ ...p, [id]: { ...getSim(id), ...upd } }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Gestão de Combos</h1><p className="text-muted-foreground">Crie combos e simule preços de venda</p></div>
      <div className="flex justify-end"><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo Combo</Button></div>

      <div className="grid gap-6">
        {state.combos.map(c => {
          const sim = getSim(c.id);
          const pvNormal = (1 - dnaTotal / 100 - sim.margem / 100) > 0 ? c.cmvTotal / (1 - dnaTotal / 100 - sim.margem / 100) : 0;
          const pvIfood = (1 - dnaTotal / 100 - sim.taxaIfood / 100 - sim.margem / 100) > 0 ? (c.cmvTotal + sim.entrega + sim.cupom) / (1 - dnaTotal / 100 - sim.taxaIfood / 100 - sim.margem / 100) : 0;

          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{c.nome} <span className="text-sm font-normal text-muted-foreground">— CMV: {formatBRL(c.cmvTotal)}</span></CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  {c.produtos.map(cp => {
                    const prod = state.produtos.find(p => p.id === cp.produtoId);
                    return <p key={cp.produtoId} className="text-sm">{cp.quantidade}x {prod?.nome || '—'} — {formatBRL((prod?.cmv || 0) * cp.quantidade)}</p>;
                  })}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div><Label className="text-xs">Margem (%)</Label><Input type="number" value={sim.margem} onChange={e => setSim(c.id, { margem: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label className="text-xs">Taxa iFood (%)</Label><Input type="number" value={sim.taxaIfood} onChange={e => setSim(c.id, { taxaIfood: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label className="text-xs">Entrega (R$)</Label><Input type="number" value={sim.entrega} onChange={e => setSim(c.id, { entrega: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label className="text-xs">Cupom (R$)</Label><Input type="number" value={sim.cupom} onChange={e => setSim(c.id, { cupom: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">PV Normal</p><p className="text-2xl font-bold text-primary">{formatBRL(pvNormal)}</p></div>
                  <div className="p-4 bg-destructive/10 rounded-lg text-center"><p className="text-xs text-muted-foreground">PV iFood</p><p className="text-2xl font-bold text-destructive">{formatBRL(pvIfood)}</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Combo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome do Combo</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div>
              <div className="flex justify-between items-center mb-2"><Label>Produtos</Label><Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, produtos: [...p.produtos, { produtoId: '', quantidade: 1 }] }))}><Plus className="h-3 w-3 mr-1" />Adicionar</Button></div>
              {form.produtos.map((cp, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <Select value={cp.produtoId} onValueChange={v => setForm(p => ({ ...p, produtos: p.produtos.map((x, j) => j === idx ? { ...x, produtoId: v } : x) }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{state.produtos.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-20"><Input type="number" value={cp.quantidade} onChange={e => setForm(p => ({ ...p, produtos: p.produtos.map((x, j) => j === idx ? { ...x, quantidade: parseInt(e.target.value) || 1 } : x) }))} /></div>
                  <Button variant="ghost" size="icon" onClick={() => setForm(p => ({ ...p, produtos: p.produtos.filter((_, j) => j !== idx) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
