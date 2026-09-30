import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { compareNames } from '@/lib/alphabetical';
import type { ItemManipulado } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import ExportExcelButton from '@/components/ExportExcelButton';


export default function ItensManipulados() {
  const { state, dispatch } = useApp();
  const itens = state.itensManipulados;

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemManipulado | null>(null);
  const [nome, setNome] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = itens.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => compareNames(a.nome, b.nome));

  function openAdd() {
    setEditingItem(null);
    setNome('');
    setDialogOpen(true);
  }

  function openEdit(item: ItemManipulado) {
    setEditingItem(item);
    setNome(item.nome);
    setDialogOpen(true);
  }

  function handleSave() {
    const trimmed = nome.trim();
    if (!trimmed) {
      toast.error('Digite o nome da receita.');
      return;
    }

    const duplicate = itens.find(
      i => i.nome.toLowerCase() === trimmed.toLowerCase() && i.id !== editingItem?.id
    );
    if (duplicate) {
      toast.error('Já existe uma receita com esse nome.');
      return;
    }

    if (editingItem) {
      dispatch({
        type: 'SET_ITENS_MANIPULADOS',
        payload: itens.map(i => i.id === editingItem.id ? { ...i, nome: trimmed } : i),
      });
      toast.success('Receita atualizada!');
    } else {
      const newItem: ItemManipulado = {
        id: crypto.randomUUID(),
        nome: trimmed,
      };
      dispatch({ type: 'SET_ITENS_MANIPULADOS', payload: [...itens, newItem] });
      toast.success('Receita adicionada!');
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    dispatch({
      type: 'SET_ITENS_MANIPULADOS',
      payload: itens.filter(i => i.id !== deleteId),
    });
    setDeleteId(null);
    toast.success('Receita excluída!');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Itens Manipulados (Receitas)</h1>
          <p className="text-muted-foreground">Cadastre todas as receitas base, preparos intermediários e pré-produções</p>
        </div>
        <ExportExcelButton
          fileName="Itens_Manipulados"
          getSheets={() => [{
            name: 'Receitas',
            columns: [
              { header: 'Item', key: 'item', type: 'number' },
              { header: 'Nome da Receita', key: 'nome' },
            ],
            rows: filtered.map((i, idx) => ({ item: idx + 1, nome: i.nome })),
          }]}
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas Cadastradas</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{itens.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receitas Manipuladas</CardTitle>
            <Button onClick={openAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Receita
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar receita..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {itens.length === 0
                ? 'Nenhuma receita cadastrada. Clique em "Adicionar Receita" para começar.'
                : 'Nenhuma receita encontrada para a pesquisa.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Item</TableHead>
                  <TableHead>Nome da Receita</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, idx) => (
                  <TableRow key={item.id} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Receita' : 'Adicionar Receita'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome-receita">Nome da Receita</Label>
              <Input
                id="nome-receita"
                placeholder="Ex: Massa salgada, Molho de tomate, Maionese da casa..."
                value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingItem ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A receita será removida da lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
