import { useEffect, useState } from 'react';
import { useAuth, type Profile } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Eye, ToggleLeft, ToggleRight, Users, RefreshCw, Pencil, Check, X, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Cliente temporário sem persistência de sessão — usado só para criar usuários
// sem afetar a sessão do admin
function createTempClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export default function AdminPanel() {
  const { setViewingAs } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes]   = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome]   = useState('');

  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formNome, setFormNome]   = useState('');

  useEffect(() => { loadClientes(); }, []);

  async function loadClientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'cliente')
      .order('criado_em', { ascending: false });
    if (error) toast.error('Erro ao carregar clientes');
    else setClientes((data as Profile[]) || []);
    setLoading(false);
  }

  async function criarCliente(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmail || !formSenha || !formNome) { toast.error('Preencha todos os campos'); return; }
    if (formSenha.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }

    setCreating(true);
    try {
      // Usa cliente temporário para não derrubar a sessão do admin
      const tempClient = createTempClient();
      const { data, error } = await tempClient.auth.signUp({
        email: formEmail,
        password: formSenha,
        options: {
          data: { nome_restaurante: formNome, role: 'cliente' },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Usuário não foi criado');

      // Atualiza nome_restaurante no profile (o trigger cria o registro, mas pode
      // não ter o nome ainda se a confirmação por email estiver ativa)
      await supabase
        .from('profiles')
        .update({ nome_restaurante: formNome, role: 'cliente' })
        .eq('id', data.user.id);

      toast.success(`Cliente "${formNome}" criado! Ele já pode fazer login.`);
      setFormEmail(''); setFormSenha(''); setFormNome('');
      setShowForm(false);
      setTimeout(loadClientes, 800);
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(err.message || 'Erro ao criar cliente');
      }
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
      toast.success(cliente.ativo ? 'Cliente desativado' : 'Cliente ativado');
      loadClientes();
    }
  }

  function startEdit(cliente: Profile) {
    setEditingId(cliente.id);
    setEditNome(cliente.nome_restaurante || '');
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ nome_restaurante: editNome })
      .eq('id', id);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Nome atualizado');
    setEditingId(null);
    loadClientes();
  }

  function acessarComoCliente(clienteId: string) {
    setViewingAs(clienteId);
    navigate('/');
  }

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const ativos   = clientes.filter(c => c.ativo).length;
  const inativos = clientes.filter(c => !c.ativo).length;
  const esteMes  = clientes.filter(c => new Date(c.criado_em).getMonth() === new Date().getMonth()).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm">Gerencie os clientes do sistema Umami</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadClientes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Criar novo cliente</CardTitle>
            <CardDescription>O cliente poderá fazer login imediatamente com as credenciais abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={criarCliente} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Nome do restaurante</Label>
                <Input
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  placeholder="Ex: Restaurante do João"
                  disabled={creating}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  disabled={creating}
                />
              </div>
              <div className="space-y-1">
                <Label>Senha inicial</Label>
                <Input
                  type="password"
                  value={formSenha}
                  onChange={e => setFormSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={creating}
                />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Cliente'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: clientes.length, color: '' },
          { label: 'Ativos', value: ativos, color: 'text-green-600' },
          { label: 'Inativos', value: inativos, color: 'text-red-500' },
          { label: 'Este mês', value: esteMes, color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de clientes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Clientes cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum cliente ainda. Clique em <strong>Novo Cliente</strong> para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                  <TableHead className="hidden md:table-cell">Último acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map(cliente => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      {editingId === cliente.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editNome}
                            onChange={e => setEditNome(e.target.value)}
                            className="h-7 text-sm w-44"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit(cliente.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveEdit(cliente.id)}>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">
                          {cliente.nome_restaurante || (
                            <span className="text-muted-foreground italic text-sm">sem nome</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(cliente.criado_em)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(cliente.ultimo_acesso)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" title="Editar nome" onClick={() => startEdit(cliente)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Visualizar como este cliente" onClick={() => acessarComoCliente(cliente.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title={cliente.ativo ? 'Desativar' : 'Ativar'} onClick={() => toggleAtivo(cliente)}>
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
