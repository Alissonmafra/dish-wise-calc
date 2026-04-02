import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { Insumo, UnidadeMedida } from '@/types';

const UNIDADES: { value: UnidadeMedida; label: string }[] = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'un', label: 'Unidade (un)' },
];

const emptyInsumo = { nome: '', quantidadeComprada: '', unidade: 'g' as UnidadeMedida, precoPago: '', percentualPerda: '0' };

export default function Insumos() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyInsumo);

  const filtered = state.insumos.filter(i => i.nome.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm(emptyInsumo); setEditId(null); setShowModal(true); };
  const openEdit = (i: Insumo) => {
    setForm({ nome: i.nome, quantidadeComprada: String(i.quantidadeComprada), unidade: i.unidade, precoPago: String(i.precoPago), percentualPerda: String(i.percentualPerda) });
    setEditId(i.id); setShowModal(true);
  };

  const save = () => {
    const data = {
      nome: form.nome, quantidadeComprada: parseFloat(form.quantidadeComprada) || 0,
      unidade: form.unidade, precoPago: parseFloat(form.precoPago) || 0,
      percentualPerda: parseFloat(form.percentualPerda) || 0,
      quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0,
    };
    if (editId) {
      dispatch({ type: 'SET_INSUMOS', payload: state.insumos.map(i => i.id === editId ? { ...i, ...data } : i) });
    } else {
      dispatch({ type: 'SET_INSUMOS', payload: [...state.insumos, { id: crypto.randomUUID(), ...data }] });
    }
    setShowModal(false);
  };

  const remove = (id: string) => dispatch({ type: 'SET_INSUMOS', payload: state.insumos.filter(i => i.id !== id) });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Gestão de Insumos</h1><p className="text-muted-foreground">Cadastre e gerencie ingredientes e materiais</p></div>
      <div className="flex gap-4 justify-between">
        <div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar insumo..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo Insumo</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead className="text-right">Qtd Comprada</TableHead><TableHead>Unidade</TableHead>
              <TableHead className="text-right">Preço Pago</TableHead><TableHead className="text-right">Perda %</TableHead>
              <TableHead className="text-right">Qtd Real</TableHead><TableHead className="text-right">Custo/Unidade</TableHead><TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(i => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.nome}</TableCell>
                <TableCell className="text-right">{i.quantidadeComprada}</TableCell>
                <TableCell>{i.unidade}</TableCell>
                <TableCell className="text-right">{formatBRL(i.precoPago)}</TableCell>
                <TableCell className="text-right">{i.percentualPerda}%</TableCell>
                <TableCell className="text-right">{i.quantidadeReal.toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatBRL(i.custoPorUnidade)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Insumo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantidade Comprada</Label><Input type="number" value={form.quantidadeComprada} onChange={e => setForm(p => ({ ...p, quantidadeComprada: e.target.value }))} /></div>
              <div><Label>Unidade de Medida</Label>
                <Select value={form.unidade} onValueChange={v => setForm(p => ({ ...p, unidade: v as UnidadeMedida }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preço Pago (R$)</Label><Input type="number" step="0.01" value={form.precoPago} onChange={e => setForm(p => ({ ...p, precoPago: e.target.value }))} /></div>
              <div><Label>Percentual de Perda (%)</Label><Input type="number" value={form.percentualPerda} onChange={e => setForm(p => ({ ...p, percentualPerda: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
