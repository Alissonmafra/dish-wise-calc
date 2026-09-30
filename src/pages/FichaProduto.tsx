import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useDraftState } from '@/hooks/useDraftState';
import { sortByName } from '@/lib/alphabetical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ClipboardList, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatBRL } from '@/lib/formatters';
import type { ProdutoCardapio, ProdutoIngrediente } from '@/types';
import ExportExcelButton from '@/components/ExportExcelButton';
import type { ExportSheet } from '@/lib/exportExcel';

const UNIT_LABELS: Record<string, string> = { g: 'gr', ml: 'ml', un: 'und' };

export default function FichaProduto() {
  const { state, dispatch } = useApp();
  const { produtos, insumos, receitas, itensCardapio } = state;

  const initialDraft = { editingId: null as string | null, selectedCardapio: '', qtdProduzida: '1', ingredientes: [] as ProdutoIngrediente[], selRef: '', selQtd: '' };
  const [draft, setDraft, clearDraft, hasDraft] = useDraftState('ficha-produto', initialDraft);
  const { editingId, selectedCardapio, qtdProduzida, ingredientes, selRef, selQtd } = draft;
  const setSelectedCardapio = (value: string) => setDraft(p => ({ ...p, selectedCardapio: value }));
  const setQtdProduzida = (value: string) => setDraft(p => ({ ...p, qtdProduzida: value }));
  const setIngredientes = (next: ProdutoIngrediente[] | ((p: ProdutoIngrediente[]) => ProdutoIngrediente[])) => setDraft(p => ({ ...p, ingredientes: typeof next === 'function' ? next(p.ingredientes) : next }));
  const setSelRef = (value: string) => setDraft(p => ({ ...p, selRef: value }));
  const setSelQtd = (value: string) => setDraft(p => ({ ...p, selQtd: value }));
  const [dialogOpen, setDialogOpen] = useState(hasDraft && (!editingId || produtos.some(p => p.id === editingId)));

  const resetForm = () => clearDraft();
  const openNew = () => { if (!hasDraft || editingId) setDraft(initialDraft); setDialogOpen(true); };
  const openEdit = (p: ProdutoCardapio) => {
    if (!hasDraft || editingId !== p.id) setDraft({ ...initialDraft, editingId: p.id, selectedCardapio: p.nome, ingredientes: [...p.ingredientes] });
    setDialogOpen(true);
  };
  const openDuplicate = (p: ProdutoCardapio) => {
    setDraft({ ...initialDraft, ingredientes: p.ingredientes.map(ing => ({ ...ing, id: crypto.randomUUID() })) });
    setDialogOpen(true);
    toast.info('Ficha duplicada. Selecione o novo item do cardápio e salve.');
  };

ingId(null);
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (p: ProdutoCardapio) => {
    setEditingId(p.id);
    setSelectedCardapio(p.nome);
    setQtdProduzida('1');
    setIngredientes([...p.ingredientes]);
    setDialogOpen(true);
  };

  const openDuplicate = (p: ProdutoCardapio) => {
    resetForm();
    setIngredientes(p.ingredientes.map(ing => ({ ...ing, id: crypto.randomUUID() })));
    setDialogOpen(true);
    toast.info('Ficha duplicada. Selecione o novo item do cardápio e salve.');
  };

  const parseRef = (val: string) => {
    const [tipo, id] = val.split(':');
    return { tipo: tipo as 'insumo' | 'receita', id };
  };

  const getRefUnit = (tipo: string, id: string): string => {
    if (tipo === 'insumo') {
      const ins = insumos.find(i => i.id === id);
      return ins ? UNIT_LABELS[ins.unidade] || ins.unidade : '—';
    }
    const rec = receitas.find(r => r.id === id);
    return rec ? UNIT_LABELS[rec.unidade] || rec.unidade : '—';
  };

  const getRefName = (tipo: string, id: string): string => {
    if (tipo === 'insumo') return insumos.find(i => i.id === id)?.nome || '—';
    return receitas.find(r => r.id === id)?.nome || '—';
  };

  const getRefCost = (tipo: string, id: string): number => {
    if (tipo === 'insumo') return insumos.find(i => i.id === id)?.custoPorUnidade || 0;
    return receitas.find(r => r.id === id)?.custoPorUnidade || 0;
  };

  const calcLineCost = (ing: ProdutoIngrediente) => getRefCost(ing.tipo, ing.referenciaId) * ing.quantidade;

  const custoTotal = ingredientes.reduce((s, ing) => s + calcLineCost(ing), 0);

  const addIngrediente = () => {
    if (!selRef || !selQtd || parseFloat(selQtd) <= 0) {
      toast.error('Selecione um item e informe a quantidade.');
      return;
    }
    const { tipo, id } = parseRef(selRef);
    if (ingredientes.find(i => i.tipo === tipo && i.referenciaId === id)) {
      toast.error('Item já adicionado nesta ficha.');
      return;
    }
    setIngredientes(prev => [
      ...prev,
      { id: crypto.randomUUID(), tipo, referenciaId: id, quantidade: parseFloat(selQtd) },
    ]);
    setSelRef('');
    setSelQtd('');
  };

  const removeIngrediente = (id: string) => {
    setIngredientes(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = () => {
    if (!selectedCardapio) { toast.error('Selecione o item do cardápio.'); return; }
    if (!qtdProduzida || parseFloat(qtdProduzida) <= 0) { toast.error('Informe a quantidade produzida.'); return; }
    if (ingredientes.length === 0) { toast.error('Adicione pelo menos 1 item na composição.'); return; }

    const newProduto: ProdutoCardapio = {
      id: editingId || crypto.randomUUID(),
      nome: selectedCardapio,
      ingredientes,
      custoEmbalagem: 0,
      cmv: 0,
    };

    const updated = editingId
      ? produtos.map(p => p.id === editingId ? newProduto : p)
      : [...produtos, newProduto];

    dispatch({ type: 'SET_PRODUTOS', payload: updated });
    toast.success(editingId ? 'Ficha atualizada!' : 'Ficha criada!');
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'SET_PRODUTOS', payload: produtos.filter(p => p.id !== id) });
    toast.success('Ficha excluída.');
  };

  const selectedUnit = selRef ? (() => { const { tipo, id } = parseRef(selRef); return getRefUnit(tipo, id); })() : '';

  // Items do cardápio available for new fichas
  const availableCardapio = itensCardapio.filter(
    ic => !produtos.some(p => p.nome === ic.nome) || (editingId && produtos.find(p => p.id === editingId)?.nome === ic.nome)
  );

  const fichasOrdenadas = sortByName(produtos);

  const getSheets = (): ExportSheet[] => {
    const rows: Record<string, unknown>[] = [];
    fichasOrdenadas.forEach(p => {
      p.ingredientes.forEach((ing, idx) => {
        rows.push({
          produto: p.nome,
          custoProduto: p.cmv,
          item: idx + 1,
          insumo: getRefName(ing.tipo, ing.referenciaId),
          unidade: getRefUnit(ing.tipo, ing.referenciaId),
          quantidade: ing.quantidade,
          preco: calcLineCost(ing),
        });
      });
    });
    return [{
      name: 'Ficha Produto',
      columns: [
        { header: 'Produto', key: 'produto', type: 'text' },
        { header: 'Custo do Produto', key: 'custoProduto', type: 'currency' },
        { header: 'Item', key: 'item', type: 'number' },
        { header: 'Insumo', key: 'insumo', type: 'text' },
        { header: 'Unidade de Medida', key: 'unidade', type: 'text' },
        { header: 'Quantidade', key: 'quantidade', type: 'number' },
        { header: 'Preço (R$)', key: 'preco', type: 'currency' },
      ],
      rows,
    }];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ficha Técnica do Produto</h1>
          <p className="text-muted-foreground text-sm">Monte a composição de cada produto do cardápio com cálculo automático de custo.</p>
        </div>
        <div className="flex gap-2">
          <ExportExcelButton fileName="Ficha_Produto" getSheets={getSheets} />
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Ficha</Button>
        </div>
      </div>

      {/* KPI */}
      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Total de Fichas Cadastradas</p>
            <p className="text-2xl font-bold text-foreground">{produtos.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {produtos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma ficha técnica cadastrada. Clique em "Nova Ficha" para começar.
          </CardContent>
        </Card>
      ) : (
        fichasOrdenadas.map(p => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg">{p.nome}</CardTitle>
                <div className="flex gap-6 mt-1 text-sm text-muted-foreground">
                  <span>Quantidade Produzida: <strong className="text-foreground">1 und</strong></span>
                  <span>Custo do Produto: <strong className="text-foreground">{formatBRL(p.cmv)}</strong></span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" title="Duplicar ficha" onClick={() => openDuplicate(p)}><Copy className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Item</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Unidade de Medida</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Preço (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.ingredientes.map((ing, idx) => (
                    <TableRow key={ing.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{getRefName(ing.tipo, ing.referenciaId)}</TableCell>
                      <TableCell>{getRefUnit(ing.tipo, ing.referenciaId)}</TableCell>
                      <TableCell className="text-right">{ing.quantidade}</TableCell>
                      <TableCell className="text-right">{formatBRL(calcLineCost(ing))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { setDialogOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica do Produto'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Item do Cardápio</Label>
              <Select value={selectedCardapio} onValueChange={setSelectedCardapio}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {sortByName(availableCardapio).map(ic => (
                    <SelectItem key={ic.id} value={ic.nome}>{ic.nome}</SelectItem>
                  ))}
                  {availableCardapio.length === 0 && (
                    <SelectItem value="__none" disabled>Nenhum item do cardápio cadastrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade Produzida</Label>
              <Input type="number" min="1" step="1" value={qtdProduzida} onChange={e => setQtdProduzida(e.target.value)} placeholder="1" />
            </div>
          </div>

          {/* Custo auto */}
          <div className="flex items-center gap-2 mt-2">
            <Label>Custo do Produto (R$):</Label>
            <span className="font-bold text-foreground">{formatBRL(custoTotal)}</span>
          </div>

          {/* Add ingredient row */}
          <div className="border rounded-md p-3 mt-4 space-y-3">
            <p className="text-sm font-medium">Adicionar Item à Composição</p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Insumo / Receita</Label>
                <Select value={selRef} onValueChange={setSelRef}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Insumos</SelectLabel>
                      {sortByName(insumos).map(ins => (
                        <SelectItem key={ins.id} value={`insumo:${ins.id}`}>{ins.nome}</SelectItem>
                      ))}
                    </SelectGroup>
                    {receitas.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Receitas Manipuladas</SelectLabel>
                        {sortByName(receitas).map(rec => (
                          <SelectItem key={rec.id} value={`receita:${rec.id}`}>{rec.nome}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label className="text-xs">Unidade</Label>
                <Input disabled value={selectedUnit} />
              </div>
              <div className="w-28">
                <Label className="text-xs">Quantidade</Label>
                <Input type="number" min="0" step="any" value={selQtd} onChange={e => setSelQtd(e.target.value)} placeholder="0" />
              </div>
              <Button type="button" size="sm" onClick={addIngrediente}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Ingredients table */}
          {ingredientes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Item</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço (R$)</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientes.map((ing, idx) => (
                  <TableRow key={ing.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{getRefName(ing.tipo, ing.referenciaId)}</TableCell>
                    <TableCell>{getRefUnit(ing.tipo, ing.referenciaId)}</TableCell>
                    <TableCell className="text-right">{ing.quantidade}</TableCell>
                    <TableCell className="text-right">{formatBRL(calcLineCost(ing))}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeIngrediente(ing.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { clearDraft(); setDialogOpen(false); }}>Descartar</Button>
            <Button onClick={handleSave}>Salvar Ficha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
