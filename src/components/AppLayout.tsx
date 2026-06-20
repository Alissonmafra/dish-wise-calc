import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Eye, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isAdmin, viewingAsUserId, setViewingAs } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b bg-card px-4 shrink-0 gap-2">
            <SidebarTrigger className="mr-2" />
            <span className="text-sm font-medium text-muted-foreground flex-1">
              {profile?.nome_restaurante || 'Sistema de Precificação'}
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => navigate('/admin')}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </header>

          {/* Impersonation banner */}
          {viewingAsUserId && (
            <div className="flex items-center gap-3 bg-yellow-50 border-b border-yellow-200 px-4 py-1.5 text-xs text-yellow-800">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">Você está visualizando os dados de um cliente.</span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs py-0"
                onClick={() => { setViewingAs(null); navigate('/admin'); }}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Voltar ao Admin
              </Button>
            </div>
          )}

          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
