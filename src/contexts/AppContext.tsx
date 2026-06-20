import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef } from 'react';
import type { AppState, DespesaFixa, FaturamentoMensal, DNAEmpresa, Insumo, ReceitaManipulacao, ProdutoCardapio, Combo, FechamentoDia, ItemCardapio, ItemManipulado, DREState, DiagnosticoResposta, CustosInvisiveis, SimplesNacional, PrecoProduto, VendaDia, Oferta, QuadrantesOfertas } from '@/types';
import { calcularCustosInvisiveis } from '@/lib/custosInvisiveisCalc';
import { calcularImpostoSimples } from '@/lib/simplesNacionalCalc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'precificacao-saas';

const initialCustosInvisiveis: CustosInvisiveis = {
  iptuAnual: 0,
  funcionarios: [],
  valeTransporte: { valorPassagem: 0, passagensPorDia: 2, diasTrabalhados: 22, qtdFuncionarios: 0 },
  depreciacaoInventario: 0,
  brindes: { qtdPorSemana: 0, cmvUnitario: 0, entregaUnitaria: 0, fatorMensal: 4 },
  veiculos: [],
  alimentacao: { qtdFuncionarios: 0, custoDiario: 8, diasTrabalhados: 22 },
};

function computeInsumo(i: Omit<Insumo, 'quantidadeReal' | 'precoReal' | 'custoPorUnidade'>): Insumo {
  const quantidadeReal = i.quantidadeComprada * (1 - i.percentualPerda / 100);
  const precoReal = i.precoPago;
  const custoPorUnidade = quantidadeReal > 0 ? precoReal / quantidadeReal : 0;
  return { ...i, quantidadeReal, precoReal, custoPorUnidade } as Insumo;
}

function computeReceitaCusto(r: ReceitaManipulacao, insumos: Insumo[]): ReceitaManipulacao {
  let custoTotal = 0;
  for (const ing of r.ingredientes) {
    const insumo = insumos.find(i => i.id === ing.insumoId);
    if (insumo) custoTotal += insumo.custoPorUnidade * ing.quantidade;
  }
  const custoPorUnidade = r.quantidadeProduzida > 0 ? custoTotal / r.quantidadeProduzida : 0;
  return { ...r, custoTotal, custoPorUnidade };
}

function computeProdutoCMV(p: ProdutoCardapio, insumos: Insumo[], receitas: ReceitaManipulacao[]): ProdutoCardapio {
  let cmv = p.custoEmbalagem;
  for (const ing of p.ingredientes) {
    if (ing.tipo === 'insumo') {
      const insumo = insumos.find(i => i.id === ing.referenciaId);
      if (insumo) cmv += insumo.custoPorUnidade * ing.quantidade;
    } else {
      const receita = receitas.find(r => r.id === ing.referenciaId);
      if (receita) cmv += receita.custoPorUnidade * ing.quantidade;
    }
  }
  return { ...p, cmv };
}

function computeComboCMV(c: Combo, produtos: ProdutoCardapio[]): Combo {
  let cmvTotal = 0;
  for (const cp of c.produtos) {
    const prod = produtos.find(p => p.id === cp.produtoId);
    if (prod) cmvTotal += prod.cmv * cp.quantidade;
  }
  return { ...c, cmvTotal };
}

function recompute(state: AppState): AppState {
  const insumos = state.insumos.map(i => computeInsumo(i));
  const receitas = state.receitas.map(r => computeReceitaCusto(r, insumos));
  const produtos = state.produtos.map(p => computeProdutoCMV(p, insumos, receitas));
  const combos = state.combos.map(c => computeComboCMV(c, produtos));

  const custosInvCalc = calcularCustosInvisiveis(state.custosInvisiveis);
  const totalInvisiveis = custosInvCalc.total;

  const despesasPorMes: Record<string, number> = {};
  for (const d of state.despesasFixas) {
    despesasPorMes[d.mes] = (despesasPorMes[d.mes] || 0) + d.valor;
  }
  const percentuaisMensais: number[] = [];
  for (const [mes, totalDesp] of Object.entries(despesasPorMes)) {
    const fat = state.faturamento.find(f => f.mes === mes);
    if (fat && fat.valor > 0) {
      percentuaisMensais.push(((totalDesp + totalInvisiveis) / fat.valor) * 100);
    }
  }
  for (const f of state.faturamento) {
    if (f.valor > 0 && !despesasPorMes[f.mes]) {
      percentuaisMensais.push((totalInvisiveis / f.valor) * 100);
    }
  }
  const custoFixoPercent = percentuaisMensais.length > 0
    ? percentuaisMensais.reduce((s, v) => s + v, 0) / percentuaisMensais.length
    : 0;

  const composicaoMargem = custoFixoPercent > 33 ? custoFixoPercent - 33 : 0;
  const mediaCartao = (state.dnaEmpresa.taxaDebito + state.dnaEmpresa.taxaCredito) / 2;

  const sn = state.simplesNacional;
  let impostos = state.dnaEmpresa.impostos;
  if (sn.anexo) {
    const fatValues = state.faturamento.filter(f => f.valor > 0);
    const mediaFat = fatValues.length > 0 ? fatValues.reduce((s, f) => s + f.valor, 0) / fatValues.length : 0;
    const rbt12 = sn.modoSimulacao ? mediaFat * 12 : sn.rbt12Manual;
    const res = calcularImpostoSimples(mediaFat, rbt12, sn.anexo);
    if (res.aliquotaEfetiva > 0) impostos = res.aliquotaEfetiva;
  }

  return {
    ...state,
    insumos,
    receitas,
    produtos,
    combos,
    dnaEmpresa: { ...state.dnaEmpresa, custoFixoPercent, composicaoMargem, mediaCartao, impostos },
  };
}

const defaultMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const initialState: AppState = recompute({
  despesasFixas: [
    { id: '1', mes: 'Janeiro', descricao: 'Aluguel', valor: 3000 },
    { id: '2', mes: 'Janeiro', descricao: 'Energia', valor: 800 },
    { id: '3', mes: 'Janeiro', descricao: 'Água', valor: 200 },
    { id: '4', mes: 'Janeiro', descricao: 'Gás', valor: 400 },
    { id: '5', mes: 'Janeiro', descricao: 'Internet', valor: 150 },
    { id: '6', mes: 'Janeiro', descricao: 'Funcionários', valor: 5000 },
    { id: '7', mes: 'Fevereiro', descricao: 'Aluguel', valor: 3000 },
    { id: '8', mes: 'Fevereiro', descricao: 'Energia', valor: 850 },
    { id: '9', mes: 'Fevereiro', descricao: 'Água', valor: 220 },
    { id: '10', mes: 'Fevereiro', descricao: 'Gás', valor: 380 },
    { id: '11', mes: 'Fevereiro', descricao: 'Internet', valor: 150 },
    { id: '12', mes: 'Fevereiro', descricao: 'Funcionários', valor: 5000 },
  ],
  faturamento: defaultMeses.map((mes, i) => ({
    id: String(i + 1),
    mes,
    valor: i < 2 ? (i === 0 ? 45000 : 42000) : 0,
  })),
  dnaEmpresa: {
    custoFixoPercent: 0,
    composicaoMargem: 0,
    taxaDebito: 2,
    taxaCredito: 5,
    mediaCartao: 3.5,
    impostos: 0,
    voucher: 3,
    franquia: 0,
    isFranquia: false,
  },
  insumos: [
    { id: 'ins1', nome: 'Carne Bovina (Blend)', quantidadeComprada: 1000, unidade: 'g', precoPago: 35, percentualPerda: 10, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins2', nome: 'Queijo Mussarela', quantidadeComprada: 1000, unidade: 'g', precoPago: 28, percentualPerda: 5, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins3', nome: 'Pão de Hambúrguer', quantidadeComprada: 1, unidade: 'un', precoPago: 1.5, percentualPerda: 0, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins4', nome: 'Alface', quantidadeComprada: 500, unidade: 'g', precoPago: 5, percentualPerda: 20, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins5', nome: 'Tomate', quantidadeComprada: 1000, unidade: 'g', precoPago: 8, percentualPerda: 15, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins6', nome: 'Óleo de Soja', quantidadeComprada: 900, unidade: 'ml', precoPago: 7, percentualPerda: 0, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins7', nome: 'Ovo', quantidadeComprada: 1, unidade: 'un', precoPago: 0.8, percentualPerda: 0, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins8', nome: 'Creme de Leite', quantidadeComprada: 200, unidade: 'g', precoPago: 4, percentualPerda: 0, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins9', nome: 'Batata', quantidadeComprada: 1000, unidade: 'g', precoPago: 6, percentualPerda: 15, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins10', nome: 'Coca-Cola 350ml', quantidadeComprada: 1, unidade: 'un', precoPago: 3.5, percentualPerda: 0, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins11', nome: 'Embalagem Hambúrguer', quantidadeComprada: 1, unidade: 'un', precoPago: 0.8, percentualPerda: 0, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
    { id: 'ins12', nome: 'Bacon', quantidadeComprada: 1000, unidade: 'g', precoPago: 45, percentualPerda: 5, quantidadeReal: 0, precoReal: 0, custoPorUnidade: 0 },
  ],
  receitas: [
    {
      id: 'rec1', nome: 'Maionese Caseira', quantidadeProduzida: 500, unidade: 'g',
      ingredientes: [
        { id: 'ri1', insumoId: 'ins6', quantidade: 300 },
        { id: 'ri2', insumoId: 'ins8', quantidade: 200 },
        { id: 'ri3', insumoId: 'ins7', quantidade: 4 },
      ],
      custoTotal: 0, custoPorUnidade: 0,
    },
  ],
  produtos: [
    {
      id: 'prod1', nome: 'X-Burguer',
      ingredientes: [
        { id: 'pi1', tipo: 'insumo', referenciaId: 'ins1', quantidade: 150 },
        { id: 'pi2', tipo: 'insumo', referenciaId: 'ins2', quantidade: 50 },
        { id: 'pi3', tipo: 'insumo', referenciaId: 'ins3', quantidade: 1 },
        { id: 'pi4', tipo: 'insumo', referenciaId: 'ins4', quantidade: 20 },
        { id: 'pi5', tipo: 'insumo', referenciaId: 'ins5', quantidade: 30 },
        { id: 'pi6', tipo: 'receita', referenciaId: 'rec1', quantidade: 15 },
      ],
      custoEmbalagem: 0.8, cmv: 0,
    },
    {
      id: 'prod2', nome: 'X-Bacon',
      ingredientes: [
        { id: 'pi7', tipo: 'insumo', referenciaId: 'ins1', quantidade: 150 },
        { id: 'pi8', tipo: 'insumo', referenciaId: 'ins2', quantidade: 50 },
        { id: 'pi9', tipo: 'insumo', referenciaId: 'ins3', quantidade: 1 },
        { id: 'pi10', tipo: 'insumo', referenciaId: 'ins12', quantidade: 30 },
        { id: 'pi11', tipo: 'insumo', referenciaId: 'ins4', quantidade: 20 },
        { id: 'pi12', tipo: 'insumo', referenciaId: 'ins5', quantidade: 30 },
        { id: 'pi13', tipo: 'receita', referenciaId: 'rec1', quantidade: 15 },
      ],
      custoEmbalagem: 0.8, cmv: 0,
    },
    {
      id: 'prod3', nome: 'Porção de Batata Frita',
      ingredientes: [
        { id: 'pi14', tipo: 'insumo', referenciaId: 'ins9', quantidade: 300 },
        { id: 'pi15', tipo: 'insumo', referenciaId: 'ins6', quantidade: 100 },
      ],
      custoEmbalagem: 0.5, cmv: 0,
    },
  ],
  combos: [
    {
      id: 'combo1', nome: 'Combo X-Burguer + Coca',
      produtos: [
        { produtoId: 'prod1', quantidade: 1 },
        { produtoId: 'prod3', quantidade: 1 },
      ],
      cmvTotal: 0,
    },
  ],
  fechamentos: [],
  itensCardapio: [],
  itensManipulados: [],
  custosInvisiveis: initialCustosInvisiveis,
  dre: {
    valores: Object.fromEntries(
      ['fatBruto','impostos','ingredientes','salariosProd','proLabore','bebidasRevenda',
       'aluguel','aguaLuz','outrosInfra','honorariosAgencia','midiaSocial','marketing',
       'contabilidade','limpezaEscritorio','outrosAdmin','reformas','emprestimos','taxaMaquininha','reservaCaixa',
      ].map(k => [k, Array(12).fill(0)])
    ),
  },
  simplesNacional: { anexo: 'I', rbt12Manual: 0, modoSimulacao: true },
  diagnosticoRespostas: [],
  precosProdutos: [],
  vendas: [],
  ofertas: [],
  quadrantesOfertas: { maisVendidos: [], menosVendidos: [], maisLucrativos: [], menosLucrativos: [] },
});

type Action =
  | { type: 'SET_DESPESAS'; payload: DespesaFixa[] }
  | { type: 'SET_FATURAMENTO'; payload: FaturamentoMensal[] }
  | { type: 'SET_DNA'; payload: Partial<DNAEmpresa> }
  | { type: 'SET_INSUMOS'; payload: Insumo[] }
  | { type: 'SET_RECEITAS'; payload: ReceitaManipulacao[] }
  | { type: 'SET_PRODUTOS'; payload: ProdutoCardapio[] }
  | { type: 'SET_COMBOS'; payload: Combo[] }
  | { type: 'SET_FECHAMENTOS'; payload: FechamentoDia[] }
  | { type: 'SET_ITENS_CARDAPIO'; payload: ItemCardapio[] }
  | { type: 'SET_ITENS_MANIPULADOS'; payload: ItemManipulado[] }
  | { type: 'SET_CUSTOS_INVISIVEIS'; payload: CustosInvisiveis }
  | { type: 'SET_DRE'; payload: DREState }
  | { type: 'SET_DIAGNOSTICO'; payload: DiagnosticoResposta[] }
  | { type: 'SET_SIMPLES_NACIONAL'; payload: SimplesNacional }
  | { type: 'SET_PRECOS_PRODUTOS'; payload: PrecoProduto[] }
  | { type: 'ADD_VENDA'; payload: VendaDia }
  | { type: 'REMOVE_VENDA'; payload: string }
  | { type: 'SET_VENDAS'; payload: VendaDia[] }
  | { type: 'SET_OFERTAS'; payload: Oferta[] }
  | { type: 'ADD_OFERTA'; payload: Oferta }
  | { type: 'UPDATE_OFERTA'; payload: Oferta }
  | { type: 'REMOVE_OFERTA'; payload: string }
  | { type: 'SET_QUADRANTES_OFERTAS'; payload: QuadrantesOfertas }
  | { type: 'LOAD_STATE'; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DESPESAS': return recompute({ ...state, despesasFixas: action.payload });
    case 'SET_FATURAMENTO': return recompute({ ...state, faturamento: action.payload });
    case 'SET_DNA': return recompute({ ...state, dnaEmpresa: { ...state.dnaEmpresa, ...action.payload } });
    case 'SET_INSUMOS': return recompute({ ...state, insumos: action.payload });
    case 'SET_RECEITAS': return recompute({ ...state, receitas: action.payload });
    case 'SET_PRODUTOS': return recompute({ ...state, produtos: action.payload });
    case 'SET_COMBOS': return recompute({ ...state, combos: action.payload });
    case 'SET_FECHAMENTOS': return { ...state, fechamentos: action.payload };
    case 'SET_ITENS_CARDAPIO': return { ...state, itensCardapio: action.payload };
    case 'SET_ITENS_MANIPULADOS': return { ...state, itensManipulados: action.payload };
    case 'SET_CUSTOS_INVISIVEIS': return recompute({ ...state, custosInvisiveis: action.payload });
    case 'SET_DRE': return { ...state, dre: action.payload };
    case 'SET_DIAGNOSTICO': return { ...state, diagnosticoRespostas: action.payload };
    case 'SET_SIMPLES_NACIONAL': return { ...state, simplesNacional: action.payload };
    case 'SET_PRECOS_PRODUTOS': return { ...state, precosProdutos: action.payload };
    case 'ADD_VENDA': return { ...state, vendas: [...state.vendas, action.payload] };
    case 'REMOVE_VENDA': return { ...state, vendas: state.vendas.filter(v => v.id !== action.payload) };
    case 'SET_VENDAS': return { ...state, vendas: action.payload };
    case 'SET_OFERTAS': return { ...state, ofertas: action.payload };
    case 'ADD_OFERTA': return { ...state, ofertas: [...state.ofertas, action.payload] };
    case 'UPDATE_OFERTA': return { ...state, ofertas: state.ofertas.map(o => o.id === action.payload.id ? action.payload : o) };
    case 'REMOVE_OFERTA': return { ...state, ofertas: state.ofertas.filter(o => o.id !== action.payload) };
    case 'SET_QUADRANTES_OFERTAS': return { ...state, quadrantesOfertas: action.payload };
    case 'LOAD_STATE': return recompute(action.payload);
    default: return state;
  }
}

function mergeLoaded(raw: any): AppState {
  const mergedDna = { ...initialState.dnaEmpresa, ...(raw.dnaEmpresa || {}) };
  delete (mergedDna as any).royalties;
  delete (mergedDna as any).marketing;

  let dre = initialState.dre;
  if (raw.dre?.valores && typeof raw.dre.valores === 'object') {
    const mergedValores = { ...initialState.dre.valores };
    for (const key of Object.keys(raw.dre.valores)) {
      if (Array.isArray(raw.dre.valores[key])) mergedValores[key] = raw.dre.valores[key];
    }
    dre = { valores: mergedValores };
  }

  return recompute({
    ...initialState,
    ...raw,
    dnaEmpresa: mergedDna,
    custosInvisiveis: raw.custosInvisiveis
      ? { ...initialCustosInvisiveis, ...raw.custosInvisiveis,
          valeTransporte: { ...initialCustosInvisiveis.valeTransporte, ...(raw.custosInvisiveis?.valeTransporte || {}) },
          brindes: { ...initialCustosInvisiveis.brindes, ...(raw.custosInvisiveis?.brindes || {}) },
          alimentacao: { ...initialCustosInvisiveis.alimentacao, ...(raw.custosInvisiveis?.alimentacao || {}) } }
      : initialCustosInvisiveis,
    dre,
    simplesNacional: raw.simplesNacional ? { ...initialState.simplesNacional, ...raw.simplesNacional } : initialState.simplesNacional,
    diagnosticoRespostas: raw.diagnosticoRespostas || [],
    precosProdutos: Array.isArray(raw.precosProdutos) ? raw.precosProdutos : [],
    vendas: Array.isArray(raw.vendas) ? raw.vendas : [],
    ofertas: Array.isArray(raw.ofertas) ? raw.ofertas : [],
    quadrantesOfertas: raw.quadrantesOfertas
      ? { ...initialState.quadrantesOfertas, ...raw.quadrantesOfertas }
      : initialState.quadrantesOfertas,
  });
}

function loadFromLocalStorage(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return mergeLoaded(JSON.parse(saved));
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }
  return initialState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  dnaTotal: number;
  mediaDespesas: number;
  mediaFaturamento: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, viewingAsUserId } = useAuth();
  const [state, dispatch] = useReducer(reducer, null, loadFromLocalStorage);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef<string | null>(null);

  const effectiveUserId = viewingAsUserId || user?.id || null;

  // Load from Supabase when user or viewingAsUserId changes
  useEffect(() => {
    if (!effectiveUserId) return;
    if (loadedRef.current === effectiveUserId) return;

    async function loadFromSupabase() {
      const { data } = await supabase
        .from('app_state')
        .select('state')
        .eq('user_id', effectiveUserId)
        .single();

      if (data?.state) {
        loadedRef.current = effectiveUserId;
        dispatch({ type: 'LOAD_STATE', payload: mergeLoaded(data.state) });
      } else {
        loadedRef.current = effectiveUserId;
      }
    }
    loadFromSupabase();
  }, [effectiveUserId]);

  // Debounced save to Supabase (skip when viewing as another user — don't overwrite their data unintentionally)
  useEffect(() => {
    if (!user?.id || viewingAsUserId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await supabase
        .from('app_state')
        .upsert({ user_id: user.id, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }, 1500);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state, user?.id, viewingAsUserId]);

  const fatValues = state.faturamento.filter(f => f.valor > 0);
  const mediaFaturamento = fatValues.length > 0 ? fatValues.reduce((s, f) => s + f.valor, 0) / fatValues.length : 0;
  const mesesDespesas = new Set(state.despesasFixas.map(d => d.mes)).size || 1;
  const mediaDespesas = state.despesasFixas.reduce((s, d) => s + d.valor, 0) / mesesDespesas;

  const dna = state.dnaEmpresa;
  const dnaTotal = dna.custoFixoPercent + dna.mediaCartao + dna.impostos + dna.voucher + (dna.isFranquia ? dna.franquia : 0);

  const value = useMemo(() => ({ state, dispatch, dnaTotal, mediaDespesas, mediaFaturamento }), [state, dnaTotal, mediaDespesas, mediaFaturamento]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
