import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Precificacao() {
  const { state, dnaTotal } = useApp();
  const [precos, setPrecos] = useState<Record<string, number>>({});
  const [margens, setMargens] = useState<Record<string, { margem: number; taxaIfood: number; entrega: number; cupom: number; margemFantasma: number }>>({});

  const getPreco = (id: string) => precos[id] || 0;
  const getMargem = (id: string) => margens[id] || { margem: 10, taxaIfood: 19, entrega: 5, cupom: 3, margemFantasma: 5 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Precificação Inteligente</h1>
        <p className="text-muted-foreground">Analise seus preços atuais e simule preços ideais</p>
      </div>

      <Tabs defaultValue="analise">
        <TabsList><TabsTrigger value="analise">Análise de Preço Atual</TabsTrigger><TabsTrigger value="simulador">Simulador de Preços</TabsTrigger></TabsList>

        <TabsContent value="analise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Análise por Produto
                <Tooltip><TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">Insira o preço de venda atual. O sistema calcula automaticamente o lucro subtraindo o CMV e o DNA da Empresa.</TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Produto</TableHead><TableHead className="text-right">CMV</TableHead><TableHead className="text-right">DNA %</TableHead><TableHead>Preço Venda</TableHead><TableHead className="text-right">Lucro R$</TableHead><TableHead className="text-right">Lucro %</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {state.produtos.map(p => {
                    const pv = getPreco(p.id);
                    const dnaCusto = pv * (dnaTotal / 100);
                    const lucroRS = pv - p.cmv - dnaCusto;
                    const lucroPercent = pv > 0 ? (lucroRS / pv) * 100 : 0;
                    const isPrejuizo = pv > 0 && lucroRS < 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell className="text-right">{formatBRL(p.cmv)}</TableCell>
                        <TableCell className="text-right">{formatPercent(dnaTotal)}</TableCell>
                        <TableCell><Input type="number" className="w-28" placeholder="R$ 0,00" value={pv || ''} onChange={e => setPrecos(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))} /></TableCell>
                        <TableCell className={`text-right font-bold ${isPrejuizo ? 'text-destructive' : 'text-success'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {pv > 0 && (isPrejuizo ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />)}
                            {pv > 0 ? formatBRL(lucroRS) : '—'}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${isPrejuizo ? 'text-destructive' : 'text-success'}`}>
                          {pv > 0 ? formatPercent(lucroPercent) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulador" className="space-y-6">
          {state.produtos.map(p => {
            const m = getMargem(p.id);
            const setM = (updates: Partial<typeof m>) => setMargens(prev => ({ ...prev, [p.id]: { ...m, ...updates } }));

            const precoNormal = (1 - dnaTotal / 100 - m.margem / 100) > 0 ? p.cmv / (1 - dnaTotal / 100 - m.margem / 100) : 0;
            const precoDelivery = (1 - dnaTotal / 100 - m.taxaIfood / 100 - m.margem / 100) > 0 ? (p.cmv + m.entrega + m.cupom) / (1 - dnaTotal / 100 - m.taxaIfood / 100 - m.margem / 100) : 0;
            const precoFantasma = (1 - dnaTotal / 100 - m.margemFantasma / 100) > 0 ? p.cmv / (1 - dnaTotal / 100 - m.margemFantasma / 100) : 0;

            return (
              <Card key={p.id}>
                <CardHeader><CardTitle>{p.nome} <span className="text-sm font-normal text-muted-foreground">— CMV: {formatBRL(p.cmv)}</span></CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div><Label className="text-xs">Margem Desejada (%)</Label><Input type="number" value={m.margem} onChange={e => setM({ margem: parseFloat(e.target.value) || 0 })} /></div>
                    <div><Label className="text-xs">Taxa iFood (%)</Label><Input type="number" value={m.taxaIfood} onChange={e => setM({ taxaIfood: parseFloat(e.target.value) || 0 })} /></div>
                    <div><Label className="text-xs">Entrega (R$)</Label><Input type="number" value={m.entrega} onChange={e => setM({ entrega: parseFloat(e.target.value) || 0 })} /></div>
                    <div><Label className="text-xs">Cupom (R$)</Label><Input type="number" value={m.cupom} onChange={e => setM({ cupom: parseFloat(e.target.value) || 0 })} /></div>
                    <div><Label className="text-xs">Margem Fantasma (%)</Label><Input type="number" value={m.margemFantasma} onChange={e => setM({ margemFantasma: parseFloat(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Preço Normal</p>
                      <p className="text-2xl font-bold text-primary">{formatBRL(precoNormal)}</p>
                    </div>
                    <div className="p-4 bg-destructive/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Preço Delivery (iFood)</p>
                      <p className="text-2xl font-bold text-destructive">{formatBRL(precoDelivery)}</p>
                    </div>
                    <div className="p-4 bg-warning/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Cardápio Fantasma</p>
                      <p className="text-2xl font-bold text-warning">{formatBRL(precoFantasma)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
