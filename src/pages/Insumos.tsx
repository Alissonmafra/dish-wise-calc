import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { sortByName } from '@/lib/alphabetical';
import { formatBRL } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Insumo, UnidadeMedida } from '@/types';
import ExportExcelButton from '@/components/ExportExcelButton';
import type { ExportSheet } from '@/lib/exportExcel';

const UNIDADES: { value: UnidadeMedida; label: string }[] = [
  { value: 'g', label: 'Grama (gr)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'un', label: 'Unidade (und)' },
];

const UNIT_LABELS: Record<string, string> = { g: 'gr', ml: 'ml', un: 'und' };

const emptyForm = { nome: '', quantidadeComprada: '', unidade: 'g' as UnidadeMedida, precoPago: '', percentualPerda: '0' };

export default function Insumos() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = sortByName(state.insumos.filter(i => i.nome.toLowerCase().includes(search.toLowerCase())));

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (i: Insumo) => {
    setForm({ nome: i.nome, quantidadeComprada: String(i.quantidadeComprada), unidade: i.unidade, precoPago: String(i.precoPago), percentualPerda: String(i.percentualPerda) });
    setEditId(i.id); setShowModal(true);
  };

  const save = () => {
    if (!form.nome.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    const duplicate = state.insumos.find(i => i.nome.toLowerCase() === form.nome.trim().toLowerCase() && i.id !== editId);
    if (duplicate) { toast({ title: 'Insumo duplicado', description: `Já existe um insumo com o nome "${duplicate.nome}".`, variant: 'destructive' }); return; }

    const data = {
      nome: form.nome.trim(),
      quantidadeComprada: parseFloat(form.quantidadeComprada) || 0,
      unidade: form.unidade,
      precoPago: parseFloat(form.precoPago) || 0,
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

  const getSheets = (): ExportSheet[] => [{
    name: 'Insumos',
    columns: [
      { header: 'Item', key: 'item', type: 'number' },
      { header: 'Nome', key: 'nome', type: 'text' },
      { header: 'Peso/Qtd', key: 'quantidadeComprada', type: 'number' },
      { header: 'Unidade', key: 'unidade', type: 'text' },
      { header: 'Preço (R$)', key: 'precoPago', type: 'currency' },
      { header: 'Perda (%)', key: 'percentualPerda', type: 'percent' },
      { header: 'Peso/Qtd Real', key: 'quantidadeReal', type: 'number' },
      { header: 'Preço Real (R$)', key: 'custoPorUnidade', type: 'currency' },
      { header: 'Preço por Unidade de Medida', key: 'precoPorUnidadeMedida', type: 'text' },
    ],
    rows: filtered.map((i, idx) => ({
      item: idx + 1,
      nome: i.nome,
      quantidadeComprada: i.quantidadeComprada,
      unidade: i.unidade,
      precoPago: i.precoPago,
      percentualPerda: i.percentualPerda / 100,
      quantidadeReal: i.quantidadeReal,
      custoPorUnidade: i.custoPorUnidade,
      precoPorUnidadeMedida: `R$ ${i.custoPorUnidade.toFixed(4)} por ${UNIT_LABELS[i.unidade] || i.unidade}`,
    })),
  }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cadastro de Insumos e Matéria-Prima</h1>
          <p className="text-muted-foreground">Cadastre todos os ingredientes, embalagens e materiais usados na produção</p>
        </div>
        <ExportExcelButton fileName="Insumos" getSheets={getSheets} />
      </div>

      <Card className="p-6 flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-lg"><Package className="h-6 w-6 text-primary" /></div>
        <div>
          <p className="text-sm text-muted-foreground">Total Insumos Cadastrados</p>
          <p className="text-3xl font-bold">{state.insumos.length}</p>
        </div>
      </Card>

      <div className="flex gap-4 justify-between">
        <div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar insumo..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo Insumo</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Item</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Peso/Qtd</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Preço (R$)</TableHead>
              <TableHead className="text-right">Perda (%)</TableHead>
              <TableHead className="text-right">Peso/Qtd Real</TableHead>
              <TableHead className="text-right">Preço Real (R$)</TableHead>
              <TableHead className="text-right">Preço por Unidade de Medida</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i, idx) => (
              <TableRow key={i.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium">{idx + 1}</TableCell>
                <TableCell className="font-medium">{i.nome}</TableCell>
                <TableCell className="text-right">{i.quantidadeComprada}</TableCell>
                <TableCell>{i.unidade}</TableCell>
                <TableCell className="text-right">{formatBRL(i.precoPago)}</TableCell>
                <TableCell className="text-right">{i.percentualPerda}%</TableCell>
                <TableCell className="text-right">{i.quantidadeReal.toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatBRL(i.custoPorUnidade)}</TableCell>
                <TableCell className="text-right">R$ {i.custoPorUnidade.toFixed(4)} por {UNIT_LABELS[i.unidade] || i.unidade}</TableCell>
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
            <div><Label>Nome do Insumo</Label><Input placeholder="Ex: Carne, Queijo, Embalagem..." value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Peso/Qtd</Label><Input type="number" value={form.quantidadeComprada} onChange={e => setForm(p => ({ ...p, quantidadeComprada: e.target.value }))} /></div>
              <div><Label>Unidade de Medida</Label>
                <Select value={form.unidade} onValueChange={v => setForm(p => ({ ...p, unidade: v as UnidadeMedida }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.precoPago} onChange={e => setForm(p => ({ ...p, precoPago: e.target.value }))} /></div>
              <div><Label>Perda (%)</Label><Input type="number" value={form.percentualPerda} onChange={e => setForm(p => ({ ...p, percentualPerda: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
