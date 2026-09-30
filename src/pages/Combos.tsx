import { useApp } from '@/contexts/AppContext';
import { useDraftState } from '@/hooks/useDraftState';
import { sortByName, compareNames } from '@/lib/alphabetical';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import type { Combo } from '@/types';
import ExportExcelButton from '@/components/ExportExcelButton';
import type { ExportSheet } from '@/lib/exportExcel';

interface ComboLocal {
  id: string;
  nome: string;
  produtos: { produtoId: string; quantidade: number }[];
  lucroEst: number;
  taxaIfood: number;
  entrega: number;
  cupom: number;
}

export default function Combos() {
  const { state, dispatch, dnaTotal } = useApp();
  const produtosDisponiveis = sortByName(state.produtos.filter(p => p.cmv > 0));

  const [combos, setCombos] = useDraftState<ComboLocal[]>('combos-edicao', () =>
    state.combos.map(c => ({
      id: c.id,
      nome: c.nome,
      produtos: c.produtos,
      lucroEst: 10,
      taxaIfood: 19,
      entrega: 5,
      cupom: 0,
    }))
  );

  const persist = (updated: ComboLocal[]) => {
    setCombos(updated);
    const payload: Combo[] = updated.map(c => {
      const cmvTotal = c.produtos.reduce((acc, p) => {
        const prod = state.produtos.find(pr => pr.id === p.produtoId);
        return acc + (prod?.cmv || 0) * p.quantidade;
      }, 0);
      return { id: c.id, nome: c.nome, produtos: c.produtos, cmvTotal };
    });
    dispatch({ type: 'SET_COMBOS', payload });
  };

  const addCombo = () => {
    persist([...combos, { id: crypto.randomUUID(), nome: '', produtos: [], lucroEst: 10, taxaIfood: 19, entrega: 5, cupom: 0 }]);
  };

  const removeCombo = (id: string) => persist(combos.filter(c => c.id !== id));

  const updateCombo = (id: string, upd: Partial<ComboLocal>) => {
    persist(combos.map(c => c.id === id ? { ...c, ...upd } : c));
  };

  const addProduto = (comboId: string) => {
    persist(combos.map(c => c.id === comboId ? { ...c, produtos: [...c.produtos, { produtoId: '', quantidade: 1 }] } : c));
  };

  const updateProduto = (comboId: string, idx: number, upd: Partial<{ produtoId: string; quantidade: number }>) => {
    persist(combos.map(c => c.id === comboId ? { ...c, produtos: c.produtos.map((p, i) => i === idx ? { ...p, ...upd } : p) } : c));
  };

  const removeProduto = (comboId: string, idx: number) => {
    persist(combos.map(c => c.id === comboId ? { ...c, produtos: c.produtos.filter((_, i) => i !== idx) } : c));
  };

  const combosOrdenados = [...combos].sort((a, b) => a.nome.trim() && b.nome.trim() ? compareNames(a.nome, b.nome) : a.nome.trim() ? -1 : b.nome.trim() ? 1 : 0);

  const getSheets = (): ExportSheet[] => {
    const combosRows = combosOrdenados.map(c => {
      const dna = dnaTotal / 100;
      const lucro = c.lucroEst / 100;
      const ifood = c.taxaIfood / 100;
      const cmvTotal = c.produtos.reduce((acc, p) => {
        const prod = state.produtos.find(pr => pr.id === p.produtoId);
        return acc + (prod?.cmv || 0) * p.quantidade;
      }, 0);
      const qtdTotal = c.produtos.reduce((acc, p) => acc + p.quantidade, 0);
      const pvInvalid = dna + lucro >= 1;
      const ifoodInvalid = ifood >= 1;
      const pv = pvInvalid || cmvTotal === 0 ? null : cmvTotal / (1 - dna - lucro);
      const pvIfood = pv == null || ifoodInvalid ? null : ((pv + c.entrega) / (1 - ifood)) + c.cupom;
      return {
        nome: c.nome,
        qtdProdutos: qtdTotal,
        dna,
        lucroEstimado: lucro,
        cmvTotal,
        precoVenda: pv,
        taxaIfood: ifood,
        entrega: c.entrega,
        precoIfood: pvIfood,
        cupom: c.cupom,
      };
    });

    const produtosRows = combosOrdenados.flatMap(c =>
      c.produtos.map(cp => {
        const prod = state.produtos.find(p => p.id === cp.produtoId);
        return {
          combo: c.nome,
          produto: prod?.nome ?? '',
          quantidade: cp.quantidade,
          cmv: (prod?.cmv || 0) * cp.quantidade,
        };
      })
    );

    return [
      {
        name: 'Combos',
        columns: [
          { header: 'Nome do Combo', key: 'nome', type: 'text' },
          { header: 'Qtd. Produtos', key: 'qtdProdutos', type: 'number' },
          { header: 'DNA (%)', key: 'dna', type: 'percent' },
          { header: 'Lucro Estimado (%)', key: 'lucroEstimado', type: 'percent' },
          { header: 'Custo do Combo (R$)', key: 'cmvTotal', type: 'currency' },
          { header: 'Preço de Venda (R$)', key: 'precoVenda', type: 'currency' },
          { header: 'Taxa iFood (%)', key: 'taxaIfood', type: 'percent' },
          { header: 'Entrega (R$)', key: 'entrega', type: 'currency' },
          { header: 'PV iFood (R$)', key: 'precoIfood', type: 'currency' },
          { header: 'Cupom (R$)', key: 'cupom', type: 'currency' },
        ],
        rows: combosRows,
      },
      {
        name: 'Produtos dos Combos',
        columns: [
          { header: 'Combo', key: 'combo', type: 'text' },
          { header: 'Produto', key: 'produto', type: 'text' },
          { header: 'Quantidade', key: 'quantidade', type: 'number' },
          { header: 'CMV + Embalagem (R$)', key: 'cmv', type: 'currency' },
        ],
        rows: produtosRows,
      },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Combos</h1>
          <p className="text-muted-foreground">Monte combos promocionais e calcule o preço ideal de venda</p>
        </div>
        <ExportExcelButton fileName="Combos" getSheets={getSheets} />
      </div>
      <div className="flex justify-end">
        <Button onClick={addCombo}><Plus className="h-4 w-4 mr-1" />Novo Combo</Button>
      </div>

      <div className="grid gap-6">
        {combosOrdenados.map(c => {
          const dna = dnaTotal / 100;
          const lucro = c.lucroEst / 100;
          const ifood = c.taxaIfood / 100;

          const cmvTotal = c.produtos.reduce((acc, p) => {
            const prod = state.produtos.find(pr => pr.id === p.produtoId);
            return acc + (prod?.cmv || 0) * p.quantidade;
          }, 0);

          const qtdTotal = c.produtos.reduce((acc, p) => acc + p.quantidade, 0);

          const pvInvalid = dna + lucro >= 1;
          const ifoodInvalid = ifood >= 1;
          const pv = pvInvalid || cmvTotal === 0 ? null : cmvTotal / (1 - dna - lucro);
          const pvIfood = pv == null || ifoodInvalid ? null : ((pv + c.entrega) / (1 - ifood)) + c.cupom;

          return (
            <Card key={c.id}>
              <CardContent className="p-6 space-y-4">
                {/* Header grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome do Combo</Label>
                    <Input value={c.nome} onChange={e => updateCombo(c.id, { nome: e.target.value })} placeholder="Ex: X-Burguer + Coca" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Qtd. Produtos do Combo</Label>
                    <p className="h-10 flex items-center text-sm font-medium text-muted-foreground">{qtdTotal}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">DNA (%)</Label>
                    <p className="h-10 flex items-center text-sm font-medium text-muted-foreground">{formatPercent(dnaTotal)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Lucro Estimado (%)</Label>
                    <Input type="number" value={c.lucroEst} onChange={e => updateCombo(c.id, { lucroEst: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Custo do Combo | Preço de Venda (R$)</Label>
                    {pvInvalid
                      ? <p className="h-10 flex items-center text-sm font-semibold text-destructive">Percentual inválido</p>
                      : <p className="h-10 flex items-center text-sm font-bold text-primary">{pv != null ? formatBRL(pv) : '-'}</p>
                    }
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Taxa iFood (%)</Label>
                    <Input type="number" value={c.taxaIfood} onChange={e => updateCombo(c.id, { taxaIfood: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Entrega (R$)</Label>
                    <Input type="number" value={c.entrega} onChange={e => updateCombo(c.id, { entrega: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Custo do Combo | PV iFood (R$)</Label>
                    {ifoodInvalid
                      ? <p className="h-10 flex items-center text-sm font-semibold text-destructive">Percentual inválido</p>
                      : <p className="h-10 flex items-center text-sm font-bold text-primary">{pvIfood != null ? formatBRL(pvIfood) : '-'}</p>
                    }
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cupom (R$)</Label>
                    <Input type="number" value={c.cupom} onChange={e => updateCombo(c.id, { cupom: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                {/* Products grade */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-semibold">Produtos do Combo</Label>
                    <Button variant="outline" size="sm" onClick={() => addProduto(c.id)}><Plus className="h-3 w-3 mr-1" />Adicionar Produto</Button>
                  </div>
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-28">Quantidade</TableHead>
                          <TableHead className="w-40">CMV + Embalagem (R$)</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {c.produtos.length === 0 && (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum produto adicionado</TableCell></TableRow>
                        )}
                        {c.produtos.map((cp, idx) => {
                          const prod = state.produtos.find(p => p.id === cp.produtoId);
                          const cmvLinha = (prod?.cmv || 0) * cp.quantidade;
                          return (
                            <TableRow key={idx} className={idx % 2 === 1 ? 'bg-muted/40' : ''}>
                              <TableCell>
                                <Select value={cp.produtoId} onValueChange={v => updateProduto(c.id, idx, { produtoId: v })}>
                                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                  <SelectContent>{produtosDisponiveis.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.nome}</SelectItem>)}</SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input type="number" min={1} value={cp.quantidade} onChange={e => updateProduto(c.id, idx, { quantidade: parseInt(e.target.value) || 1 })} />
                              </TableCell>
                              <TableCell className="text-muted-foreground font-medium">{prod ? formatBRL(cmvLinha) : '-'}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeProduto(c.id, idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {c.produtos.length > 0 && (
                    <p className="text-sm text-right mt-1 text-muted-foreground">Custo Base do Combo: <span className="font-semibold text-foreground">{formatBRL(cmvTotal)}</span></p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button variant="destructive" size="sm" onClick={() => removeCombo(c.id)}><Trash2 className="h-4 w-4 mr-1" />Excluir Combo</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {combos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum combo criado. Clique em "Novo Combo" para começar.</p>
        </div>
      )}
    </div>
  );
}
