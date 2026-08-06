import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatBRL, formatPercent } from '@/lib/formatters';
import { calcularImpostoSimples, obterTabela } from '@/lib/simplesNacionalCalc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Info } from 'lucide-react';

const ANEXOS = ['I', 'II', 'III', 'IV', 'V'];

export default function ImpostosTab() {
  const { state, dispatch, mediaFaturamento } = useApp();
  const sn = state.simplesNacional;

  const updateSN = (update: Partial<typeof sn>) => {
    dispatch({ type: 'SET_SIMPLES_NACIONAL', payload: { ...sn, ...update } });
  };

  const isMEI = sn.regime === 'MEI';
  const faturamentoMensal = mediaFaturamento;
  const rbt12 = sn.modoSimulacao ? faturamentoMensal * 12 : sn.rbt12Manual;

  const resultado = useMemo(
    () => calcularImpostoSimples(faturamentoMensal, rbt12, sn.anexo, sn.regime),
    [faturamentoMensal, rbt12, sn.anexo, sn.regime]
  );

  const tabela = useMemo(() => (isMEI ? [] : obterTabela(sn.anexo)), [sn.anexo, isMEI]);

  return (
    <div className="space-y-4">
      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração Tributária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Regime Tributário</Label>
              <Select value={sn.regime} onValueChange={(v: 'MEI' | 'SIMPLES') => updateSN({ regime: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Faturamento Mensal (R$)</Label>
              <div className="p-2 bg-muted rounded-md text-sm font-medium mt-1">
                {formatBRL(faturamentoMensal)}
                <p className="text-xs text-muted-foreground">Média do faturamento cadastrado</p>
              </div>
            </div>

            {isMEI ? (
              <div>
                <Label>Valor do DAS mensal (R$) — informativo</Label>
                <Input
                  type="number"
                  value={sn.dasMensal || ''}
                  onChange={e => updateSN({ dasMensal: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 75.90"
                />
              </div>
            ) : null}
          </div>

          {!isMEI && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Anexo do Simples Nacional</Label>
                <Select value={sn.anexo} onValueChange={v => updateSN({ anexo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o anexo" /></SelectTrigger>
                  <SelectContent>
                    {ANEXOS.map(a => (
                      <SelectItem key={a} value={a}>
                        Anexo {a} {a !== 'I' ? '(em breve)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Switch checked={sn.modoSimulacao} onCheckedChange={v => updateSN({ modoSimulacao: v })} />
                  <Label className="cursor-pointer">Modo Simulação</Label>
                </div>
                {sn.modoSimulacao ? (
                  <div className="p-2 bg-muted rounded-md text-sm">
                    <p className="font-medium">RBT12 Estimado: {formatBRL(rbt12)}</p>
                    <p className="text-xs text-muted-foreground">Faturamento mensal × 12</p>
                  </div>
                ) : (
                  <div>
                    <Label>RBT12 Manual (R$)</Label>
                    <Input
                      type="number"
                      value={sn.rbt12Manual || ''}
                      onChange={e => updateSN({ rbt12Manual: parseFloat(e.target.value) || 0 })}
                      placeholder="Receita bruta acumulada 12 meses"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {isMEI && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                O <strong className="text-foreground">MEI não paga alíquota percentual</strong> sobre o faturamento —
                o imposto é um valor fixo mensal (DAS). Por isso a alíquota efetiva usada na precificação é{' '}
                <strong className="text-foreground">0%</strong>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Alertas */}
      {resultado.alertas.length > 0 && (
        <div className="space-y-2">
          {resultado.alertas.map((msg, i) => (
            <Card key={i} className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
              <CardContent className="flex items-start gap-3 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">{msg}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resultado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Resultado do Cálculo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isMEI ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground">Enquadramento</p>
                  <p className="text-sm font-semibold">{resultado.faixa}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground font-semibold">Alíquota Efetiva</p>
                  <p className="text-2xl font-bold text-primary">0,00%</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">DAS mensal (informativo)</p>
                  <p className="text-2xl font-bold">{formatBRL(sn.dasMensal || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">Não entra no percentual do DNA</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Faixa Enquadrada</p>
                    <p className="text-sm font-semibold">{resultado.faixa}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Alíquota Nominal</p>
                    <p className="text-lg font-bold">{formatPercent(resultado.aliquotaNominal)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Parcela a Deduzir</p>
                    <p className="text-lg font-bold">{formatBRL(resultado.parcelaADeduzir)}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground font-semibold">Alíquota Efetiva</p>
                    <p className="text-2xl font-bold text-primary">{formatPercent(resultado.aliquotaEfetiva)}</p>
                  </div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">Imposto do Mês</p>
                  <p className="text-3xl font-bold text-primary">{formatBRL(resultado.impostoMensal)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card educativo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" /> {isMEI ? 'Como funciona o MEI' : 'Como funciona o cálculo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {isMEI ? (
              <>
                <p>
                  O MEI recolhe um <strong className="text-foreground">valor fixo mensal (DAS)</strong>, e não um percentual
                  sobre o faturamento. Por isso a alíquota usada na precificação é 0% e o DNA da Empresa não carrega imposto.
                </p>
                <p>
                  O valor do DAS é um <strong className="text-foreground">custo fixo</strong>: se quiser considerá-lo no preço,
                  cadastre-o em Despesas Fixas.
                </p>
                <p className="text-xs">
                  ⚠️ Limite de faturamento do MEI: R$ 81.000,00 por ano. Ao ultrapassar, é necessário migrar para o Simples Nacional.
                </p>
              </>
            ) : (
              <>
                <p>
                  No Simples Nacional, a alíquota do mês <strong className="text-foreground">não é a alíquota nominal da faixa</strong>.
                  O cálculo correto usa a <strong className="text-foreground">alíquota efetiva</strong>.
                </p>
                <div className="p-3 bg-muted rounded-lg font-mono text-xs">
                  <p>Alíquota Efetiva = ((RBT12 × Alíquota Nominal) − Parcela a Deduzir) ÷ RBT12</p>
                  <p className="mt-1">Imposto do Mês = Faturamento Mensal × Alíquota Efetiva</p>
                </div>
                <p>
                  A <strong className="text-foreground">RBT12</strong> é a receita bruta acumulada nos 12 meses anteriores ao período de apuração.
                  Ela determina a faixa da tabela e, consequentemente, a alíquota nominal e a parcela a deduzir.
                </p>
                <p className="text-xs">
                  ⚠️ Usar a alíquota nominal diretamente pode <strong className="text-foreground">superestimar o imposto</strong> e distorcer a margem real do negócio.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de referência */}
      {tabela.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tabela do Anexo {sn.anexo} — Simples Nacional</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faixa</TableHead>
                <TableHead className="text-right">Receita Bruta (12 meses)</TableHead>
                <TableHead className="text-right">Alíquota Nominal</TableHead>
                <TableHead className="text-right">Parcela a Deduzir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabela.map((f, i) => {
                const isCurrentFaixa = rbt12 >= f.limiteInferior && rbt12 <= f.limiteSuperior;
                return (
                  <TableRow key={i} className={isCurrentFaixa ? 'bg-primary/10 font-semibold' : ''}>
                    <TableCell>{i + 1}ª Faixa</TableCell>
                    <TableCell className="text-right">
                      {f.limiteInferior === 0
                        ? `Até ${formatBRL(f.limiteSuperior)}`
                        : `${formatBRL(f.limiteInferior)} a ${formatBRL(f.limiteSuperior)}`}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(f.aliquotaNominal)}</TableCell>
                    <TableCell className="text-right">{formatBRL(f.parcelaADeduzir)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
