import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, Star, AlertTriangle, Zap, Target, Gift, Trash2, Archive, Play, FlaskConical, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Oferta, QuadrantesOfertas } from '@/types';

/* ───── helpers ───── */
type Periodo = 'hoje' | '7d' | '15d' | '30d' | 'mes' | 'custom';

function periodoRange(p: Periodo, customFrom?: string, customTo?: string): [Date, Date] {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  switch (p) {
    case 'hoje': return [new Date(now.getFullYear(), now.getMonth(), now.getDate()), endOfDay];
    case '7d': { const d = new Date(endOfDay); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return [d, endOfDay]; }
    case '15d': { const d = new Date(endOfDay); d.setDate(d.getDate() - 14); d.setHours(0,0,0,0); return [d, endOfDay]; }
    case '30d': { const d = new Date(endOfDay); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return [d, endOfDay]; }
    case 'mes': return [new Date(now.getFullYear(), now.getMonth(), 1), endOfDay];
    case 'custom': {
      const from = customFrom ? new Date(customFrom + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1);
      const to = customTo ? new Date(customTo + 'T23:59:59') : endOfDay;
      return [from, to];
    }
  }
}

interface ProdutoAnalise {
  id: string;
  nome: string;
  pv: number;
  cmv: number;
  lucroDinheiro: number;
  lucratividade: number;
  qtdVendida: number;
}

function psychologicalPrices(base: number): number[] {
  const endings = [0.99, 1.99, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99];
  const candidates: number[] = [];
  const floor = Math.floor(base);
  for (let tens = floor - 10; tens <= floor + 10; tens++) {
    for (const e of endings) {
      const intPart = Math.floor(tens / 10) * 10;
      const price = intPart + e;
      if (price > 0 && Math.abs(price - base) <= 5) candidates.push(price);
    }
  }
  const baseInt = Math.floor(base);
  for (const e of endings) {
    const p = baseInt - (baseInt % 10) + e;
    if (p > 0) candidates.push(p);
    const p2 = p + 10;
    candidates.push(p2);
    if (p - 10 > 0) candidates.push(p - 10);
  }
  const unique = [...new Set(candidates)].filter(p => p > 0).sort((a, b) => Math.abs(a - base) - Math.abs(b - base));
  return unique.slice(0, 5);
}

export default function Ofertas() {
  const { state, dispatch, dnaTotal } = useApp();
  const dnaDecimal = dnaTotal / 100;

  const quadrantes = state.quadrantesOfertas || { maisVendidos: [], menosVendidos: [], maisLucrativos: [], menosLucrativos: [] };

  const [periodo, setPeriodo] = useState<Periodo>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState('quadrantes');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'ativa' | 'teste' | 'arquivada'>('todas');

  // Quadrant add selectors
  const [addMaisVendidos, setAddMaisVendidos] = useState('');
  const [addMenosVendidos, setAddMenosVendidos] = useState('');
  const [addMaisLucrativos, setAddMaisLucrativos] = useState('');
  const [addMenosLucrativos, setAddMenosLucrativos] = useState('');

  // Offer calculator state
  const [normalProd1, setNormalProd1] = useState('');
  const [normalProd2, setNormalProd2] = useState('');
  const [subidaProdFraco, setSubidaProdFraco] = useState('');
  const [subidaProdCoringa, setSubidaProdCoringa] = useState('');
  const [escalaProdCampeao, setEscalaProdCampeao] = useState('');
  const [escalaProdCoringa, setEscalaProdCoringa] = useState('');
  const [agressivaNome, setAgressivaNome] = useState('');
  const [agressivaCmv, setAgressivaCmv] = useState<number | ''>(0);
  const [agressivaQtd, setAgressivaQtd] = useState(2);
  const [agressivaLucro, setAgressivaLucro] = useState(10);
  const [normalLucro, setNormalLucro] = useState<number | ''>('');
  const [subidaLucro, setSubidaLucro] = useState<number | ''>('');
  const [escalaLucro, setEscalaLucro] = useState<number | ''>(10);

  /* ───── build product analysis ───── */
  const produtosAnalise = useMemo<ProdutoAnalise[]>(() => {
    const [from, to] = periodoRange(periodo, customFrom, customTo);
    return state.produtos.map(p => {
      const preco = state.precosProdutos.find(pp => pp.produtoId === p.id);
      const pv = preco?.precoVenda ?? 0;
      const cmv = p.cmv;
      const lucroDinheiro = pv - (pv * dnaDecimal) - cmv;
      const lucratividade = pv > 0 ? (lucroDinheiro / pv) * 100 : 0;
      const qtdVendida = state.vendas
        .filter(v => v.produtoId === p.id && new Date(v.data) >= from && new Date(v.data) <= to)
        .reduce((s, v) => s + v.quantidade, 0);
      return { id: p.id, nome: p.nome, pv, cmv, lucroDinheiro, lucratividade, qtdVendida };
    });
  }, [state.produtos, state.precosProdutos, state.vendas, dnaDecimal, periodo, customFrom, customTo]);

  /* ───── manual quadrant data ───── */
  const getQuadranteData = useCallback((ids: string[]) => {
    return ids.map(id => produtosAnalise.find(p => p.id === id)).filter(Boolean) as ProdutoAnalise[];
  }, [produtosAnalise]);

  const maisVendidos = useMemo(() => getQuadranteData(quadrantes.maisVendidos), [getQuadranteData, quadrantes.maisVendidos]);
  const menosVendidos = useMemo(() => getQuadranteData(quadrantes.menosVendidos), [getQuadranteData, quadrantes.menosVendidos]);
  const maisLucrativos = useMemo(() => getQuadranteData(quadrantes.maisLucrativos), [getQuadranteData, quadrantes.maisLucrativos]);
  const menosLucrativos = useMemo(() => getQuadranteData(quadrantes.menosLucrativos), [getQuadranteData, quadrantes.menosLucrativos]);

  const mediaLucroMaisVendidos = useMemo(() => {
    if (maisVendidos.length === 0) return 0;
    return maisVendidos.reduce((s, p) => s + p.lucratividade, 0) / maisVendidos.length;
  }, [maisVendidos]);

  /* ───── quadrant mutations ───── */
  function addToQuadrante(key: keyof QuadrantesOfertas, produtoId: string) {
    if (!produtoId || quadrantes[key].includes(produtoId)) return;
    const updated = { ...quadrantes, [key]: [...quadrantes[key], produtoId] };
    dispatch({ type: 'SET_QUADRANTES_OFERTAS', payload: updated });
  }

  function removeFromQuadrante(key: keyof QuadrantesOfertas, produtoId: string) {
    const updated = { ...quadrantes, [key]: quadrantes[key].filter(id => id !== produtoId) };
    dispatch({ type: 'SET_QUADRANTES_OFERTAS', payload: updated });
  }

  /* ───── cross-quadrant analysis ───── */
  const maisVendidosIds = new Set(quadrantes.maisVendidos);
  const menosVendidosIds = new Set(quadrantes.menosVendidos);
  const maisLucrativosIds = new Set(quadrantes.maisLucrativos);
  const menosLucrativosIds = new Set(quadrantes.menosLucrativos);

  const coringa = produtosAnalise.filter(p => maisVendidosIds.has(p.id) && maisLucrativosIds.has(p.id));
  const perigosos = produtosAnalise.filter(p => maisVendidosIds.has(p.id) && menosLucrativosIds.has(p.id));
  const potencialEscala = produtosAnalise.filter(p => menosVendidosIds.has(p.id) && maisLucrativosIds.has(p.id));
  const fracos = produtosAnalise.filter(p => menosVendidosIds.has(p.id) && menosLucrativosIds.has(p.id));

  /* ───── offer calculation helpers ───── */
  const findProd = useCallback((id: string) => produtosAnalise.find(p => p.id === id), [produtosAnalise]);

  function calcOfertaNormal() {
    const p1 = findProd(normalProd1);
    const p2 = findProd(normalProd2);
    if (!p1 || !p2) return null;
    const C = p1.cmv + p2.cmv;
    const T = Math.max(p1.lucroDinheiro, p2.lucroDinheiro);
    const lucroMinPctCalc = T > 0 ? Math.ceil(((T * (1 - dnaDecimal)) / (C + T)) * 100) / 100 : 0;
    const lucroManual = typeof normalLucro === 'number' ? normalLucro / 100 : null;
    const lucroUsado = lucroManual !== null ? lucroManual : lucroMinPctCalc;
    const denom = 1 - (dnaDecimal + lucroUsado);
    if (denom <= 0) return null;
    const preco = C / denom;
    const lucroDinheiro = preco * lucroUsado;
    return { p1, p2, somaPrecoNormal: p1.pv + p2.pv, cmvTotal: C, lucroMinDinheiro: T, lucroMinPctSugerido: lucroMinPctCalc * 100, lucroUsadoPct: lucroUsado * 100, preco, lucroDinheiro };
  }

  function calcOfertaSubida() {
    const pFraco = findProd(subidaProdFraco);
    const pCoringa = findProd(subidaProdCoringa);
    if (!pFraco || !pCoringa) return null;
    const C = pFraco.cmv + pCoringa.cmv;
    const lucroSugeridoPct = mediaLucroMaisVendidos;
    const lucroManual = typeof subidaLucro === 'number' ? subidaLucro : null;
    const lucroUsadoPct = lucroManual !== null ? lucroManual : lucroSugeridoPct;
    const lucroUsado = lucroUsadoPct / 100;
    const denom = 1 - (dnaDecimal + lucroUsado);
    if (denom <= 0) return null;
    const preco = C / denom;
    const lucroDinheiro = preco * lucroUsado;
    return { pFraco, pCoringa, somaPrecoNormal: pFraco.pv + pCoringa.pv, cmvTotal: C, lucroSugeridoPct, lucroUsadoPct, preco, lucroDinheiro };
  }

  function calcOfertaEscala() {
    const pCampeao = findProd(escalaProdCampeao);
    const pCoringa = findProd(escalaProdCoringa);
    if (!pCampeao || !pCoringa) return null;
    const C = pCampeao.cmv + pCoringa.cmv;
    const T = Math.min(pCampeao.lucroDinheiro, pCoringa.lucroDinheiro);
    const lucroMinCalc = T > 0 ? (T * (1 - dnaDecimal)) / (C + T) : 0;
    const lucroSugeridoPct = Math.max(10, lucroMinCalc * 100);
    const lucroManual = typeof escalaLucro === 'number' ? escalaLucro : null;
    const lucroUsadoPct = lucroManual !== null ? lucroManual : lucroSugeridoPct;
    const lucroUsado = lucroUsadoPct / 100;
    const denom = 1 - (dnaDecimal + lucroUsado);
    if (denom <= 0) return null;
    const preco = C / denom;
    const lucroDinheiro = preco * lucroUsado;
    return { pCampeao, pCoringa, somaPrecoNormal: pCampeao.pv + pCoringa.pv, cmvTotal: C, lucroMinDinheiro: T, lucroSugeridoPct, lucroPct: lucroUsadoPct, preco, lucroDinheiro };
  }

  function calcOfertaAgressiva() {
    const cmv = typeof agressivaCmv === 'number' ? agressivaCmv : 0;
    if (cmv <= 0) return null;
    const lucroAlvo = agressivaLucro / 100;
    const denom = 1 - (dnaDecimal + lucroAlvo);
    if (denom <= 0) return null;
    const precoBase = (cmv * agressivaQtd) / denom;
    const lucroDinheiro = precoBase * lucroAlvo;
    const sugestoes = psychologicalPrices(precoBase);
    const minPreco = (cmv * agressivaQtd) / (1 - dnaDecimal);
    const validos = sugestoes.filter(p => p >= minPreco);
    const precoPsico = validos.length > 0 ? validos[0] : sugestoes[0];
    return { cmvUnit: cmv, qtd: agressivaQtd, precoBase, lucroDinheiro, sugestoes: sugestoes.slice(0, 3), precoPsico, lucroAlvoPct: agressivaLucro };
  }

  const ofertaNormal = calcOfertaNormal();
  const ofertaSubida = calcOfertaSubida();
  const ofertaEscala = calcOfertaEscala();
  const ofertaAgressiva = calcOfertaAgressiva();

  /* ───── auto-suggestions ───── */
  const sugestoes = useMemo(() => {
    const results: Oferta[] = [];
    const coringaSorted = [...coringa].sort((a, b) => b.lucroDinheiro - a.lucroDinheiro);

    if (coringaSorted.length >= 2) {
      const p1 = coringaSorted[0], p2 = coringaSorted[1];
      const C = p1.cmv + p2.cmv;
      const T = Math.max(p1.lucroDinheiro, p2.lucroDinheiro);
      if (T > 0) {
        const lucroMin = (T * (1 - dnaDecimal)) / (C + T);
        const lucro = Math.ceil(lucroMin * 100) / 100;
        const denom = 1 - (dnaDecimal + lucro);
        if (denom > 0) {
          const preco = C / denom;
          results.push({
            id: 'sug-normal', tipo: 'normal', nome: `${p1.nome} + ${p2.nome}`,
            produtoIds: [p1.id, p2.id], nomesProdutos: [p1.nome, p2.nome],
            somaPrecoNormal: p1.pv + p2.pv, precoOferta: preco, cmvTotal: C,
            dnaPercent: dnaTotal, lucroPercent: lucro * 100, lucroDinheiro: preco * lucro,
            objetivoEstrategico: 'Combinar dois produtos fortes com margem garantida',
            status: 'teste', criadoEm: new Date().toISOString(),
          });
        }
      }
    }

    if (menosLucrativos.length > 0 && coringaSorted.length > 0) {
      const pFraco = menosLucrativos[0];
      const pCoringa = coringaSorted[0];
      const C = pFraco.cmv + pCoringa.cmv;
      const lucro = mediaLucroMaisVendidos / 100;
      const denom = 1 - (dnaDecimal + lucro);
      if (denom > 0) {
        const preco = C / denom;
        results.push({
          id: 'sug-subida', tipo: 'subida_lucro', nome: `${pFraco.nome} + ${pCoringa.nome}`,
          produtoIds: [pFraco.id, pCoringa.id], nomesProdutos: [pFraco.nome, pCoringa.nome],
          somaPrecoNormal: pFraco.pv + pCoringa.pv, precoOferta: preco, cmvTotal: C,
          dnaPercent: dnaTotal, lucroPercent: mediaLucroMaisVendidos, lucroDinheiro: preco * lucro,
          objetivoEstrategico: 'Elevar margem de produto com baixa lucratividade',
          status: 'teste', criadoEm: new Date().toISOString(),
        });
      }
    }

    if (maisVendidos.length > 0 && coringaSorted.length > 0) {
      const pCampeao = maisVendidos[0];
      const pCoringa = coringaSorted.find(c => c.id !== pCampeao.id) || coringaSorted[0];
      const C = pCampeao.cmv + pCoringa.cmv;
      const T = Math.min(pCampeao.lucroDinheiro, pCoringa.lucroDinheiro);
      const lucroMinCalc = T > 0 ? (T * (1 - dnaDecimal)) / (C + T) : 0;
      const lucro = Math.max(0.10, lucroMinCalc);
      const denom = 1 - (dnaDecimal + lucro);
      if (denom > 0) {
        const preco = C / denom;
        results.push({
          id: 'sug-escala', tipo: 'escala_vendas', nome: `${pCampeao.nome} + ${pCoringa.nome}`,
          produtoIds: [pCampeao.id, pCoringa.id], nomesProdutos: [pCampeao.nome, pCoringa.nome],
          somaPrecoNormal: pCampeao.pv + pCoringa.pv, precoOferta: preco, cmvTotal: C,
          dnaPercent: dnaTotal, lucroPercent: lucro * 100, lucroDinheiro: preco * lucro,
          objetivoEstrategico: 'Escalar volume de vendas com margem de segurança',
          status: 'teste', criadoEm: new Date().toISOString(),
        });
      }
    }

    return results;
  }, [coringa, menosLucrativos, maisVendidos, dnaDecimal, dnaTotal, mediaLucroMaisVendidos]);

  /* ───── save offer ───── */
  function saveOferta(oferta: Omit<Oferta, 'id' | 'criadoEm'>) {
    const newOferta: Oferta = { ...oferta, id: crypto.randomUUID(), criadoEm: new Date().toISOString() } as Oferta;
    dispatch({ type: 'ADD_OFERTA', payload: newOferta });
    toast.success('Oferta salva com sucesso!');
  }

  function updateOfertaStatus(id: string, status: 'ativa' | 'teste' | 'arquivada') {
    const oferta = (state.ofertas || []).find(o => o.id === id);
    if (oferta) dispatch({ type: 'UPDATE_OFERTA', payload: { ...oferta, status } });
  }

  function removeOferta(id: string) {
    dispatch({ type: 'REMOVE_OFERTA', payload: id });
    toast.success('Oferta removida');
  }

  /* ───── product select options ───── */
  const prodOptions = produtosAnalise.map(p => ({ value: p.id, label: `${p.nome} (${formatBRL(p.pv)})` }));

  const filteredOfertas = (state.ofertas || []).filter(o => filterStatus === 'todas' || o.status === filterStatus);

  /* ───── render helpers ───── */
  function QuadranteTable({ title, icon, data, quadKey, addValue, setAddValue }: {
    title: string; icon: React.ReactNode; data: ProdutoAnalise[];
    quadKey: keyof QuadrantesOfertas; addValue: string; setAddValue: (v: string) => void;
  }) {
    const availableProducts = produtosAnalise.filter(p => !quadrantes[quadKey].includes(p.id));
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Select value={addValue} onValueChange={setAddValue}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Adicionar produto..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => {
              if (addValue) {
                addToQuadrante(quadKey, addValue);
                setAddValue('');
              }
            }}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Produto</TableHead>
                <TableHead className="text-xs text-right">Qtd</TableHead>
                <TableHead className="text-xs text-right">PV</TableHead>
                <TableHead className="text-xs text-right">CMV</TableHead>
                <TableHead className="text-xs text-right">Lucro R$</TableHead>
                <TableHead className="text-xs text-right">Lucro %</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-sm">Adicione produtos ao quadrante</TableCell></TableRow>
              ) : data.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm font-medium">{p.nome}</TableCell>
                  <TableCell className="text-sm text-right">{p.qtdVendida}</TableCell>
                  <TableCell className="text-sm text-right">{formatBRL(p.pv)}</TableCell>
                  <TableCell className="text-sm text-right">{formatBRL(p.cmv)}</TableCell>
                  <TableCell className="text-sm text-right">{formatBRL(p.lucroDinheiro)}</TableCell>
                  <TableCell className="text-sm text-right">{formatPercent(p.lucratividade)}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFromQuadrante(quadKey, p.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  function CrossBadge({ items, label, icon, variant }: { items: ProdutoAnalise[]; label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'secondary' | 'outline' }) {
    if (items.length === 0) return null;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">{icon} {label}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {items.map(p => (
            <Badge key={p.id} variant={variant}>{p.nome}</Badge>
          ))}
        </CardContent>
      </Card>
    );
  }

  function ProdSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {prodOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Página de Ofertas</h1>
          <p className="text-muted-foreground text-sm">Análise estratégica e geração de ofertas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="mes">Mês atual</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {periodo === 'custom' && (
            <>
              <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-[150px]" />
              <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-[150px]" />
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="quadrantes">Quadrantes</TabsTrigger>
          <TabsTrigger value="calculadora">Calculadora</TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* ═══ QUADRANTES ═══ */}
        <TabsContent value="quadrantes" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">DNA da Empresa</p>
                <p className="text-2xl font-bold text-primary">{formatPercent(dnaTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Média Lucro (Mais Vendidos)</p>
                <p className="text-2xl font-bold text-primary">{formatPercent(mediaLucroMaisVendidos)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Produtos Cadastrados</p>
                <p className="text-2xl font-bold">{produtosAnalise.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <QuadranteTable title="Mais Vendidos" icon={<TrendingUp className="h-4 w-4 text-green-600" />} data={maisVendidos} quadKey="maisVendidos" addValue={addMaisVendidos} setAddValue={setAddMaisVendidos} />
            <QuadranteTable title="Menos Vendidos" icon={<TrendingDown className="h-4 w-4 text-red-500" />} data={menosVendidos} quadKey="menosVendidos" addValue={addMenosVendidos} setAddValue={setAddMenosVendidos} />
            <QuadranteTable title="Mais Lucrativos" icon={<Star className="h-4 w-4 text-yellow-500" />} data={maisLucrativos} quadKey="maisLucrativos" addValue={addMaisLucrativos} setAddValue={setAddMaisLucrativos} />
            <QuadranteTable title="Menos Lucrativos" icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} data={menosLucrativos} quadKey="menosLucrativos" addValue={addMenosLucrativos} setAddValue={setAddMenosLucrativos} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Produtos Repetidos entre Quadrantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CrossBadge items={coringa} label="Produtos Coringa (Mais Vendidos + Mais Lucrativos)" icon={<Star className="h-4 w-4 text-yellow-500" />} variant="default" />
              <CrossBadge items={perigosos} label="Produtos Perigosos (Mais Vendidos + Menos Lucrativos)" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} variant="destructive" />
              <CrossBadge items={potencialEscala} label="Potencial de Escala (Menos Vendidos + Mais Lucrativos)" icon={<Zap className="h-4 w-4 text-blue-500" />} variant="secondary" />
              <CrossBadge items={fracos} label="Produtos Fracos (Menos Vendidos + Menos Lucrativos)" icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />} variant="outline" />
            </div>
            {coringa.length === 0 && perigosos.length === 0 && potencialEscala.length === 0 && fracos.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">Adicione produtos aos quadrantes para ver os cruzamentos.</p>
            )}
          </div>
        </TabsContent>

        {/* ═══ CALCULADORA ═══ */}
        <TabsContent value="calculadora" className="space-y-6">
          <Tabs defaultValue="normal">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="normal">Oferta Normal</TabsTrigger>
              <TabsTrigger value="subida">Subida de Lucro</TabsTrigger>
              <TabsTrigger value="escala">Escala de Vendas</TabsTrigger>
              <TabsTrigger value="agressiva">Oferta Agressiva</TabsTrigger>
            </TabsList>

            <TabsContent value="normal" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Oferta Normal — 2 Produtos Coringa</CardTitle>
                  <CardDescription>Combine dois produtos fortes para criar uma oferta com margem garantida.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProdSelect value={normalProd1} onChange={setNormalProd1} label="Produto 1 (Coringa)" />
                    <ProdSelect value={normalProd2} onChange={setNormalProd2} label="Produto 2 (Coringa)" />
                  </div>
                  {ofertaNormal && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Soma normal:</span><br /><strong>{formatBRL(ofertaNormal.somaPrecoNormal)}</strong></div>
                        <div><span className="text-muted-foreground">CMV total:</span><br /><strong>{formatBRL(ofertaNormal.cmvTotal)}</strong></div>
                        <div><span className="text-muted-foreground">Lucro mín. a superar:</span><br /><strong>{formatBRL(ofertaNormal.lucroMinDinheiro)}</strong></div>
                        <div><span className="text-muted-foreground">Lucro mín. sugerido:</span><br /><strong>{formatPercent(ofertaNormal.lucroMinPct)}</strong></div>
                      </div>
                      <div className="flex items-center gap-4 text-lg font-bold">
                        <span className="line-through text-muted-foreground">{formatBRL(ofertaNormal.somaPrecoNormal)}</span>
                        <span className="text-primary">por {formatBRL(ofertaNormal.preco)}</span>
                      </div>
                      <p className="text-sm">Lucro da oferta: <strong>{formatBRL(ofertaNormal.lucroDinheiro)}</strong></p>
                      <Button size="sm" onClick={() => saveOferta({
                        tipo: 'normal', nome: `${ofertaNormal.p1.nome} + ${ofertaNormal.p2.nome}`,
                        produtoIds: [ofertaNormal.p1.id, ofertaNormal.p2.id],
                        nomesProdutos: [ofertaNormal.p1.nome, ofertaNormal.p2.nome],
                        somaPrecoNormal: ofertaNormal.somaPrecoNormal, precoOferta: ofertaNormal.preco,
                        cmvTotal: ofertaNormal.cmvTotal, dnaPercent: dnaTotal,
                        lucroPercent: ofertaNormal.lucroMinPct, lucroDinheiro: ofertaNormal.lucroDinheiro,
                        objetivoEstrategico: 'Combinar dois produtos coringa com margem garantida',
                        status: 'teste',
                      })}>Salvar Oferta</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subida" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Oferta Subida de Lucro</CardTitle>
                  <CardDescription>Item de menor lucro + coringa. Lucro = média dos mais vendidos ({formatPercent(mediaLucroMaisVendidos)}).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProdSelect value={subidaProdFraco} onChange={setSubidaProdFraco} label="Produto Fraco (Menor Lucro)" />
                    <ProdSelect value={subidaProdCoringa} onChange={setSubidaProdCoringa} label="Produto Coringa" />
                  </div>
                  {ofertaSubida && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Soma normal:</span><br /><strong>{formatBRL(ofertaSubida.somaPrecoNormal)}</strong></div>
                        <div><span className="text-muted-foreground">CMV total:</span><br /><strong>{formatBRL(ofertaSubida.cmvTotal)}</strong></div>
                        <div><span className="text-muted-foreground">Lucro usado:</span><br /><strong>{formatPercent(ofertaSubida.lucroUsadoPct)}</strong></div>
                      </div>
                      <div className="flex items-center gap-4 text-lg font-bold">
                        <span className="line-through text-muted-foreground">{formatBRL(ofertaSubida.somaPrecoNormal)}</span>
                        <span className="text-primary">por {formatBRL(ofertaSubida.preco)}</span>
                      </div>
                      <p className="text-sm">Lucro da oferta: <strong>{formatBRL(ofertaSubida.lucroDinheiro)}</strong></p>
                      <Button size="sm" onClick={() => saveOferta({
                        tipo: 'subida_lucro', nome: `${ofertaSubida.pFraco.nome} + ${ofertaSubida.pCoringa.nome}`,
                        produtoIds: [ofertaSubida.pFraco.id, ofertaSubida.pCoringa.id],
                        nomesProdutos: [ofertaSubida.pFraco.nome, ofertaSubida.pCoringa.nome],
                        somaPrecoNormal: ofertaSubida.somaPrecoNormal, precoOferta: ofertaSubida.preco,
                        cmvTotal: ofertaSubida.cmvTotal, dnaPercent: dnaTotal,
                        lucroPercent: ofertaSubida.lucroUsadoPct, lucroDinheiro: ofertaSubida.lucroDinheiro,
                        objetivoEstrategico: 'Elevar margem de produto com baixa lucratividade',
                        status: 'teste',
                      })}>Salvar Oferta</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="escala" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Oferta Escala de Vendas</CardTitle>
                  <CardDescription>Campeão de vendas + coringa. Lucro mínimo = max(10%, calculado).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProdSelect value={escalaProdCampeao} onChange={setEscalaProdCampeao} label="Campeão de Vendas" />
                    <ProdSelect value={escalaProdCoringa} onChange={setEscalaProdCoringa} label="Produto Coringa" />
                  </div>
                  {ofertaEscala && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Soma normal:</span><br /><strong>{formatBRL(ofertaEscala.somaPrecoNormal)}</strong></div>
                        <div><span className="text-muted-foreground">CMV total:</span><br /><strong>{formatBRL(ofertaEscala.cmvTotal)}</strong></div>
                        <div><span className="text-muted-foreground">Lucro mín. R$:</span><br /><strong>{formatBRL(ofertaEscala.lucroMinDinheiro)}</strong></div>
                        <div><span className="text-muted-foreground">Lucro usado:</span><br /><strong>{formatPercent(ofertaEscala.lucroPct)}</strong></div>
                      </div>
                      <div className="flex items-center gap-4 text-lg font-bold">
                        <span className="line-through text-muted-foreground">{formatBRL(ofertaEscala.somaPrecoNormal)}</span>
                        <span className="text-primary">por {formatBRL(ofertaEscala.preco)}</span>
                      </div>
                      <p className="text-sm">Lucro da oferta: <strong>{formatBRL(ofertaEscala.lucroDinheiro)}</strong></p>
                      <Button size="sm" onClick={() => saveOferta({
                        tipo: 'escala_vendas', nome: `${ofertaEscala.pCampeao.nome} + ${ofertaEscala.pCoringa.nome}`,
                        produtoIds: [ofertaEscala.pCampeao.id, ofertaEscala.pCoringa.id],
                        nomesProdutos: [ofertaEscala.pCampeao.nome, ofertaEscala.pCoringa.nome],
                        somaPrecoNormal: ofertaEscala.somaPrecoNormal, precoOferta: ofertaEscala.preco,
                        cmvTotal: ofertaEscala.cmvTotal, dnaPercent: dnaTotal,
                        lucroPercent: ofertaEscala.lucroPct, lucroDinheiro: ofertaEscala.lucroDinheiro,
                        objetivoEstrategico: 'Escalar volume de vendas com margem de segurança',
                        status: 'teste',
                      })}>Salvar Oferta</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agressiva" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Oferta Agressiva</CardTitle>
                  <CardDescription>Produto novo ou montagem especial. Arredondamento psicológico automático.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Nome da Oferta</label>
                      <Input value={agressivaNome} onChange={e => setAgressivaNome(e.target.value)} placeholder="Ex: Leve 2 por..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">CMV Unitário (R$)</label>
                      <Input type="number" value={agressivaCmv} onChange={e => setAgressivaCmv(e.target.value ? Number(e.target.value) : '')} min={0} step={0.01} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Quantidade</label>
                      <Input type="number" value={agressivaQtd} onChange={e => setAgressivaQtd(Number(e.target.value) || 2)} min={1} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Lucro Alvo (%)</label>
                      <Input type="number" value={agressivaLucro} onChange={e => setAgressivaLucro(Number(e.target.value) || 10)} min={0} step={1} />
                    </div>
                  </div>
                  {ofertaAgressiva && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Preço calculado:</span><br /><strong>{formatBRL(ofertaAgressiva.precoBase)}</strong></div>
                        <div><span className="text-muted-foreground">Lucro da oferta:</span><br /><strong>{formatBRL(ofertaAgressiva.lucroDinheiro)}</strong></div>
                        <div><span className="text-muted-foreground">DNA:</span><br /><strong>{formatPercent(dnaTotal)}</strong></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Sugestões de preço psicológico:</p>
                        <div className="flex flex-wrap gap-2">
                          {ofertaAgressiva.sugestoes.map(p => (
                            <Badge key={p} variant={p === ofertaAgressiva.precoPsico ? 'default' : 'outline'} className="text-base px-3 py-1">
                              {formatBRL(p)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        Leve {agressivaQtd} por {formatBRL(ofertaAgressiva.precoPsico || ofertaAgressiva.precoBase)}
                      </div>
                      <Button size="sm" onClick={() => saveOferta({
                        tipo: 'agressiva', nome: agressivaNome || `Oferta Agressiva`,
                        produtoIds: [], nomesProdutos: [],
                        somaPrecoNormal: 0, precoOferta: ofertaAgressiva.precoPsico || ofertaAgressiva.precoBase,
                        cmvTotal: (typeof agressivaCmv === 'number' ? agressivaCmv : 0) * agressivaQtd,
                        dnaPercent: dnaTotal, lucroPercent: agressivaLucro,
                        lucroDinheiro: ofertaAgressiva.lucroDinheiro,
                        objetivoEstrategico: 'Oferta agressiva para atrair clientes e gerar volume',
                        status: 'teste', cmvUnitario: typeof agressivaCmv === 'number' ? agressivaCmv : 0,
                        quantidade: agressivaQtd, lucroAlvo: agressivaLucro,
                        precoPsicologico: ofertaAgressiva.precoPsico,
                      })}>Salvar Oferta</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ═══ SUGESTÕES AUTOMÁTICAS ═══ */}
        <TabsContent value="sugestoes" className="space-y-4">
          <h2 className="text-lg font-semibold">Sugestões Automáticas de Oferta</h2>
          {sugestoes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Preencha os quadrantes com produtos para receber sugestões automáticas.
            </CardContent></Card>
          ) : sugestoes.map(s => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.nome}</CardTitle>
                  <Badge>{s.tipo.replace('_', ' ')}</Badge>
                </div>
                <CardDescription>{s.objetivoEstrategico}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Produtos:</span><br />{s.nomesProdutos.join(' + ')}</div>
                  <div><span className="text-muted-foreground">Preço normal:</span><br /><strong>{formatBRL(s.somaPrecoNormal)}</strong></div>
                  <div><span className="text-muted-foreground">Preço oferta:</span><br /><strong className="text-primary">{formatBRL(s.precoOferta)}</strong></div>
                  <div><span className="text-muted-foreground">Lucro R$:</span><br /><strong>{formatBRL(s.lucroDinheiro)}</strong></div>
                  <div><span className="text-muted-foreground">Lucro %:</span><br /><strong>{formatPercent(s.lucroPercent)}</strong></div>
                </div>
                <div className="flex items-center gap-4 text-lg font-bold">
                  <span className="line-through text-muted-foreground">{formatBRL(s.somaPrecoNormal)}</span>
                  <span className="text-primary">por {formatBRL(s.precoOferta)}</span>
                </div>
                <Button size="sm" onClick={() => saveOferta({ ...s })}>Salvar Sugestão</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ═══ HISTÓRICO ═══ */}
        <TabsContent value="historico" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Histórico de Ofertas</h2>
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="teste">Em teste</SelectItem>
                <SelectItem value="arquivada">Arquivadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredOfertas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma oferta salva.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredOfertas.map(o => (
                <Card key={o.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{o.nome}</span>
                          <Badge variant={o.status === 'ativa' ? 'default' : o.status === 'teste' ? 'secondary' : 'outline'}>
                            {o.status}
                          </Badge>
                          <Badge variant="outline">{o.tipo.replace('_', ' ')}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
                          <span>Preço: <strong>{formatBRL(o.precoOferta)}</strong></span>
                          <span>Lucro: <strong>{formatBRL(o.lucroDinheiro)}</strong> ({formatPercent(o.lucroPercent)})</span>
                          <span>{new Date(o.criadoEm).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" title="Ativar" onClick={() => updateOfertaStatus(o.id, 'ativa')}><Play className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Teste" onClick={() => updateOfertaStatus(o.id, 'teste')}><FlaskConical className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Arquivar" onClick={() => updateOfertaStatus(o.id, 'arquivada')}><Archive className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Excluir" onClick={() => removeOferta(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
