import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Package, BarChart3, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Dashboard() {
  const { state, dnaTotal, mediaDespesas, mediaFaturamento } = useApp();

  const dna = state.dnaEmpresa;
  const dnaPieData = [
    { name: 'Custo Fixo', value: dna.custoFixoPercent },
    { name: 'Débito', value: dna.taxaDebito },
    { name: 'Crédito', value: dna.taxaCredito },
    { name: 'Impostos', value: dna.impostos },
    { name: 'Marketing', value: dna.marketing },
    { name: 'Voucher', value: dna.voucher },
    { name: 'Média Cartão', value: dna.mediaCartao },
    { name: 'Royalties', value: dna.royalties },
  ].filter(d => d.value > 0);

  const produtoRent = state.produtos.map(p => {
    const precoVenda = p.cmv / (1 - dnaTotal / 100 - 0.1);
    const lucro = precoVenda > 0 ? ((precoVenda - p.cmv - precoVenda * dnaTotal / 100) / precoVenda) * 100 : 0;
    return { name: p.nome, cmv: p.cmv, lucro: Math.max(lucro, 0) };
  });

  const kpis = [
    { title: 'Faturamento Médio', value: formatBRL(mediaFaturamento), icon: DollarSign, color: 'text-primary' },
    { title: 'Custo Fixo Médio', value: formatBRL(mediaDespesas), icon: TrendingUp, color: 'text-destructive' },
    { title: 'DNA da Empresa', value: formatPercent(dnaTotal), icon: BarChart3, color: 'text-warning' },
    { title: 'Total de Produtos', value: String(state.produtos.length), icon: Package, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Composição de Margem Card */}
      <Card className={dna.composicaoMargem > 0 ? 'border-destructive' : 'border-green-500'}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Custo Fixo & Composição de Margem</CardTitle>
          {dna.composicaoMargem > 0
            ? <ShieldAlert className="h-4 w-4 text-destructive" />
            : <ShieldCheck className="h-4 w-4 text-green-600" />}
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-xs text-muted-foreground">% Custo Fixo</p>
              <p className={`text-2xl font-bold ${dna.custoFixoPercent > 33 ? 'text-destructive' : 'text-green-600'}`}>
                {formatPercent(dna.custoFixoPercent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Composição de Margem</p>
              <p className={`text-2xl font-bold ${dna.composicaoMargem > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatPercent(dna.composicaoMargem)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {dna.composicaoMargem > 0
              ? `⚠️ Seu custo fixo passou de 33% e está consumindo ${formatPercent(dna.composicaoMargem)} da sua margem.`
              : '✅ Seu custo fixo está dentro da faixa saudável (≤ 33%).'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DNA da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dnaPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                    {dnaPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CMV por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produtoRent}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="cmv" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
