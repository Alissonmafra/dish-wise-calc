import { useEffect, useState } from 'react';
import { useAuth, type Profile } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Eye, ToggleLeft, ToggleRight, Users, RefreshCw, Pencil, Check, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const { setViewingAs } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes]       = useState<Profile[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editNome, setEditNome]       = useState('');

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

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm">Gerencie os clientes do sistema Umami</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadClientes} disabled={loadingList}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Instrução para criar clientes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-3">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">Como adicionar um novo cliente:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                <li>No Lovable, vá em <strong>Cloud → Users → Add user</strong></li>
                <li>Preencha o email e senha do cliente</li>
                <li>Clique em <strong>Atualizar</strong> aqui — o cliente aparece automaticamente</li>
                <li>Clique no lápis <Pencil className="inline h-3 w-3" /> para definir o nome do restaurante</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
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
            <p className="text-xs text-muted-foreground">Este mês</p>
            <p className="text-2xl font-bold text-primary">
              {clientes.filter(c => new Date(c.criado_em).getMonth() === new Date().getMonth()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Clientes cadastrados
          </CardTitle>
          <CardDescription>Usuários adicionados via Cloud → Users no Lovable</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingList ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum cliente ainda. Adicione via <strong>Cloud → Users</strong> no Lovable.
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
                          {cliente.nome_restaurante || <span className="text-muted-foreground italic text-sm">sem nome</span>}
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
                        <Button size="sm" variant="ghost" title="Editar nome do restaurante" onClick={() => startEdit(cliente)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Visualizar como este cliente" onClick={() => acessarComoCliente(cliente.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title={cliente.ativo ? 'Desativar acesso' : 'Ativar acesso'} onClick={() => toggleAtivo(cliente)}>
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
