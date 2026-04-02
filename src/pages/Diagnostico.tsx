import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Pergunta {
  id: string;
  texto: string;
  diagnosticar: (resp: string) => { emoji: string; label: string; acao: string };
}

const perguntas: Pergunta[] = [
  {
    id: '1', texto: 'Como você define o preço de venda dos seus produtos?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('dobro') || l.includes('concorrência') || l.includes('concorrencia'))
        ? { emoji: '🚨', label: 'Precificação por achismo', acao: 'Implementar ficha técnica e precificação por CMV' }
        : { emoji: '✅', label: 'Tem metodologia', acao: 'Manter e revisar periodicamente' };
    },
  },
  {
    id: '2', texto: 'Você tem um pró-labore fixo todo mês?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('não') || l.includes('nao'))
        ? { emoji: '🚨', label: 'Sem pró-labore fixo', acao: 'Definir pró-labore fixo mensal imediatamente' }
        : { emoji: '✅', label: 'Tem pró-labore', acao: 'Verificar se é compatível com o faturamento' };
    },
  },
  {
    id: '3', texto: 'Você olha o DRE do seu negócio? Com que frequência?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('não') || l.includes('nao') || l.includes('nunca'))
        ? { emoji: '🚨', label: 'Não acompanha DRE', acao: 'Implementar DRE mensal urgente' }
        : { emoji: '✅', label: 'Acompanha', acao: 'Garantir frequência mensal mínima' };
    },
  },
  {
    id: '4', texto: 'Qual é o seu CMV atual?',
    diagnosticar: (r) => {
      const num = parseFloat(r.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!isNaN(num) && num >= 50 && num <= 57)
        return { emoji: '✅', label: 'CMV na faixa ideal', acao: 'Manter controle e buscar redução gradual' };
      return { emoji: '🚨', label: 'CMV fora da faixa (50-57%)', acao: 'Revisar ficha técnica e fornecedores' };
    },
  },
  {
    id: '5', texto: 'Você mistura gastos pessoais com gastos da empresa?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('sim') || l.includes('às vezes') || l.includes('as vezes'))
        ? { emoji: '🚨', label: 'Mistura PF e PJ', acao: 'Separar contas pessoais e empresariais imediatamente' }
        : { emoji: '✅', label: 'Separado', acao: 'Manter disciplina financeira' };
    },
  },
  {
    id: '6', texto: 'Você sabe de onde vêm seus clientes?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('não') || l.includes('nao'))
        ? { emoji: '⚠️', label: 'Sem rastreio de origem', acao: 'Implementar pesquisa de origem de clientes' }
        : { emoji: '✅', label: 'Rastreia', acao: 'Otimizar canais mais rentáveis' };
    },
  },
  {
    id: '7', texto: 'Você tem reserva de caixa para 3 meses?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('não') || l.includes('nao'))
        ? { emoji: '🚨', label: 'Sem reserva de caixa', acao: 'Criar reserva de emergência de 3 meses de custo fixo' }
        : { emoji: '✅', label: 'Tem reserva', acao: 'Manter e ajustar conforme crescimento' };
    },
  },
  {
    id: '8', texto: 'Você já calculou o ponto de equilíbrio?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('não') || l.includes('nao'))
        ? { emoji: '⚠️', label: 'Não conhece PE', acao: 'Calcular ponto de equilíbrio e monitorar mensalmente' }
        : { emoji: '✅', label: 'Conhece PE', acao: 'Revisar PE a cada alteração de custos' };
    },
  },
  {
    id: '9', texto: 'Você repassa aumentos de fornecedores para o preço?',
    diagnosticar: (r) => {
      const l = r.toLowerCase();
      return (l.includes('não') || l.includes('nao') || l.includes('nunca'))
        ? { emoji: '⚠️', label: 'Não repassa aumentos', acao: 'Criar política de reajuste trimestral' }
        : { emoji: '✅', label: 'Repassa', acao: 'Manter acompanhamento de custos' };
    },
  },
  {
    id: '10', texto: 'Você investe em marketing/tráfego? Quanto % do faturamento?',
    diagnosticar: (r) => {
      const num = parseFloat(r.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!isNaN(num) && num >= 4 && num <= 6)
        return { emoji: '✅', label: 'Investimento adequado', acao: 'Manter e otimizar ROI' };
      return { emoji: '⚠️', label: 'Investimento fora da faixa (4-6%)', acao: 'Ajustar investimento em marketing para 4-6% do faturamento' };
    },
  },
];

export default function Diagnostico() {
  const { state, dispatch } = useApp();
  const respostas = state.diagnosticoRespostas;

  const updateResposta = (id: string, valor: string) => {
    const existing = respostas.find(r => r.id === id);
    const updated = existing
      ? respostas.map(r => r.id === id ? { ...r, resposta: valor } : r)
      : [...respostas, { id, resposta: valor }];
    dispatch({ type: 'SET_DIAGNOSTICO', payload: updated });
  };

  const getResposta = (id: string) => respostas.find(r => r.id === id)?.resposta || '';

  const pontuacao = useMemo(() => {
    let alertas = 0, atencoes = 0, oks = 0;
    perguntas.forEach(pg => {
      const resp = getResposta(pg.id);
      if (!resp) return;
      const d = pg.diagnosticar(resp);
      if (d.emoji === '🚨') alertas++;
      else if (d.emoji === '⚠️') atencoes++;
      else oks++;
    });
    return { alertas, atencoes, oks };
  }, [respostas]);

  const interpretacao = pontuacao.alertas <= 2
    ? '🟢 Negócio relativamente saudável'
    : pontuacao.alertas <= 5
    ? '🟡 Atenção, problemas estruturais'
    : '🔴 Risco alto, intervenção urgente';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Diagnóstico Rápido</h1>
      <p className="text-muted-foreground">Saúde Financeira do Restaurante</p>

      <Card>
        <CardHeader><CardTitle>Questionário</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left w-8">#</th>
                  <th className="p-2 text-left min-w-[250px]">Pergunta</th>
                  <th className="p-2 text-left min-w-[200px]">Resposta</th>
                  <th className="p-2 text-left min-w-[150px]">Diagnóstico</th>
                  <th className="p-2 text-left min-w-[200px]">Ação Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {perguntas.map((pg, idx) => {
                  const resp = getResposta(pg.id);
                  const diag = resp ? pg.diagnosticar(resp) : null;
                  return (
                    <tr key={pg.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2 font-medium">{pg.id}</td>
                      <td className="p-2">{pg.texto}</td>
                      <td className="p-2">
                        <Input
                          value={resp}
                          onChange={e => updateResposta(pg.id, e.target.value)}
                          placeholder="Digite sua resposta..."
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-2">
                        {diag && (
                          <Badge variant={diag.emoji === '✅' ? 'default' : diag.emoji === '🚨' ? 'destructive' : 'secondary'}>
                            {diag.emoji} {diag.label}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{diag?.acao || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-destructive">{pontuacao.alertas}</div>
            <p className="text-sm text-muted-foreground">🚨 Alertas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-500">{pontuacao.atencoes}</div>
            <p className="text-sm text-muted-foreground">⚠️ Atenções</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{pontuacao.oks}</div>
            <p className="text-sm text-muted-foreground">✅ OK</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-lg font-bold">{interpretacao}</div>
            <p className="text-xs text-muted-foreground mt-1">Interpretação geral</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
