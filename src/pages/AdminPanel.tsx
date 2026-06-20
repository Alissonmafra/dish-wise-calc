import { useEffect, useState } from 'react';
import { useAuth, type Profile } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserPlus, Eye, ToggleLeft, ToggleRight, Users, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user, session, setViewingAs, viewingAsUserId } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes]       = useState<Profile[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating]       = useState(false);

  const [formEmail, setFormEmail]             = useState('');
  const [formSenha, setFormSenha]             = useState('');
  const [formNome, setFormNome]               = useState('');
  const [showForm, setShowForm]               = useState(false);

  useEffect(() => { loadClientes(); }, []);

  async function loadClientes() {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'cliente')
      .order('criado_em', { ascending: false });
    if (error) toast.error('Erro ao carregar clientes');
    else setClientes((data as Profile[]) || []);
    setLoadingList(false);
  }

  async function criarCliente(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmail || !formSenha || !formNome) { toast.error('Preencha todos os campos'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email: formEmail, password: formSenha, nome_restaurante: formNome },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success(`Cliente "${formNome}" criado com sucesso!`);
      setFormEmail(''); setFormSenha(''); setFormNome(''); setShowForm(false);
      loadClientes();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar cliente');
    } finally {
      setCreating(false);
    }
  }

  async function toggleAtivo(cliente: Profile) {
    const { error } = await supabase
      .from('profiles')
      .update({ ativo: !cliente.ativo })
      .eq('id', cliente.id);
    if (error) toast.error('Erro ao atualizar status');
    else {
      toast.success(`Cliente ${!cliente.ativo ? 'ativado' : 'desativado'}`);
      loadClientes();
    }
  }

  function acessarComoCliente(clienteId: string) {
    setViewingAs(clienteId);
    navigate('/');
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm">Gerencie os clientes do sistema Umami</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadClientes} disabled={loadingList}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Visualizando como cliente banner */}
      {viewingAsUserId && (
        <div className="flex items-center gap-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
          <Eye className="h-4 w-4 text-yellow-600 shrink-0" />
          <span className="flex-1">Você está visualizando os dados de um cliente.</span>
          <Button size="sm" variant="outline" onClick={() => setViewingAs(null)}>
            <ArrowLeft className="h-3 w-3 mr-1" /> Voltar ao admin
          </Button>
        </div>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Criar novo cliente</CardTitle>
            <CardDescription>O cliente receberá acesso com as credenciais definidas abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={criarCliente} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Nome do restaurante</Label>
                <Input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Ex: Restaurante do João" disabled={creating} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="cliente@email.com" disabled={creating} />
              </div>
              <div className="space-y-1">
                <Label>Senha inicial</Label>
                <Input type="password" value={formSenha} onChange={e => setFormSenha(e.target.value)} placeholder="Mínimo 6 caracteres" disabled={creating} />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Cliente'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Total clientes</p>
            <p className="text-2xl font-bold">{clientes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-green-600">{clientes.filter(c => c.ativo).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Inativos</p>
            <p className="text-2xl font-bold text-red-500">{clientes.filter(c => !c.ativo).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Novos este mês</p>
            <p className="text-2xl font-bold text-primary">
              {clientes.filter(c => new Date(c.criado_em).getMonth() === new Date().getMonth()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de clientes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Clientes cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingList ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum cliente cadastrado ainda.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                  <TableHead className="hidden md:table-cell">Último acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map(cliente => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cliente.nome_restaurante || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(cliente.criado_em)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(cliente.ultimo_acesso)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm" variant="ghost"
                          title="Visualizar como este cliente"
                          onClick={() => acessarComoCliente(cliente.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          title={cliente.ativo ? 'Desativar' : 'Ativar'}
                          onClick={() => toggleAtivo(cliente)}
                        >
                          {cliente.ativo
                            ? <ToggleRight className="h-4 w-4 text-green-600" />
                            : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
