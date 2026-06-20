import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import Financeiro from "./pages/Financeiro";
import Insumos from "./pages/Insumos";
import FichasTecnicas from "./pages/FichasTecnicas";
import FichaManipulacao from "./pages/FichaManipulacao";
import FichaProduto from "./pages/FichaProduto";
import Precificacao from "./pages/Precificacao";
import Combos from "./pages/Combos";
import Fechamento from "./pages/Fechamento";
import ItensCardapio from "./pages/ItensCardapio";
import ItensManipulados from "./pages/ItensManipulados";
import LucroAtual from "./pages/LucroAtual";
import DREAnual from "./pages/DREAnual";
import PainelMetas from "./pages/PainelMetas";
import MiniDRE from "./pages/MiniDRE";
import Diagnostico from "./pages/Diagnostico";
import VendasDoDia from "./pages/VendasDoDia";
import Ofertas from "./pages/Ofertas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile && !profile.ativo) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-xl font-bold">Acesso suspenso</h2>
        <p className="text-muted-foreground text-sm">Sua conta está inativa. Entre em contato com o administrador.</p>
      </div>
    </div>
  );
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (!loading && !user) return <Routes><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;

  return (
    <AppProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
          <Route path="/insumos" element={<ProtectedRoute><Insumos /></ProtectedRoute>} />
          <Route path="/itens-cardapio" element={<ProtectedRoute><ItensCardapio /></ProtectedRoute>} />
          <Route path="/itens-manipulados" element={<ProtectedRoute><ItensManipulados /></ProtectedRoute>} />
          <Route path="/ficha-manipulacao" element={<ProtectedRoute><FichaManipulacao /></ProtectedRoute>} />
          <Route path="/ficha-produto" element={<ProtectedRoute><FichaProduto /></ProtectedRoute>} />
          <Route path="/fichas-tecnicas" element={<ProtectedRoute><FichasTecnicas /></ProtectedRoute>} />
          <Route path="/precificacao" element={<ProtectedRoute><Precificacao /></ProtectedRoute>} />
          <Route path="/combos" element={<ProtectedRoute><Combos /></ProtectedRoute>} />
          <Route path="/vendas" element={<ProtectedRoute><VendasDoDia /></ProtectedRoute>} />
          <Route path="/ofertas" element={<ProtectedRoute><Ofertas /></ProtectedRoute>} />
          <Route path="/lucro-atual" element={<ProtectedRoute><LucroAtual /></ProtectedRoute>} />
          <Route path="/fechamento" element={<ProtectedRoute><Fechamento /></ProtectedRoute>} />
          <Route path="/dre" element={<ProtectedRoute><DREAnual /></ProtectedRoute>} />
          <Route path="/painel-metas" element={<ProtectedRoute><PainelMetas /></ProtectedRoute>} />
          <Route path="/mini-dre" element={<ProtectedRoute><MiniDRE /></ProtectedRoute>} />
          <Route path="/diagnostico" element={<ProtectedRoute><Diagnostico /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function LoginRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default App;
