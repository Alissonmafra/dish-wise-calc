import {
  LayoutDashboard, DollarSign, Package, BookOpen, Calculator, Layers, Receipt, ClipboardList, ChefHat, TrendingUp,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
  { title: 'Insumos', url: '/insumos', icon: Package },
  { title: 'Itens do Cardápio', url: '/itens-cardapio', icon: ClipboardList },
  { title: 'Itens Manipulados', url: '/itens-manipulados', icon: ChefHat },
  { title: 'Ficha Técnica Manipulação', url: '/ficha-manipulacao', icon: BookOpen },
  { title: 'Ficha Técnica Produto', url: '/ficha-produto', icon: BookOpen },
  { title: 'Lucro Atual', url: '/lucro-atual', icon: TrendingUp },
  { title: 'Preço de Venda (PV)', url: '/precificacao', icon: Calculator },
  { title: 'Combos', url: '/combos', icon: Layers },
  { title: 'Fechamento', url: '/fechamento', icon: Receipt },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calculator className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground">PrecifiQ</h2>
              <p className="text-[10px] text-sidebar-foreground/60">Gestão & Precificação</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Calculator className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
