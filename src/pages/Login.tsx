import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogIn, ChefHat, Eye, EyeOff, UserPlus } from 'lucide-react';

function PasswordInput({
  id, value, onChange, disabled, placeholder, autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Login() {
  const { signIn } = useAuth();

  // Login state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  // Signup state
  const [sNome, setSNome]       = useState('');
  const [sEmail, setSEmail]     = useState('');
  const [sSenha, setSSenha]     = useState('');
  const [sSenha2, setSSenha2]   = useState('');
  const [sLoading, setSLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!sNome || !sEmail || !sSenha) { toast.error('Preencha todos os campos'); return; }
    if (sSenha.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    if (sSenha !== sSenha2) { toast.error('As senhas não coincidem'); return; }

    setSLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: sEmail,
        password: sSenha,
        options: {
          emailRedirectTo: window.location.origin,
          data: { nome_restaurante: sNome, role: 'cliente' },
        },
      });
      if (error) throw error;

      // Marcar como pendente de aprovação (RLS own_profile permite)
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ ativo: false, nome_restaurante: sNome })
          .eq('id', data.user.id);
      }

      await supabase.auth.signOut();

      toast.success('Cadastro enviado! Aguarde a aprovação do administrador para acessar.');
      setSNome(''); setSEmail(''); setSSenha(''); setSSenha2('');
    } catch (err: any) {
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(err.message || 'Erro ao cadastrar');
      }
    } finally {
      setSLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <ChefHat className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Umami Precificação</h1>
          <p className="text-sm text-muted-foreground">Sistema de precificação para restaurantes</p>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultValue="entrar" className="w-full">
            <CardHeader className="pb-3">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="entrar">
              <CardHeader className="pt-0 pb-3">
                <CardTitle className="text-lg">Entrar</CardTitle>
                <CardDescription>Acesse com seu email e senha</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">Senha</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={setPassword}
                      disabled={loading}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : (<><LogIn className="h-4 w-4 mr-2" />Entrar</>)}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="cadastrar">
              <CardHeader className="pt-0 pb-3">
                <CardTitle className="text-lg">Criar conta</CardTitle>
                <CardDescription>Seu cadastro precisará ser aprovado pelo administrador.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="s-nome">Nome do restaurante</Label>
                    <Input
                      id="s-nome"
                      value={sNome}
                      onChange={e => setSNome(e.target.value)}
                      placeholder="Ex: Restaurante do João"
                      disabled={sLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-email">Email</Label>
                    <Input
                      id="s-email"
                      type="email"
                      autoComplete="email"
                      value={sEmail}
                      onChange={e => setSEmail(e.target.value)}
                      placeholder="seu@email.com"
                      disabled={sLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-senha">Senha</Label>
                    <PasswordInput
                      id="s-senha"
                      value={sSenha}
                      onChange={setSSenha}
                      disabled={sLoading}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-senha2">Confirmar senha</Label>
                    <PasswordInput
                      id="s-senha2"
                      value={sSenha2}
                      onChange={setSSenha2}
                      disabled={sLoading}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={sLoading}>
                    {sLoading ? 'Enviando...' : (<><UserPlus className="h-4 w-4 mr-2" />Cadastrar</>)}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
