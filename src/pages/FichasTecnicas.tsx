import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { sortByName } from '@/lib/alphabetical';
import { formatBRL } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil } from 'lucide-react';
import type { ReceitaManipulacao, ReceitaIngrediente, ProdutoCardapio, ProdutoIngrediente, UnidadeMedida } from '@/types';
import ExportExcelButton from '@/components/ExportExcelButton';
import type { ExportSheet } from '@/lib/exportExcel';

export default function FichasTecnicas() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState('receitas');

  // Receita state
  const [showReceitaModal, setShowReceitaModal] = useState(false);
  const [editReceitaId, setEditReceitaId] = useState<string | null>(null);
  const [receitaForm, setReceitaForm] = useState({ nome: '', quantidadeProduzida: '', unidade: 'g' as UnidadeMedida, ingredientes: [] as ReceitaIngrediente[] });

  // Produto state
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [editProdutoId, setEditProdutoId] = useState<string | null>(null);
  const [produtoForm, setProdutoForm] = useState({ nome: '', ingredientes: [] as ProdutoIngrediente[], custoEmbalagem: '' });

  // Receita handlers
  const openNewReceita = () => { setReceitaForm({ nome: '', quantidadeProduzida: '', unidade: 'g', ingredientes: [] }); setEditReceitaId(null); setShowReceitaModal(true); };
  const openEditReceita = (r: ReceitaManipulacao) => {
    setReceitaForm({ nome: r.nome, quantidadeProduzida: String(r.quantidadeProduzida), unidade: r.unidade, ingredientes: [...r.ingredientes] });
    setEditReceitaId(r.id); setShowReceitaModal(true);
  };
  const addReceitaIngrediente = () => setReceitaForm(p => ({ ...p, ingredientes: [...p.ingredientes, { id: crypto.randomUUID(), insumoId: '', quantidade: 0 }] }));
  const removeReceitaIngrediente = (id: string) => setReceitaForm(p => ({ ...p, ingredientes: p.ingredientes.filter(i => i.id !== id) }));
  const saveReceita = () => {
    const data: Omit<ReceitaManipulacao, 'custoTotal' | 'custoPorUnidade'> & { custoTotal: number; custoPorUnidade: number } = {
      id: editReceitaId || crypto.randomUUID(), nome: receitaForm.nome,
      quantidadeProduzida: parseFloat(receitaForm.quantidadeProduzida) || 0,
      unidade: receitaForm.unidade, ingredientes: receitaForm.ingredientes, custoTotal: 0, custoPorUnidade: 0,
    };
    if (editReceitaId) {
      dispatch({ type: 'SET_RECEITAS', payload: state.receitas.map(r => r.id === editReceitaId ? data : r) });
    } else {
      dispatch({ type: 'SET_RECEITAS', payload: [...state.receitas, data] });
    }
    setShowReceitaModal(false);
  };
  const removeReceita = (id: string) => dispatch({ type: 'SET_RECEITAS', payload: state.receitas.filter(r => r.id !== id) });

  // Produto handlers
  const openNewProduto = () => { setProdutoForm({ nome: '', ingredientes: [], custoEmbalagem: '' }); setEditProdutoId(null); setShowProdutoModal(true); };
  const openEditProduto = (p: ProdutoCardapio) => {
    setProdutoForm({ nome: p.nome, ingredientes: [...p.ingredientes], custoEmbalagem: String(p.custoEmbalagem) });
    setEditProdutoId(p.id); setShowProdutoModal(true);
  };
  const addProdutoIngrediente = () => setProdutoForm(p => ({ ...p, ingredientes: [...p.ingredientes, { id: crypto.randomUUID(), tipo: 'insumo' as const, referenciaId: '', quantidade: 0 }] }));
  const removeProdutoIngrediente = (id: string) => setProdutoForm(p => ({ ...p, ingredientes: p.ingredientes.filter(i => i.id !== id) }));
  const saveProduto = () => {
    const data: ProdutoCardapio = {
      id: editProdutoId || crypto.randomUUID(), nome: produtoForm.nome,
      ingredientes: produtoForm.ingredientes, custoEmbalagem: parseFloat(produtoForm.custoEmbalagem) || 0, cmv: 0,
    };
    if (editProdutoId) {
      dispatch({ type: 'SET_PRODUTOS', payload: state.produtos.map(p => p.id === editProdutoId ? data : p) });
    } else {
      dispatch({ type: 'SET_PRODUTOS', payload: [...state.produtos, data] });
    }
    setShowProdutoModal(false);
  };
  const removeProduto = (id: string) => dispatch({ type: 'SET_PRODUTOS', payload: state.produtos.filter(p => p.id !== id) });

  const getInsumoNome = (id: string) => state.insumos.find(i => i.id === id)?.nome || '—';
  const getReceitaNome = (id: string) => state.receitas.find(r => r.id === id)?.nome || '—';


  const getSheets = (): ExportSheet[] => {
    const receitasRows: Record<string, unknown>[] = [];
    sortByName(state.receitas).forEach(r => {
      r.ingredientes.forEach(ing => {
        const insumo = state.insumos.find(i => i.id === ing.insumoId);
        receitasRows.push({
          receita: r.nome,
          quantidadeProduzida: r.quantidadeProduzida,
          unidade: r.unidade,
          custoTotal: r.custoTotal,
          custoPorUnidade: r.custoPorUnidade,
          insumo: insumo?.nome || '—',
          quantidade: ing.quantidade,
          custo: (insumo?.custoPorUnidade || 0) * ing.quantidade,
        });
      });
    });

    const produtosRows: Record<string, unknown>[] = [];
    sortByName(state.produtos).forEach(p => {
      p.ingredientes.forEach(ing => {
        let nome = '', custo = 0;
        if (ing.tipo === 'insumo') { const i = state.insumos.find(x => x.id === ing.referenciaId); nome = i?.nome || '—'; custo = (i?.custoPorUnidade || 0) * ing.quantidade; }
        else { const r = state.receitas.find(x => x.id === ing.referenciaId); nome = r?.nome || '—'; custo = (r?.custoPorUnidade || 0) * ing.quantidade; }
        produtosRows.push({ produto: p.nome, cmv: p.cmv, tipo: ing.tipo, item: nome, quantidade: ing.quantidade, custo });
      });
      if (p.custoEmbalagem > 0) {
        produtosRows.push({ produto: p.nome, cmv: p.cmv, tipo: '—', item: 'Embalagem', quantidade: 1, custo: p.custoEmbalagem });
      }
    });

    return [
      {
        name: 'Receitas de Manipulacao',
        columns: [
          { header: 'Receita', key: 'receita', type: 'text' },
          { header: 'Quantidade Produzida', key: 'quantidadeProduzida', type: 'number' },
          { header: 'Unidade', key: 'unidade', type: 'text' },
          { header: 'Custo Total', key: 'custoTotal', type: 'currency' },
          { header: 'Custo por Unidade', key: 'custoPorUnidade', type: 'currency' },
          { header: 'Insumo', key: 'insumo', type: 'text' },
          { header: 'Quantidade', key: 'quantidade', type: 'number' },
          { header: 'Custo', key: 'custo', type: 'currency' },
        ],
        rows: receitasRows,
      },
      {
        name: 'Produtos do Cardapio',
        columns: [
          { header: 'Produto', key: 'produto', type: 'text' },
          { header: 'CMV', key: 'cmv', type: 'currency' },
          { header: 'Tipo', key: 'tipo', type: 'text' },
          { header: 'Item', key: 'item', type: 'text' },
          { header: 'Quantidade', key: 'quantidade', type: 'number' },
          { header: 'Custo', key: 'custo', type: 'currency' },
        ],
        rows: produtosRows,
      },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Fichas Técnicas</h1><p className="text-muted-foreground">Receitas de manipulação e produtos do cardápio</p></div>
        <ExportExcelButton fileName="Fichas_Tecnicas" getSheets={getSheets} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="receitas">Receitas de Manipulação</TabsTrigger><TabsTrigger value="produtos">Produtos do Cardápio</TabsTrigger></TabsList>

        <TabsContent value="receitas" className="space-y-4">
          <div className="flex justify-end"><Button onClick={openNewReceita}><Plus className="h-4 w-4 mr-1" />Nova Receita</Button></div>
          <div className="grid gap-4">
            {sortByName(state.receitas).map(r => (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{r.nome}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditReceita(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeReceita(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 mb-3 text-sm">
                    <span>Produz: <strong>{r.quantidadeProduzida} {r.unidade}</strong></span>
                    <span>Custo Total: <strong>{formatBRL(r.custoTotal)}</strong></span>
                    <span>Custo/{r.unidade}: <strong>{formatBRL(r.custoPorUnidade)}</strong></span>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Insumo</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead className="text-right">Custo</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {r.ingredientes.map(ing => {
                        const insumo = state.insumos.find(i => i.id === ing.insumoId);
                        return (
                          <TableRow key={ing.id}>
                            <TableCell>{insumo?.nome || '—'}</TableCell>
                            <TableCell className="text-right">{ing.quantidade} {insumo?.unidade}</TableCell>
                            <TableCell className="text-right">{formatBRL((insumo?.custoPorUnidade || 0) * ing.quantidade)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={showReceitaModal} onOpenChange={setShowReceitaModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editReceitaId ? 'Editar' : 'Nova'} Receita de Manipulação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Nome</Label><Input value={receitaForm.nome} onChange={e => setReceitaForm(p => ({ ...p, nome: e.target.value }))} /></div>
                  <div><Label>Quantidade Produzida</Label><Input type="number" value={receitaForm.quantidadeProduzida} onChange={e => setReceitaForm(p => ({ ...p, quantidadeProduzida: e.target.value }))} /></div>
                  <div><Label>Unidade</Label>
                    <Select value={receitaForm.unidade} onValueChange={v => setReceitaForm(p => ({ ...p, unidade: v as UnidadeMedida }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['g','kg','L','ml','un'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2"><Label>Ingredientes</Label><Button variant="outline" size="sm" onClick={addReceitaIngrediente}><Plus className="h-3 w-3 mr-1" />Adicionar</Button></div>
                  {receitaForm.ingredientes.map((ing, idx) => (
                    <div key={ing.id} className="flex gap-2 mb-2 items-end">
                      <div className="flex-1"><Label className="text-xs">Insumo</Label>
                        <Select value={ing.insumoId} onValueChange={v => setReceitaForm(p => ({ ...p, ingredientes: p.ingredientes.map((i, j) => j === idx ? { ...i, insumoId: v } : i) }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>{sortByName(state.insumos).map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="w-28"><Label className="text-xs">Quantidade</Label><Input type="number" value={ing.quantidade || ''} onChange={e => setReceitaForm(p => ({ ...p, ingredientes: p.ingredientes.map((i, j) => j === idx ? { ...i, quantidade: parseFloat(e.target.value) || 0 } : i) }))} /></div>
                      <Button variant="ghost" size="icon" onClick={() => removeReceitaIngrediente(ing.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter><Button onClick={saveReceita}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <div className="flex justify-end"><Button onClick={openNewProduto}><Plus className="h-4 w-4 mr-1" />Novo Produto</Button></div>
          <div className="grid gap-4">
            {sortByName(state.produtos).map(p => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{p.nome}</CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">CMV: {formatBRL(p.cmv)}</span>
                    <Button variant="ghost" size="icon" onClick={() => openEditProduto(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeProduto(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead className="text-right">Custo</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {p.ingredientes.map(ing => {
                        let nome = '', custo = 0;
                        if (ing.tipo === 'insumo') { const i = state.insumos.find(x => x.id === ing.referenciaId); nome = i?.nome || '—'; custo = (i?.custoPorUnidade || 0) * ing.quantidade; }
                        else { const r = state.receitas.find(x => x.id === ing.referenciaId); nome = r?.nome || '—'; custo = (r?.custoPorUnidade || 0) * ing.quantidade; }
                        return (<TableRow key={ing.id}><TableCell className="capitalize">{ing.tipo}</TableCell><TableCell>{nome}</TableCell><TableCell className="text-right">{ing.quantidade}</TableCell><TableCell className="text-right">{formatBRL(custo)}</TableCell></TableRow>);
                      })}
                      {p.custoEmbalagem > 0 && <TableRow><TableCell>—</TableCell><TableCell>Embalagem</TableCell><TableCell className="text-right">1</TableCell><TableCell className="text-right">{formatBRL(p.custoEmbalagem)}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={showProdutoModal} onOpenChange={setShowProdutoModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editProdutoId ? 'Editar' : 'Novo'} Produto do Cardápio</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nome do Produto</Label><Input value={produtoForm.nome} onChange={e => setProdutoForm(p => ({ ...p, nome: e.target.value }))} /></div>
                  <div><Label>Custo Embalagem (R$)</Label><Input type="number" step="0.01" value={produtoForm.custoEmbalagem} onChange={e => setProdutoForm(p => ({ ...p, custoEmbalagem: e.target.value }))} /></div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2"><Label>Composição</Label><Button variant="outline" size="sm" onClick={addProdutoIngrediente}><Plus className="h-3 w-3 mr-1" />Adicionar</Button></div>
                  {produtoForm.ingredientes.map((ing, idx) => (
                    <div key={ing.id} className="flex gap-2 mb-2 items-end">
                      <div className="w-28"><Label className="text-xs">Tipo</Label>
                        <Select value={ing.tipo} onValueChange={v => setProdutoForm(p => ({ ...p, ingredientes: p.ingredientes.map((i, j) => j === idx ? { ...i, tipo: v as 'insumo' | 'receita', referenciaId: '' } : i) }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="insumo">Insumo</SelectItem><SelectItem value="receita">Receita</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1"><Label className="text-xs">Item</Label>
                        <Select value={ing.referenciaId} onValueChange={v => setProdutoForm(p => ({ ...p, ingredientes: p.ingredientes.map((i, j) => j === idx ? { ...i, referenciaId: v } : i) }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {ing.tipo === 'insumo' ? sortByName(state.insumos).map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>) : sortByName(state.receitas).map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-28"><Label className="text-xs">Quantidade</Label><Input type="number" value={ing.quantidade || ''} onChange={e => setProdutoForm(p => ({ ...p, ingredientes: p.ingredientes.map((i, j) => j === idx ? { ...i, quantidade: parseFloat(e.target.value) || 0 } : i) }))} /></div>
                      <Button variant="ghost" size="icon" onClick={() => removeProdutoIngrediente(ing.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter><Button onClick={saveProduto}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
