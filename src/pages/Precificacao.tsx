import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, DollarSign, AlertTriangle } from 'lucide-react';

interface LinhaPV {
  id: string;
  produtoId: string;
  lucroEstimado: number | '';
  ifoodPct: number | '';
  entrega: number | '';
  cupom: number | '';
  lucroFantasma: number | '';
  cupomFantasma: number | '';
}

const emptyLinha = (): LinhaPV => ({
  id: crypto.randomUUID(),
  produtoId: '',
  lucroEstimado: '',
  ifoodPct: '',
  entrega: '',
  cupom: '',
  lucroFantasma: '',
  cupomFantasma: '',
});

export default function Precificacao() {
  const { state, dnaTotal } = useApp();
  const produtosComFicha = state.produtos.filter(p => p.cmv > 0);

  const [linhas, setLinhas] = useState<LinhaPV[]>([emptyLinha()]);

  const addLinha = () => setLinhas(prev => [...prev, emptyLinha()]);
  const removeLinha = (id: string) => setLinhas(prev => prev.filter(l => l.id !== id));
  const updateLinha = (id: string, field: keyof LinhaPV, value: string | number) =>
    setLinhas(prev => prev.map(l => (l.id === id ? { ...l, [field]: value } : l)));

  const num = (v: number | ''): number => (v === '' ? 0 : v);

  const calcLinha = (l: LinhaPV) => {
    const produto = state.produtos.find(p => p.id === l.produtoId);
    const cmv = produto?.cmv ?? 0;
    const dna = dnaTotal / 100;
    const lucroEst = num(l.lucroEstimado) / 100;
    const ifood = num(l.ifoodPct) / 100;
    const entrega = num(l.entrega);
    const cupom = num(l.cupom);
    const lucroFant = num(l.lucroFantasma) / 100;
    const cupomFant = num(l.cupomFantasma);

    const hasProduto = !!l.produtoId;
    const hasLucro = l.lucroEstimado !== '' && l.lucroEstimado > 0;
    const hasLucroFant = l.lucroFantasma !== '' && num(l.lucroFantasma) > 0;

    // Validations
    const pvInvalid = dna + lucroEst >= 1;
    const ifoodInvalid = ifood >= 1;
    const fantInvalid = dna + lucroFant >= 1;

    // PV Normal
    let pv: number | null = null;
    if (hasProduto && hasLucro) {
      pv = pvInvalid ? null : cmv / (1 - dna - lucroEst);
    }

    // PV iFood
    let pvIfood: number | null = null;
    if (pv !== null && !ifoodInvalid) {
      pvIfood = ((pv + entrega) / (1 - ifood)) + cupom;
    }

    // PV Fantasma
    let pvFant: number | null = null;
    if (hasProduto && hasLucroFant) {
      pvFant = fantInvalid ? null : cmv / (1 - dna - lucroFant);
    }

    // PV iFood Fantasma
    let pvIfoodFant: number | null = null;
    if (pvFant !== null && !ifoodInvalid) {
      pvIfoodFant = ((pvFant + entrega) / (1 - ifood)) + cupomFant;
    }

    return { cmv, pv, pvIfood, pvFant, pvIfoodFant, pvInvalid, ifoodInvalid, fantInvalid, hasProduto, hasLucro, hasLucroFant };
  };

  // Médias
  const linhasCalc = linhas.map(l => ({ ...l, calc: calcLinha(l) }));
  const lucrosValidos = linhasCalc.filter(l => l.lucroEstimado !== '' && num(l.lucroEstimado) > 0);
  const mediaLucro = lucrosValidos.length > 0
    ? lucrosValidos.reduce((s, l) => s + num(l.lucroEstimado), 0) / lucrosValidos.length
    : null;
  const fantValidos = linhasCalc.filter(l => l.lucroFantasma !== '' && num(l.lucroFantasma) > 0);
  const mediaFant = fantValidos.length > 0
    ? fantValidos.reduce((s, l) => s + num(l.lucroFantasma), 0) / fantValidos.length
    : null;

  const renderAuto = (value: number | null, invalid: boolean, show: boolean) => {
    if (!show) return <span className="text-muted-foreground">-</span>;
    if (invalid) return (
      <span className="text-destructive flex items-center gap-1 text-xs">
        <AlertTriangle className="h-3 w-3" /> Inválido
      </span>
    );
    if (value === null) return <span className="text-muted-foreground">-</span>;
    return <span className="font-semibold">{formatBRL(value)}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Preço de Venda (PV)</h1>
        <p className="text-muted-foreground">Calcule o preço ideal de venda para cardápio, iFood e cardápio fantasma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Média Lucro Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mediaLucro !== null ? formatPercent(mediaLucro) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média Lucro Cardápio Fantasma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mediaFant !== null ? formatPercent(mediaFant) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Simulador de Preço de Venda
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
                  <TableHead className="w-10">Item</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>CMV + Emb. (R$)</TableHead>
                  <TableHead>DNA (%)</TableHead>
                  <TableHead>Lucro Est. (%)</TableHead>
                  <TableHead>PV (R$)</TableHead>
                  <TableHead>iFood (%)</TableHead>
                  <TableHead>Entrega (R$)</TableHead>
                  <TableHead>PV iFood (R$)</TableHead>
                  <TableHead>Cupom (R$)</TableHead>
                  <TableHead>Lucro Fant. (%)</TableHead>
                  <TableHead>PV Fant. (R$)</TableHead>
                  <TableHead>PV iFood Fant. (R$)</TableHead>
                  <TableHead>Cupom Fant. (R$)</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((linha, idx) => {
                  const c = calcLinha(linha);
                  return (
                    <TableRow key={linha.id} className={idx % 2 === 1 ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <Select value={linha.produtoId} onValueChange={v => updateLinha(linha.id, 'produtoId', v)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtosComFicha.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.hasProduto ? formatBRL(c.cmv) : '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatPercent(dnaTotal)}</TableCell>
                      <TableCell>
                        <Input type="number" min={0} step={0.1} className="w-[80px]" placeholder="%" value={linha.lucroEstimado === '' ? '' : linha.lucroEstimado} onChange={e => updateLinha(linha.id, 'lucroEstimado', e.target.value === '' ? '' : Number(e.target.value))} />
                      </TableCell>
                      <TableCell>{renderAuto(c.pv, c.pvInvalid, c.hasProduto && c.hasLucro)}</TableCell>
                      <TableCell>
                        <Input type="number" min={0} step={0.1} className="w-[80px]" placeholder="%" value={linha.ifoodPct === '' ? '' : linha.ifoodPct} onChange={e => updateLinha(linha.id, 'ifoodPct', e.target.value === '' ? '' : Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min={0} step={0.01} className="w-[90px]" placeholder="0,00" value={linha.entrega === '' ? '' : linha.entrega} onChange={e => updateLinha(linha.id, 'entrega', e.target.value === '' ? '' : Number(e.target.value))} />
                      </TableCell>
                      <TableCell>{renderAuto(c.pvIfood, c.ifoodInvalid, c.pv !== null)}</TableCell>
                      <TableCell>
                        <Input type="number" min={0} step={0.01} className="w-[90px]" placeholder="0,00" value={linha.cupom === '' ? '' : linha.cupom} onChange={e => updateLinha(linha.id, 'cupom', e.target.value === '' ? '' : Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min={0} step={0.1} className="w-[80px]" placeholder="%" value={linha.lucroFantasma === '' ? '' : linha.lucroFantasma} onChange={e => updateLinha(linha.id, 'lucroFantasma', e.target.value === '' ? '' : Number(e.target.value))} />
                      </TableCell>
                      <TableCell>{renderAuto(c.pvFant, c.fantInvalid, c.hasProduto && c.hasLucroFant)}</TableCell>
                      <TableCell>{renderAuto(c.pvIfoodFant, c.ifoodInvalid, c.pvFant !== null)}</TableCell>
                      <TableCell>
                        <Input type="number" min={0} step={0.01} className="w-[90px]" placeholder="0,00" value={linha.cupomFantasma === '' ? '' : linha.cupomFantasma} onChange={e => updateLinha(linha.id, 'cupomFantasma', e.target.value === '' ? '' : Number(e.target.value))} />
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
