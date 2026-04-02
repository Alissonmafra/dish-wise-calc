import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/insumos" element={<Insumos />} />
              <Route path="/itens-cardapio" element={<ItensCardapio />} />
              <Route path="/itens-manipulados" element={<ItensManipulados />} />
              <Route path="/ficha-manipulacao" element={<FichaManipulacao />} />
              <Route path="/ficha-produto" element={<FichaProduto />} />
              <Route path="/fichas-tecnicas" element={<FichasTecnicas />} />
              <Route path="/precificacao" element={<Precificacao />} />
              <Route path="/combos" element={<Combos />} />
              <Route path="/lucro-atual" element={<LucroAtual />} />
              <Route path="/fechamento" element={<Fechamento />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
