import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatBRL, formatPercent } from '@/lib/formatters';

interface LinhaLucro {
  id: string;
  produtoId: string;
  vendaAtual: number | '';
  entrega: number;
}

export default function LucroAtual() {
  const { state, dnaTotal } = useApp();

  const produtosComFicha = state.produtos.filter(p => p.cmv > 0);

  const [linhas, setLinhas] = useState<LinhaLucro[]>([
    { id: crypto.randomUUID(), produtoId: '', vendaAtual: '', entrega: 0 },
  ]);

  const addLinha = () =>
    setLinhas(prev => [...prev, { id: crypto.randomUUID(), produtoId: '', vendaAtual: '', entrega: 0 }]);

  const removeLinha = (id: string) =>
    setLinhas(prev => prev.filter(l => l.id !== id));

  const updateLinha = (id: string, field: keyof LinhaLucro, value: string | number) =>
    setLinhas(prev => prev.map(l => (l.id === id ? { ...l, [field]: value } : l)));

  const calcLinha = (l: LinhaLucro) => {
    const produto = state.produtos.find(p => p.id === l.produtoId);
    const cmv = produto?.cmv ?? 0;
    const venda = typeof l.vendaAtual === 'number' ? l.vendaAtual : 0;
    const valid = l.produtoId && venda > 0;
    if (!valid) return { cmv, lucro: null, pct: null, valid: false };
    const taxas = venda * (dnaTotal / 100);
    const lucro = venda - taxas - l.entrega - cmv;
    const pct = (lucro / venda) * 100;
    return { cmv, lucro, pct, valid: true };
  };

  const linhasValidas = linhas.map(l => ({ ...l, ...calcLinha(l) })).filter(l => l.valid);
  const mediaPct =
    linhasValidas.length > 0
      ? linhasValidas.reduce((s, l) => s + (l.pct ?? 0), 0) / linhasValidas.length
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lucro Atual</h1>
        <p className="text-muted-foreground">Diagnóstico de lucro/prejuízo com base no preço de venda praticado hoje</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Analisados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{linhasValidas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">DNA da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPercent(dnaTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média de Lucro/Prejuízo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${mediaPct !== null ? (mediaPct >= 0 ? 'text-green-600' : 'text-destructive') : 'text-muted-foreground'}`}>
              {mediaPct !== null ? (
                <>
                  {mediaPct >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {formatPercent(mediaPct)}
                </>
              ) : (
                '-'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise de Lucro por Produto
            </CardTitle>
            <Button onClick={addLinha} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Linha
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Item</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor de Venda Atual (R$)</TableHead>
                  <TableHead>DNA (%)</TableHead>
                  <TableHead>Entrega (R$)</TableHead>
                  <TableHead>CMV + Embalagem (R$)</TableHead>
                  <TableHead>Lucro Atual (R$)</TableHead>
                  <TableHead>Lucro/Prejuízo (%)</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((linha, idx) => {
                  const calc = calcLinha(linha);
                  return (
                    <TableRow key={linha.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <Select
                          value={linha.produtoId}
                          onValueChange={v => updateLinha(linha.id, 'produtoId', v)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecionar produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtosComFicha.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="w-[130px]"
                          placeholder="0,00"
                          value={linha.vendaAtual === '' ? '' : linha.vendaAtual}
                          onChange={e => {
                            const val = e.target.value;
                            updateLinha(linha.id, 'vendaAtual', val === '' ? '' : Number(val));
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatPercent(dnaTotal)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="w-[110px]"
                          placeholder="0,00"
                          value={linha.entrega || ''}
                          onChange={e => updateLinha(linha.id, 'entrega', Number(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {linha.produtoId ? formatBRL(calc.cmv) : '-'}
                      </TableCell>
                      <TableCell>
                        {calc.valid ? (
                          <span className={calc.lucro! >= 0 ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>
                            {formatBRL(calc.lucro!)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {calc.valid ? (
                          <span className={calc.pct! >= 0 ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>
                            {formatPercent(calc.pct!)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {linhas.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeLinha(linha.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
