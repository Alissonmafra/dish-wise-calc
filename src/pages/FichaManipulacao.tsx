import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useDraftState } from '@/hooks/useDraftState';
import { sortByName } from '@/lib/alphabetical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { formatBRL } from '@/lib/formatters';
import type { ReceitaManipulacao, ReceitaIngrediente, UnidadeMedida } from '@/types';
import ExportExcelButton from '@/components/ExportExcelButton';
import type { ExportSheet } from '@/lib/exportExcel';

const UNIT_LABELS: Record<string, string> = { g: 'gr', ml: 'ml', un: 'und' };
const UNIT_OPTIONS: { value: UnidadeMedida; label: string }[] = [
  { value: 'g', label: 'Gramas' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'un', label: 'Unidade' },
];

export default function FichaManipulacao() {
  const { state, dispatch } = useApp();
  const { receitas, insumos, itensManipulados } = state;

  const initialDraft = { editingId: null as string | null, selectedManipulado: '', qtdProduzida: '', medida: '' as UnidadeMedida | '', ingredientes: [] as ReceitaIngrediente[], selInsumoId: '', selQtd: '' };
  const [draft, setDraft, clearDraft, hasDraft] = useDraftState('ficha-manipulacao', initialDraft);
  const { editingId, selectedManipulado, qtdProduzida, medida, ingredientes, selInsumoId, selQtd } = draft;
  const setSelectedManipulado = (value: string) => setDraft(p => ({ ...p, selectedManipulado: value }));
  const setQtdProduzida = (value: string) => setDraft(p => ({ ...p, qtdProduzida: value }));
  const setMedida = (value: UnidadeMedida | '') => setDraft(p => ({ ...p, medida: value }));
  const setIngredientes = (next: ReceitaIngrediente[] | ((p: ReceitaIngrediente[]) => ReceitaIngrediente[])) => setDraft(p => ({ ...p, ingredientes: typeof next === 'function' ? next(p.ingredientes) : next }));
  const setSelInsumoId = (value: string) => setDraft(p => ({ ...p, selInsumoId: value }));
  const setSelQtd = (value: string) => setDraft(p => ({ ...p, selQtd: value }));
  const [dialogOpen, setDialogOpen] = useState(hasDraft && (!editingId || receitas.some(r => r.id === editingId)));

  const resetForm = () => clearDraft();
  const openNew = () => { if (!hasDraft || editingId) setDraft(initialDraft); setDialogOpen(true); };
  const openEdit = (r: ReceitaManipulacao) => {
    if (!hasDraft || editingId !== r.id) setDraft({ ...initialDraft, editingId: r.id, selectedManipulado: r.nome, qtdProduzida: String(r.quantidadeProduzida), medida: r.unidade, ingredientes: [...r.ingredientes] });
    setDialogOpen(true);
  };

  const addIngrediente = () => {
    if (!selInsumoId || !selQtd || parseFloat(selQtd) <= 0) {
      toast.error('Selecione um insumo e informe a quantidade.');
      return;
    }
    if (ingredientes.find(i => i.insumoId === selInsumoId)) {
      toast.error('Insumo já adicionado nesta ficha.');
      return;
    }
    setIngredientes(prev => [
      ...prev,
      { id: crypto.randomUUID(), insumoId: selInsumoId, quantidade: parseFloat(selQtd) },
    ]);
    setSelInsumoId('');
    setSelQtd('');
  };

  const removeIngrediente = (id: string) => {
    setIngredientes(prev => prev.filter(i => i.id !== id));
  };

  const calcLineCost = (ing: ReceitaIngrediente) => {
    const insumo = insumos.find(i => i.id === ing.insumoId);
    return insumo ? insumo.custoPorUnidade * ing.quantidade : 0;
  };

  const custoTotal = ingredientes.reduce((s, ing) => s + calcLineCost(ing), 0);

  const handleSave = () => {
    if (!selectedManipulado) { toast.error('Selecione o nome da receita.'); return; }
    if (!qtdProduzida || parseFloat(qtdProduzida) <= 0) { toast.error('Informe a quantidade produzida.'); return; }
    if (!medida) { toast.error('Selecione a medida.'); return; }
    if (ingredientes.length === 0) { toast.error('Adicione pelo menos 1 insumo.'); return; }

    const newReceita: ReceitaManipulacao = {
      id: editingId || crypto.randomUUID(),
      nome: selectedManipulado,
      quantidadeProduzida: parseFloat(qtdProduzida),
      unidade: medida as UnidadeMedida,
      ingredientes,
      custoTotal: 0,
      custoPorUnidade: 0,
    };

    const updated = editingId
      ? receitas.map(r => r.id === editingId ? newReceita : r)
      : [...receitas, newReceita];

    dispatch({ type: 'SET_RECEITAS', payload: updated });
    toast.success(editingId ? 'Ficha atualizada!' : 'Ficha criada!');
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'SET_RECEITAS', payload: receitas.filter(r => r.id !== id) });
    toast.success('Ficha excluída.');
  };

  // Items manipulados that don't yet have a ficha (for new)
  const availableManipulados = itensManipulados.filter(
    im => !receitas.some(r => r.nome === im.nome) || (editingId && receitas.find(r => r.id === editingId)?.nome === im.nome)
  );

  const fichasOrdenadas = sortByName(receitas);
  const nomeInsumo = (id: string) => insumos.find(i => i.id === id)?.nome || '—';

  const getSheets = (): ExportSheet[] => {
    const rows: Record<string, unknown>[] = [];
    fichasOrdenadas.forEach(r => {
      const custoUnit = r.quantidadeProduzida > 0 ? r.custoTotal / r.quantidadeProduzida : 0;
      r.ingredientes.forEach((ing, idx) => {
        const insumo = insumos.find(i => i.id === ing.insumoId);
        const lineCost = insumo ? insumo.custoPorUnidade * ing.quantidade : 0;
        rows.push({
          receita: r.nome,
          quantidadeProduzida: r.quantidadeProduzida,
          unidade: UNIT_LABELS[r.unidade] || r.unidade,
          custoTotal: r.custoTotal,
          custoUnitario: custoUnit,
          item: idx + 1,
          insumo: insumo?.nome || '—',
          unidadeInsumo: insumo ? UNIT_LABELS[insumo.unidade] || insumo.unidade : '—',
          quantidade: ing.quantidade,
          preco: lineCost,
        });
      });
    });
    return [{
      name: 'Ficha Manipulacao',
      columns: [
        { header: 'Receita', key: 'receita', type: 'text' },
        { header: 'Quantidade Produzida', key: 'quantidadeProduzida', type: 'number' },
        { header: 'Unidade', key: 'unidade', type: 'text' },
        { header: 'Custo da Receita', key: 'custoTotal', type: 'currency' },
        { header: 'Custo Unitário', key: 'custoUnitario', type: 'currency' },
        { header: 'Item', key: 'item', type: 'number' },
        { header: 'Insumo', key: 'insumo', type: 'text' },
        { header: 'Unidade de Medida', key: 'unidadeInsumo', type: 'text' },
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
          <h1 className="text-2xl font-bold text-foreground">Ficha Técnica de Manipulação</h1>
          <p className="text-muted-foreground text-sm">Monte a composição de cada receita manipulada com cálculo automático de custo.</p>
        </div>
        <div className="flex gap-2">
          <ExportExcelButton fileName="Ficha_Manipulacao" getSheets={getSheets} />
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Ficha</Button>
        </div>
      </div>

      {/* KPI */}
      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Total de Fichas Cadastradas</p>
            <p className="text-2xl font-bold text-foreground">{receitas.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* List of fichas */}
      {receitas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma ficha técnica cadastrada. Clique em "Nova Ficha" para começar.
          </CardContent>
        </Card>
      ) : (
        fichasOrdenadas.map(r => {
          const custoUnit = r.quantidadeProduzida > 0 ? r.custoTotal / r.quantidadeProduzida : 0;
          return (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{r.nome}</CardTitle>
                  <div className="flex gap-6 mt-1 text-sm text-muted-foreground">
                    <span>Quantidade Produzida: <strong className="text-foreground">{r.quantidadeProduzida} {UNIT_LABELS[r.unidade]}</strong></span>
                    <span>Custo da Receita: <strong className="text-foreground">{formatBRL(r.custoTotal)}</strong></span>
                    <span>Custo Unitário: <strong className="text-foreground">R$ {custoUnit.toFixed(4)} por {UNIT_LABELS[r.unidade]}</strong></span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                    {r.ingredientes.map((ing, idx) => {
                      const insumo = insumos.find(i => i.id === ing.insumoId);
                      const lineCost = insumo ? insumo.custoPorUnidade * ing.quantidade : 0;
                      return (
                        <TableRow key={ing.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{insumo?.nome || '—'}</TableCell>
                          <TableCell>{insumo ? UNIT_LABELS[insumo.unidade] || insumo.unidade : '—'}</TableCell>
                          <TableCell className="text-right">{ing.quantidade}</TableCell>
                          <TableCell className="text-right">{formatBRL(lineCost)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { setDialogOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica de Manipulação'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Nome da Receita</Label>
              <Select value={selectedManipulado} onValueChange={setSelectedManipulado}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {sortByName(availableManipulados).map(im => (
                    <SelectItem key={im.id} value={im.nome}>{im.nome}</SelectItem>
                  ))}
                  {availableManipulados.length === 0 && (
                    <SelectItem value="__none" disabled>Nenhum item manipulado cadastrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade Produzida</Label>
              <Input type="number" min="0" step="any" value={qtdProduzida} onChange={e => setQtdProduzida(e.target.value)} placeholder="Ex: 500" />
            </div>
            <div>
              <Label>Medida</Label>
              <Select value={medida} onValueChange={v => setMedida(v as UnidadeMedida)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custo auto */}
          <div className="flex items-center gap-2 mt-2">
            <Label>Custo da Receita (R$):</Label>
            <span className="font-bold text-foreground">{formatBRL(custoTotal)}</span>
          </div>

          {/* Add ingredient row */}
          <div className="border rounded-md p-3 mt-4 space-y-3">
            <p className="text-sm font-medium">Adicionar Insumo</p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Insumo</Label>
                <Select value={selInsumoId} onValueChange={setSelInsumoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {sortByName(insumos).map(ins => (
                      <SelectItem key={ins.id} value={ins.id}>{ins.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label className="text-xs">Unidade</Label>
                <Input disabled value={selInsumoId ? (UNIT_LABELS[insumos.find(i => i.id === selInsumoId)?.unidade || ''] || '') : ''} />
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
                {ingredientes.map((ing, idx) => {
                  const insumo = insumos.find(i => i.id === ing.insumoId);
                  return (
                    <TableRow key={ing.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{insumo?.nome || '—'}</TableCell>
                      <TableCell>{insumo ? UNIT_LABELS[insumo.unidade] || insumo.unidade : '—'}</TableCell>
                      <TableCell className="text-right">{ing.quantidade}</TableCell>
                      <TableCell className="text-right">{formatBRL(calcLineCost(ing))}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeIngrediente(ing.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
