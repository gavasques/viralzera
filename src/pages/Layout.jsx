import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSelectedFocus, FOCUS_QUERY_KEYS } from '@/components/hooks/useSelectedFocus';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
        LayoutDashboard, 
        PlusCircle, 
        Menu, 
        Rocket,
        TrendingUp,
        Users,
        User,
        ChevronDown,
        ChevronLeft,
        ChevronRight,
        Check,
        Settings,
        Layers,
        FolderTree,
        Library,
        // Twitter,
        LogOut,
        Package,
        Sparkles,
        Dna,
        Calendar,
        FileText,
        ScrollText,
        Globe
        } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CanvasProvider } from "@/components/canvas/CanvasProvider";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  
  // State for collapsible sidebar groups
  const [expandedGroups, setExpandedGroups] = React.useState({
    'Principal': true,
    'Criação': true,
    'Conteúdo': true,
    'DNA': true
  });

  const toggleGroup = (label) => {
    if (!label) return;
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const { selectedFocusId, setFocus, currentFocus, allFocuses } = useSelectedFocus();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Landing Page Logic
  const isLandingPage = location.pathname === createPageUrl('Landing');

  if (isLandingPage) {
    return (
      <CanvasProvider>
        {children}
      </CanvasProvider>
    );
  }

  // Auth Guard - Redirect to Landing if not authenticated
  React.useEffect(() => {
    if (!isLoadingUser && !user) {
      navigate(createPageUrl('Landing'));
    }
  }, [isLoadingUser, user, navigate]);

  if (!isLoadingUser && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Loading state while checking auth
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const widePages = [
    'PostManagement',
    'Audiences',
    'Personas',
    'Products',
    'MaterialBank',
    'DNACommunication',
    'Trends',
    'PostTypes',
    'ThemeMatrix',

    'TitanosRouter',
    'Prompts',
    'Canvas',
    'Dashboard',
    'ThemeMatrix',
    'ModelManagement',
    'AgentSettings',
    'UsageAnalytics',
    'MultiChatAnalytics',
    'OpenRouterModels',
    'Modelagem',
    'ModelagemDetalhe'
  ];
  const isWidePage = widePages.some(page => location.pathname === createPageUrl(page));

  const navGroups = [
          {
            label: 'Principal',
            items: [
              { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
              { name: 'Gestão de Postagens', icon: Calendar, page: 'PostManagement' },
            ]
          },
          {
            label: 'Criação',
            items: [
              { name: 'Multi Chat', icon: Sparkles, page: 'TitanosRouter' },
              { name: 'Canvas', icon: FileText, page: 'Canvas' },
            ]
          },
          {
            label: 'Conteúdo',
            items: [
              { name: 'Banco de Listas', icon: Library, page: 'MaterialBank' },
              { name: 'Tendências', icon: TrendingUp, page: 'Trends' },
              { name: 'Matriz de Temas', icon: FolderTree, page: 'ThemeMatrix' },
              { name: 'Prompts', icon: ScrollText, page: 'Prompts' },
              { name: 'Tipos de Postagem', icon: Layers, page: 'PostTypes' },
              { name: 'Modelagem', icon: Layers, page: 'Modelagem' },
            ]
          },
          {
            label: 'DNA',
            items: [
              { name: 'Público-Alvo', icon: Users, page: 'Audiences' },
              { name: 'Minha Persona', icon: User, page: 'Personas' },
              { name: 'Produtos', icon: Package, page: 'Products' },
              { name: 'DNA Comunicação', icon: Dna, page: 'DNACommunication' },
            ]
          },
        ];

        if (user?.role === 'admin') {
          navGroups.push({
            label: 'ADMIN ZONE',
            isAdmin: true,
            items: [
              { name: 'Gestão de Modelos', icon: Rocket, page: 'ModelManagement' },
              { name: 'Configurações de Agentes', icon: Settings, page: 'AgentSettings' },
              { name: 'Análise de Consumo', icon: LayoutDashboard, page: 'UsageAnalytics' },
              { name: 'Análise Multi Chat', icon: LayoutDashboard, page: 'MultiChatAnalytics' },
              { name: 'Modelos OpenRouter', icon: Globe, page: 'OpenRouterModels' }
            ]
          });
        }

  const SidebarContent = ({ collapsed = false, onToggle }) => (
    <div className={`flex flex-col h-full border-r border-slate-100 relative transition-colors duration-300 ${collapsed ? 'bg-slate-50' : 'bg-white'}`}>
      {/* Collapse Toggle Button */}
      {onToggle && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-20 z-20 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      )}
      
      {/* Brand */}
      <div className={`p-6 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex justify-center mb-8">
          <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69405b4dfc2b80b38d51b395/689d504d8_LogoViralzera.png" 
              alt="Viralzera" 
              className={`transition-all duration-300 w-auto ${collapsed ? 'h-8' : 'h-24'}`}
          />
        </div>

        {/* Focus Selector - Minimalist */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={`w-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 h-10 shadow-sm ${collapsed ? 'justify-center px-2' : 'justify-between'}`}
            >
              <div className={`flex items-center gap-2 ${collapsed ? '' : 'truncate'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0"></div>
                {!collapsed && (
                  <span className="truncate flex-1 text-left font-medium">
                    {currentFocus?.title || 'Selecione um Foco'}
                  </span>
                )}
              </div>
              {!collapsed && <ChevronDown className="w-4 h-4 opacity-40" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[220px]" align="start">
            <DropdownMenuLabel className="text-xs text-slate-400 font-normal">Meus Focos</DropdownMenuLabel>
            {allFocuses.map(focus => (
              <DropdownMenuItem 
                key={focus.id}
                onClick={() => setFocus(focus.id)}
                className="justify-between cursor-pointer"
              >
                <span className="truncate">{focus.title}</span>
                {selectedFocusId === focus.id && <Check className="w-3 h-3 text-pink-600" />}
                </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {selectedFocusId && (
                <DropdownMenuItem 
                className="cursor-pointer text-slate-600"
                onClick={() => navigate(`${createPageUrl('CreateFocus')}?id=${selectedFocusId}`)}
                >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Foco
                </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                className="text-pink-600 cursor-pointer focus:text-pink-700"
              onClick={() => navigate(createPageUrl('CreateFocus'))}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Foco
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Navigation */}
      <nav className={`flex-1 space-y-6 overflow-y-auto ${collapsed ? 'px-2' : 'px-4'}`}>
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.label && !collapsed && (
                <button 
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 text-[11px] font-bold uppercase tracking-wider mb-2 mt-4 transition-colors group cursor-pointer ${
                    group.isAdmin 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>{group.label}</span>
                  {expandedGroups[group.label] ? (
                    <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )}
            
            {/* Show items if: no label (Dashboard), sidebar collapsed, or group expanded */}
            {(!group.label || collapsed || expandedGroups[group.label]) && (
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === createPageUrl(item.page);
                  return (
                    <Link key={item.page} to={createPageUrl(item.page)} title={collapsed ? item.name : undefined}>
                      <div
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                          ${collapsed ? 'justify-center' : ''}
                          ${isActive 
                            ? group.isAdmin ? 'bg-red-50 text-red-700' : 'bg-pink-50 text-pink-700' 
                            : group.isAdmin ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                          `}
                          >
                          <item.icon className={`w-4 h-4 shrink-0 ${isActive ? (group.isAdmin ? 'text-red-600' : 'text-pink-600') : (group.isAdmin ? 'text-red-400' : 'text-slate-400')}`} />
                        {!collapsed && item.name}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t border-slate-100 ${collapsed ? 'px-2' : ''}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={`flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group ${collapsed ? 'justify-center px-0' : ''}`}>
              <Avatar className="h-9 w-9 border border-slate-200 shrink-0">
                <AvatarFallback className="bg-pink-50 text-pink-600 text-xs font-bold">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate text-slate-700 group-hover:text-slate-900 transition-colors">
                      {user?.full_name || user?.email || 'Usuário'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">Configurações</p>
                  </div>
                  <Settings className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(createPageUrl('UserSettings'))}>
              <User className="mr-2 h-4 w-4" />
              Perfil e Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <CanvasProvider>
    <div className="min-h-screen bg-slate-50/50 flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <div className={`hidden md:block fixed h-full z-10 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 w-full z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69405b4dfc2b80b38d51b395/689d504d8_LogoViralzera.png" 
              alt="Viralzera" 
              className="h-8 w-auto"
          />
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-600">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-slate-100">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className={`flex-1 p-6 md:p-12 pt-24 md:pt-10 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {selectedFocusId || allFocuses.length === 0 ? (
          <div className={isWidePage ? "w-full" : "max-w-7xl mx-auto"}>
            {children}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <div className="bg-pink-50 p-4 rounded-full inline-flex">
                  <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69405b4dfc2b80b38d51b395/689d504d8_LogoViralzera.png" 
                      alt="Viralzera" 
                      className="w-12 h-auto"
                  />
              </div>
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bem-vindo ao Viralzera</h2>
              <p className="text-slate-500">
                Sua central de estratégia de conteúdo. Selecione um foco no menu ou crie um novo para começar.
              </p>
            </div>
            <Button 
              onClick={() => navigate(createPageUrl('CreateFocus'))}
              className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200 px-8"
              size="lg"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar Novo Foco
            </Button>
          </div>
        )}
      </main>
    </div>
    </CanvasProvider>
  );
}