import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { calcularCustosInvisiveis } from '@/lib/custosInvisiveisCalc';
import ImpostosTab from '@/components/ImpostosTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Info, AlertTriangle, Eye, EyeOff, ShieldCheck, ShieldAlert, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DespesaFixa, Funcionario, Veiculo, CustosInvisiveis } from '@/types';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function Financeiro() {
  const { state, dispatch, dnaTotal } = useApp();
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [newDespesa, setNewDespesa] = useState({ mes: '', descricao: '', valor: '' });

  const ci = state.custosInvisiveis;
  const ciCalc = useMemo(() => calcularCustosInvisiveis(ci), [ci]);

  const updateCI = (update: Partial<CustosInvisiveis>) => {
    dispatch({ type: 'SET_CUSTOS_INVISIVEIS', payload: { ...ci, ...update } });
  };

  // Monthly summary including invisible costs
  const resumoMensal = useMemo(() => {
    const despPorMes: Record<string, number> = {};
    for (const d of state.despesasFixas) {
      despPorMes[d.mes] = (despPorMes[d.mes] || 0) + d.valor;
    }
    const allMeses = new Set([...Object.keys(despPorMes), ...state.faturamento.filter(f => f.valor > 0).map(f => f.mes)]);
    const rows = Array.from(allMeses).map(mes => {
      const visiveis = despPorMes[mes] || 0;
      const invisiveis = ciCalc.total;
      const total = visiveis + invisiveis;
      const fat = state.faturamento.find(f => f.mes === mes);
      const fatVal = fat?.valor || 0;
      const percent = fatVal > 0 ? (total / fatVal) * 100 : null;
      return { mes, visiveis, invisiveis, total, percent };
    });

    const mesesComPercent = rows.filter(r => r.percent !== null);
    const mediaR = rows.length > 0 ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0;
    const mediaPercent = mesesComPercent.length > 0
      ? mesesComPercent.reduce((s, r) => s + r.percent!, 0) / mesesComPercent.length
      : null;

    return { rows, mediaR, mediaPercent };
  }, [state.despesasFixas, state.faturamento, ciCalc.total]);

  const addDespesa = () => {
    if (!newDespesa.mes) return;
    const d: DespesaFixa = { id: crypto.randomUUID(), mes: newDespesa.mes, descricao: newDespesa.descricao, valor: parseFloat(newDespesa.valor) || 0 };
    dispatch({ type: 'SET_DESPESAS', payload: [...state.despesasFixas, d] });
    setShowDespesaModal(false);
    setNewDespesa({ mes: '', descricao: '', valor: '' });
  };

  const removeDespesa = (id: string) => dispatch({ type: 'SET_DESPESAS', payload: state.despesasFixas.filter(d => d.id !== id) });

  const updateFaturamento = (id: string, valor: number) => {
    dispatch({ type: 'SET_FATURAMENTO', payload: state.faturamento.map(f => f.id === id ? { ...f, valor } : f) });
  };

  const updateDNA = (field: string, value: number | boolean) => {
    dispatch({ type: 'SET_DNA', payload: { [field]: value } });
  };

  // Funcionarios CRUD
  const addFuncionario = () => {
    const f: Funcionario = { id: crypto.randomUUID(), nome: '', cargo: '', salarioBase: 0 };
    updateCI({ funcionarios: [...ci.funcionarios, f] });
  };
  const removeFuncionario = (id: string) => updateCI({ funcionarios: ci.funcionarios.filter(f => f.id !== id) });
  const updateFuncionario = (id: string, field: keyof Funcionario, value: string | number) => {
    updateCI({ funcionarios: ci.funcionarios.map(f => f.id === id ? { ...f, [field]: value } : f) });
  };

  // Veiculos CRUD
  const addVeiculo = () => {
    const v: Veiculo = { id: crypto.randomUUID(), nome: '', combustivel: 0, estacionamento: 0, pedagio: 0, lavaJato: 0, valorFipe: 0, valorTotalFinanciamento: 0, qtdParcelas: 0, valorPneus: 0, vidaUtilPneusMeses: 24, manutencaoAnual: 0, seguroAnual: 0, franquiaSeguro: 0, frequenciaFranquiaMeses: 36, ipvaAnual: 0, valorCompra: 0, valorVendaFutura: 0, periodoUsoMeses: 36 };
    updateCI({ veiculos: [...ci.veiculos, v] });
  };
  const removeVeiculo = (id: string) => updateCI({ veiculos: ci.veiculos.filter(v => v.id !== id) });
  const updateVeiculo = (id: string, field: keyof Veiculo, value: string | number) => {
    updateCI({ veiculos: ci.veiculos.map(v => v.id === id ? { ...v, [field]: value } : v) });
  };

  const dna = state.dnaEmpresa;

  // Func detail calc for display
  const funcDetails = useMemo(() => {
    const funcs = ci.funcionarios;
    const somaSalarios = funcs.reduce((s, f) => s + f.salarioBase, 0);
    const mediaSalarial = funcs.length > 0 ? somaSalarios / funcs.length : 0;
    const avisoMensal = mediaSalarial / 12;
    const avisoComplementar = (mediaSalarial + mediaSalarial / 3 + mediaSalarial) * 0.08 / 12;
    return funcs.map(f => {
      const sal = f.salarioBase;
      const fgts = sal * 0.08;
      const prov13 = sal / 12;
      const provFerias = (sal + sal / 3) / 12;
      const fgts13Ferias = (prov13 + provFerias) * 0.08;
      const multaFGTS = (fgts + fgts13Ferias) * 0.50;
      const total = sal + fgts + prov13 + provFerias + fgts13Ferias + avisoMensal + avisoComplementar + multaFGTS;
      return { id: f.id, nome: f.nome, cargo: f.cargo, sal, fgts, prov13, provFerias, fgts13Ferias, avisoMensal, avisoComplementar, multaFGTS, total };
    });
  }, [ci.funcionarios]);

  // Veiculo detail calc for display
  const veicDetails = useMemo(() => {
    return ci.veiculos.map(v => {
      const jurosTotal = Math.max(v.valorTotalFinanciamento - v.valorFipe, 0);
      const jurosMensal = v.qtdParcelas > 0 ? jurosTotal / v.qtdParcelas : 0;
      const pneuMensal = v.vidaUtilPneusMeses > 0 ? v.valorPneus / v.vidaUtilPneusMeses : 0;
      const manutMensal = v.manutencaoAnual / 12;
      const seguroMensal = v.seguroAnual / 12;
      const franquiaMensal = v.frequenciaFranquiaMeses > 0 ? v.franquiaSeguro / v.frequenciaFranquiaMeses : 0;
      const ipvaMensal = v.ipvaAnual / 12;
      const desvalorizacao = v.periodoUsoMeses > 0 ? Math.max(v.valorCompra - v.valorVendaFutura, 0) / v.periodoUsoMeses : 0;
      const total = v.combustivel + v.estacionamento + v.pedagio + v.lavaJato + jurosMensal + pneuMensal + manutMensal + seguroMensal + franquiaMensal + ipvaMensal + desvalorizacao;
      return { id: v.id, nome: v.nome, jurosMensal, pneuMensal, manutMensal, seguroMensal, franquiaMensal, ipvaMensal, desvalorizacao, total };
    });
  }, [ci.veiculos]);

  // Alerts
  const alertas = useMemo(() => {
    const msgs: string[] = [];
    const totalVisiveis = state.despesasFixas.reduce((s, d) => s + d.valor, 0);
    const totalGeral = totalVisiveis + ciCalc.total;
    if (totalGeral > 0 && ciCalc.total / totalGeral > 0.30) msgs.push('Seu custo fixo invisível está alto para o faturamento atual');
    if (ciCalc.total > 0 && ciCalc.totalSalarios / ciCalc.total > 0.50) msgs.push('Salário e provisionamentos representam a maior parte do custo invisível');
    if (ciCalc.veiculos > 0 && ciCalc.total > 0 && ciCalc.veiculos / ciCalc.total > 0.25) msgs.push('Seu custo com veículos está acima da média');
    if (ci.funcionarios.length > 0) msgs.push('Seu provisionamento de férias e 13º não pode ser ignorado');
    if (ciCalc.total > 0) msgs.push('Seu custo fixo real está maior do que o custo fixo percebido');
    return msgs;
  }, [ciCalc, ci.funcionarios, state.despesasFixas]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Configure as bases financeiras do seu negócio</p>
      </div>

      <Tabs defaultValue="despesas">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="despesas"><Eye className="h-3.5 w-3.5 mr-1" />Despesas Fixas</TabsTrigger>
          <TabsTrigger value="invisiveis"><EyeOff className="h-3.5 w-3.5 mr-1" />Custos Invisíveis</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="impostos"><Calculator className="h-3.5 w-3.5 mr-1" />Impostos</TabsTrigger>
          <TabsTrigger value="dna">DNA da Empresa</TabsTrigger>
        </TabsList>

        {/* ===== DESPESAS FIXAS ===== */}
        <TabsContent value="despesas" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex gap-4 flex-wrap">
              <Card className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Média Custo Fixo Total (R$)</p>
                <p className="text-lg font-bold">{formatBRL(resumoMensal.mediaR)}</p>
              </Card>
              <Card className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Média Custo Fixo (%)</p>
                <p className="text-lg font-bold">
                  {resumoMensal.mediaPercent !== null ? formatPercent(resumoMensal.mediaPercent) : '-'}
                </p>
              </Card>
              {ciCalc.total > 0 && (
                <Card className="px-4 py-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                  <p className="text-xs text-muted-foreground">Custos Invisíveis/mês</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatBRL(ciCalc.total)}</p>
                </Card>
              )}
            </div>
            <Button onClick={() => setShowDespesaModal(true)}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Lançamentos</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Mês</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-12" /></TableRow>
              </TableHeader>
              <TableBody>
                {state.despesasFixas.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.mes}</TableCell>
                    <TableCell>{d.descricao}</TableCell>
                    <TableCell className="text-right">{formatBRL(d.valor)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeDespesa(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Resumo Mensal */}
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo Mensal</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Visíveis (R$)</TableHead>
                  <TableHead className="text-right">Invisíveis (R$)</TableHead>
                  <TableHead className="text-right font-bold">Total (R$)</TableHead>
                  <TableHead className="text-right">Custo Fixo (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumoMensal.rows.map(r => (
                  <TableRow key={r.mes}>
                    <TableCell>{r.mes}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.visiveis)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatBRL(r.invisiveis)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatBRL(r.total)}</TableCell>
                    <TableCell className="text-right">
                      {r.percent !== null ? formatPercent(r.percent) : <span className="text-muted-foreground italic">aguardando faturamento</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {resumoMensal.rows.length > 0 && (
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Média</TableCell>
                    <TableCell className="text-right" />
                    <TableCell className="text-right" />
                    <TableCell className="text-right">{formatBRL(resumoMensal.mediaR)}</TableCell>
                    <TableCell className="text-right">
                      {resumoMensal.mediaPercent !== null ? formatPercent(resumoMensal.mediaPercent) : '-'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Dialog open={showDespesaModal} onOpenChange={setShowDespesaModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Despesa Fixa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Mês</Label>
                  <Select value={newDespesa.mes} onValueChange={v => setNewDespesa(p => ({ ...p, mes: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
                    <SelectContent>
                      {MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição</Label><Input value={newDespesa.descricao} onChange={e => setNewDespesa(p => ({ ...p, descricao: e.target.value }))} placeholder="Aluguel" /></div>
                <div><Label>Valor (R$)</Label><Input type="number" value={newDespesa.valor} onChange={e => setNewDespesa(p => ({ ...p, valor: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button onClick={addDespesa}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== CUSTOS INVISÍVEIS ===== */}
        <TabsContent value="invisiveis" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['IPTU', ciCalc.iptuMensal],
              ['Salários', ciCalc.totalSalarios],
              ['Vale Transporte', ciCalc.valeTransporte],
              ['Depreciação', ciCalc.depreciacao],
              ['Brindes', ciCalc.brindes],
              ['Veículos', ciCalc.veiculos],
              ['Alimentação', ciCalc.alimentacao],
            ].map(([label, val]) => (
              <Card key={label as string} className="px-3 py-2">
                <p className="text-xs text-muted-foreground">{label as string}</p>
                <p className="text-sm font-bold">{formatBRL(val as number)}</p>
              </Card>
            ))}
            <Card className="px-3 py-2 border-primary bg-primary/5">
              <p className="text-xs text-muted-foreground font-semibold">Total Invisíveis</p>
              <p className="text-lg font-bold text-primary">{formatBRL(ciCalc.total)}</p>
            </Card>
          </div>

          {/* Alerts */}
          {alertas.length > 0 && (
            <div className="space-y-2">
              {alertas.map((msg, i) => (
                <Card key={i} className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
                  <CardContent className="flex items-start gap-3 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">{msg}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Accordion type="multiple" className="space-y-2">
            {/* 1. IPTU */}
            <AccordionItem value="iptu">
              <AccordionTrigger className="text-base font-semibold">IPTU</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Anual do IPTU (R$)</Label>
                    <Input type="number" value={ci.iptuAnual || ''} onChange={e => updateCI({ iptuAnual: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">IPTU Mensal</p>
                    <p className="text-lg font-bold">{formatBRL(ciCalc.iptuMensal)}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Salários e Provisionamentos */}
            <AccordionItem value="salarios">
              <AccordionTrigger className="text-base font-semibold">Salário e Provisionamentos</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <Button size="sm" onClick={addFuncionario}><Plus className="h-4 w-4 mr-1" />Adicionar Funcionário</Button>
                {ci.funcionarios.map((f, idx) => {
                  const det = funcDetails.find(d => d.id === f.id);
                  return (
                    <Card key={f.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm">Funcionário {idx + 1}</p>
                        <Button variant="ghost" size="icon" onClick={() => removeFuncionario(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label>Nome</Label><Input value={f.nome} onChange={e => updateFuncionario(f.id, 'nome', e.target.value)} /></div>
                        <div><Label>Cargo</Label><Input value={f.cargo} onChange={e => updateFuncionario(f.id, 'cargo', e.target.value)} /></div>
                        <div><Label>Salário Base (R$)</Label><Input type="number" value={f.salarioBase || ''} onChange={e => updateFuncionario(f.id, 'salarioBase', parseFloat(e.target.value) || 0)} /></div>
                      </div>
                      {det && f.salarioBase > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {[
                            ['FGTS', det.fgts], ['Prov. 13º', det.prov13], ['Prov. Férias', det.provFerias],
                            ['FGTS s/ 13º+Férias', det.fgts13Ferias], ['Aviso Prévio', det.avisoMensal],
                            ['Compl. Aviso', det.avisoComplementar], ['Multa FGTS', det.multaFGTS],
                            ['Total', det.total],
                          ].map(([label, val]) => (
                            <div key={label as string} className={`p-2 rounded ${label === 'Total' ? 'bg-primary/10 font-bold' : 'bg-muted'}`}>
                              <p className="text-muted-foreground">{label as string}</p>
                              <p>{formatBRL(val as number)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Salário e Provisionamentos</p>
                  <p className="text-lg font-bold">{formatBRL(ciCalc.totalSalarios)}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Vale Transporte */}
            <AccordionItem value="vt">
              <AccordionTrigger className="text-base font-semibold">Vale Transporte</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label>Valor da Passagem (R$)</Label><Input type="number" value={ci.valeTransporte.valorPassagem || ''} onChange={e => updateCI({ valeTransporte: { ...ci.valeTransporte, valorPassagem: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>Passagens/Dia</Label><Input type="number" value={ci.valeTransporte.passagensPorDia || ''} onChange={e => updateCI({ valeTransporte: { ...ci.valeTransporte, passagensPorDia: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>Dias Trabalhados</Label><Input type="number" value={ci.valeTransporte.diasTrabalhados || ''} onChange={e => updateCI({ valeTransporte: { ...ci.valeTransporte, diasTrabalhados: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>Qtd Funcionários</Label><Input type="number" value={ci.valeTransporte.qtdFuncionarios || ''} onChange={e => updateCI({ valeTransporte: { ...ci.valeTransporte, qtdFuncionarios: parseFloat(e.target.value) || 0 } })} /></div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Vale Transporte Mensal</p>
                  <p className="text-lg font-bold">{formatBRL(ciCalc.valeTransporte)}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Depreciação */}
            <AccordionItem value="depreciacao">
              <AccordionTrigger className="text-base font-semibold">Depreciação de Maquinário</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Total do Inventário (R$)</Label>
                    <Input type="number" value={ci.depreciacaoInventario || ''} onChange={e => updateCI({ depreciacaoInventario: parseFloat(e.target.value) || 0 })} />
                    <p className="text-xs text-muted-foreground mt-1">Fórmula: (Inventário / 50) / 60</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Depreciação Mensal</p>
                    <p className="text-lg font-bold">{formatBRL(ciCalc.depreciacao)}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Brindes */}
            <AccordionItem value="brindes">
              <AccordionTrigger className="text-base font-semibold">Brindes</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label>Qtd Brindes/Semana</Label><Input type="number" value={ci.brindes.qtdPorSemana || ''} onChange={e => updateCI({ brindes: { ...ci.brindes, qtdPorSemana: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>CMV Unitário (R$)</Label><Input type="number" value={ci.brindes.cmvUnitario || ''} onChange={e => updateCI({ brindes: { ...ci.brindes, cmvUnitario: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>Entrega Unitária (R$)</Label><Input type="number" value={ci.brindes.entregaUnitaria || ''} onChange={e => updateCI({ brindes: { ...ci.brindes, entregaUnitaria: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>Fator Mensal</Label><Input type="number" value={ci.brindes.fatorMensal || ''} onChange={e => updateCI({ brindes: { ...ci.brindes, fatorMensal: parseFloat(e.target.value) || 0 } })} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Fórmula: Qtd × (CMV + Entrega) × Fator Mensal</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Brindes Mensal</p>
                  <p className="text-lg font-bold">{formatBRL(ciCalc.brindes)}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Veículos */}
            <AccordionItem value="veiculos">
              <AccordionTrigger className="text-base font-semibold">Veículos</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <Button size="sm" onClick={addVeiculo}><Plus className="h-4 w-4 mr-1" />Adicionar Veículo</Button>
                {ci.veiculos.map((v, idx) => {
                  const det = veicDetails.find(d => d.id === v.id);
                  return (
                    <Card key={v.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm">Veículo {idx + 1}: {v.nome || '(sem nome)'}</p>
                        <Button variant="ghost" size="icon" onClick={() => removeVeiculo(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {([
                          ['nome', 'Nome/Identificação', 'text'],
                          ['combustivel', 'Combustível/mês (R$)', 'number'],
                          ['estacionamento', 'Estacionamento/mês (R$)', 'number'],
                          ['pedagio', 'Pedágio/mês (R$)', 'number'],
                          ['lavaJato', 'Lava Jato/mês (R$)', 'number'],
                          ['valorFipe', 'Valor FIPE (R$)', 'number'],
                          ['valorTotalFinanciamento', 'Total Financiamento (R$)', 'number'],
                          ['qtdParcelas', 'Qtd Parcelas', 'number'],
                          ['valorPneus', 'Valor Pneus (R$)', 'number'],
                          ['vidaUtilPneusMeses', 'Vida Útil Pneus (meses)', 'number'],
                          ['manutencaoAnual', 'Manutenção Anual (R$)', 'number'],
                          ['seguroAnual', 'Seguro Anual (R$)', 'number'],
                          ['franquiaSeguro', 'Franquia Seguro (R$)', 'number'],
                          ['frequenciaFranquiaMeses', 'Freq. Franquia (meses)', 'number'],
                          ['ipvaAnual', 'IPVA Anual (R$)', 'number'],
                          ['valorCompra', 'Valor de Compra (R$)', 'number'],
                          ['valorVendaFutura', 'Valor Venda Futura (R$)', 'number'],
                          ['periodoUsoMeses', 'Período de Uso (meses)', 'number'],
                        ] as const).map(([field, label, type]) => (
                          <div key={field}>
                            <Label className="text-xs">{label}</Label>
                            <Input type={type} value={(v as any)[field] || ''} onChange={e => updateVeiculo(v.id, field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} className="h-8 text-sm" />
                          </div>
                        ))}
                      </div>
                      {det && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {[
                            ['Juros/mês', det.jurosMensal], ['Pneu/mês', det.pneuMensal], ['Manutenção/mês', det.manutMensal],
                            ['Seguro/mês', det.seguroMensal], ['Franquia/mês', det.franquiaMensal], ['IPVA/mês', det.ipvaMensal],
                            ['Desvalorização/mês', det.desvalorizacao], ['Total/mês', det.total],
                          ].map(([label, val]) => (
                            <div key={label as string} className={`p-2 rounded ${label === 'Total/mês' ? 'bg-primary/10 font-bold' : 'bg-muted'}`}>
                              <p className="text-muted-foreground">{label as string}</p>
                              <p>{formatBRL(val as number)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Veículos</p>
                  <p className="text-lg font-bold">{formatBRL(ciCalc.veiculos)}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 7. Alimentação */}
            <AccordionItem value="alimentacao">
              <AccordionTrigger className="text-base font-semibold">Alimentação de Funcionários</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">💡 Custo ideal: entre R$ 7,00 e R$ 10,00 por dia por funcionário</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Qtd Funcionários</Label><Input type="number" value={ci.alimentacao.qtdFuncionarios || ''} onChange={e => updateCI({ alimentacao: { ...ci.alimentacao, qtdFuncionarios: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>Custo Médio/Dia (R$)</Label><Input type="number" value={ci.alimentacao.custoDiario || ''} onChange={e => updateCI({ alimentacao: { ...ci.alimentacao, custoDiario: parseFloat(e.target.value) || 0 } })} /></div>
                  <div><Label>Dias Trabalhados</Label><Input type="number" value={ci.alimentacao.diasTrabalhados || ''} onChange={e => updateCI({ alimentacao: { ...ci.alimentacao, diasTrabalhados: parseFloat(e.target.value) || 0 } })} /></div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Alimentação Mensal</p>
                  <p className="text-lg font-bold">{formatBRL(ciCalc.alimentacao)}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* ===== FATURAMENTO ===== */}
        <TabsContent value="faturamento" className="space-y-4">
          <Card className="px-4 py-2 w-fit">
            <p className="text-xs text-muted-foreground">Média Faturamento Mensal (R$)</p>
            <p className="text-lg font-bold">{formatBRL(state.faturamento.filter(f => f.valor > 0).length > 0 ? state.faturamento.filter(f => f.valor > 0).reduce((s, f) => s + f.valor, 0) / state.faturamento.filter(f => f.valor > 0).length : 0)}</p>
          </Card>

          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">IMPORTANTE</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">Faturamento: deverá ser preenchido com o valor do faturamento do mês, isso refletirá no cálculo do % Custo Fixo.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Mês</TableHead><TableHead className="text-right">Faturamento (R$)</TableHead></TableRow></TableHeader>
              <TableBody>
                {state.faturamento.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{f.mes}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" className="w-40 ml-auto text-right" value={f.valor || ''} onChange={e => updateFaturamento(f.id, parseFloat(e.target.value) || 0)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Faturamento Mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={state.faturamento.map(f => ({ mes: f.mes.substring(0, 3), valor: f.valor }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis tickFormatter={(v: number) => formatBRL(v)} className="text-xs" width={100} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="valor" position="top" formatter={(v: number) => v > 0 ? formatBRL(v) : ''} className="text-xs fill-foreground" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== IMPOSTOS (SIMPLES NACIONAL) ===== */}
        <TabsContent value="impostos" className="space-y-4">
          <ImpostosTab />
        </TabsContent>

        {/* ===== DNA DA EMPRESA ===== */}
        <TabsContent value="dna" className="space-y-4">
          {/* Educational Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">O que é o DNA da Empresa?</p>
                <p className="text-sm text-muted-foreground">O DNA da empresa é o custo estrutural percentual mínimo que cada produto precisa suportar antes do lucro. Todo produto precisa conter no mínimo o DNA da empresa embutido no preço. Esse percentual cobre a estrutura do negócio antes mesmo do lucro.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                DNA da Empresa
              </CardTitle>
              <CardDescription>Fórmula: Custo Fixo (%) + Média Cartão (%) + Impostos (%) + Voucher (%) {dna.isFranquia ? '+ Franquia (%)' : ''}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Custo Fixo (%) — automático</p>
                  <p className="text-2xl font-bold">{formatPercent(dna.custoFixoPercent)}</p>
                  <p className="text-[10px] text-muted-foreground">Média 12 meses (Visíveis + Invisíveis / Faturamento)</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Média Cartão (%) — automático</p>
                  <p className="text-2xl font-bold">{formatPercent(dna.mediaCartao)}</p>
                  <p className="text-[10px] text-muted-foreground">(Taxa Débito + Taxa Crédito) / 2</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Impostos (%) — automático</p>
                  <p className="text-2xl font-bold">{formatPercent(dna.impostos)}</p>
                  <p className="text-[10px] text-muted-foreground">Alíquota efetiva do Simples Nacional</p>
                </div>
              </div>

              {/* Manual fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Taxa Máquina de Cartão Débito (%)</Label>
                  <Input type="number" step="0.1" value={dna.taxaDebito} onChange={e => updateDNA('taxaDebito', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Taxa Máquina de Cartão Crédito (%)</Label>
                  <Input type="number" step="0.1" value={dna.taxaCredito} onChange={e => updateDNA('taxaCredito', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Voucher (%)</Label>
                  <Input type="number" step="0.1" value={dna.voucher} onChange={e => updateDNA('voucher', parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              {/* Franchise toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch checked={dna.isFranquia} onCheckedChange={v => updateDNA('isFranquia', v)} />
                  <Label>A empresa é uma franquia?</Label>
                </div>
                {dna.isFranquia && (
                  <div className="max-w-xs">
                    <Label>Franquia (%)</Label>
                    <Input type="number" step="0.1" value={dna.franquia} onChange={e => updateDNA('franquia', parseFloat(e.target.value) || 0)} />
                  </div>
                )}
              </div>

              {/* DNA Result */}
              <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">DNA da Empresa (%)</p>
                <p className="text-4xl font-bold text-primary">{formatPercent(dnaTotal)}</p>
                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  <p>Custo Fixo: {formatPercent(dna.custoFixoPercent)}</p>
                  <p>Média Cartão: {formatPercent(dna.mediaCartao)}</p>
                  <p>Impostos: {formatPercent(dna.impostos)}</p>
                  <p>Voucher: {formatPercent(dna.voucher)}</p>
                  {dna.isFranquia && <p>Franquia: {formatPercent(dna.franquia)}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Regra de precificação</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">Preço de Venda = (CMV + Embalagem) / (1 - DNA% - Lucro%). O DNA representa tudo que precisa ser absorvido pela venda antes da margem de lucro.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
