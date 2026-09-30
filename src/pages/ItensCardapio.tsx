import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { sortByName, compareNames } from '@/lib/alphabetical';
import type { ItemCardapio } from '@/types';
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
import { Plus, Search, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import ExportExcelButton from '@/components/ExportExcelButton';


export default function ItensCardapio() {
  const { state, dispatch } = useApp();
  const itens = state.itensCardapio;

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCardapio | null>(null);
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

  function openEdit(item: ItemCardapio) {
    setEditingItem(item);
    setNome(item.nome);
    setDialogOpen(true);
  }

  function handleSave() {
    const trimmed = nome.trim();
    if (!trimmed) {
      toast.error('Digite o nome do produto.');
      return;
    }

    const duplicate = itens.find(
      i => i.nome.toLowerCase() === trimmed.toLowerCase() && i.id !== editingItem?.id
    );
    if (duplicate) {
      toast.error('Já existe um produto com esse nome.');
      return;
    }

    if (editingItem) {
      dispatch({
        type: 'SET_ITENS_CARDAPIO',
        payload: itens.map(i => i.id === editingItem.id ? { ...i, nome: trimmed } : i),
      });
      toast.success('Produto atualizado!');
    } else {
      const newItem: ItemCardapio = {
        id: crypto.randomUUID(),
        nome: trimmed,
      };
      dispatch({ type: 'SET_ITENS_CARDAPIO', payload: [...itens, newItem] });
      toast.success('Produto adicionado!');
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    dispatch({
      type: 'SET_ITENS_CARDAPIO',
      payload: itens.filter(i => i.id !== deleteId),
    });
    setDeleteId(null);
    toast.success('Produto excluído!');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Itens do Cardápio</h1>
          <p className="text-muted-foreground">Cadastre todos os produtos disponíveis para venda</p>
        </div>
        <ExportExcelButton
          fileName="Itens_Cardapio"
          getSheets={() => [{
            name: 'Itens do Cardápio',
            columns: [
              { header: 'Item', key: 'item', type: 'number' },
              { header: 'Nome do Produto', key: 'nome' },
            ],
            rows: filtered.map((i, idx) => ({ item: idx + 1, nome: i.nome })),
          }]}
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produtos Cadastrados</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{itens.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produtos do Cardápio</CardTitle>
            <Button onClick={openAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Item
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produto..."
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
                ? 'Nenhum produto cadastrado. Clique em "Adicionar Item" para começar.'
                : 'Nenhum produto encontrado para a pesquisa.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Item</TableHead>
                  <TableHead>Nome do Produto</TableHead>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome-produto">Nome do Produto</Label>
              <Input
                id="nome-produto"
                placeholder="Ex: Hambúrguer, Coca-Cola 600ml, Açaí 500ml..."
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O produto será removido da lista.
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
