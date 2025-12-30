import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Users, FileText, Layers, FolderTree, Package, Library,
  Dna, ScrollText, Sparkles, TrendingUp, Calendar, Settings, Menu, X,
  ChevronRight, Target, Video, MessageSquare, Bot
} from 'lucide-react';
import { useSelectedFocus } from '@/components/hooks/useSelectedFocus';

const menuItems = [
  { section: 'Principal', items: [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  ]},
  { section: 'Criação', items: [
    { name: 'Gerador de Scripts', icon: Sparkles, page: 'ScriptGenerator' },
    { name: 'Multi Chat', icon: Bot, page: 'TitanosRouter' },
    { name: 'Canvas', icon: ScrollText, page: 'Canvas' },
  ]},
  { section: 'Estratégia', items: [
    { name: 'Focos', icon: Target, page: 'FocusManager' },
    { name: 'Públicos-Alvo', icon: Users, page: 'Audiences' },
    { name: 'Personas', icon: FileText, page: 'Personas' },
    { name: 'Produtos', icon: Package, page: 'Products' },
  ]},
  { section: 'Conteúdo', items: [
    { name: 'Tipos de Postagem', icon: Layers, page: 'PostTypes' },
    { name: 'Temas', icon: FolderTree, page: 'ThemeMatrix' },
    { name: 'Materiais', icon: Library, page: 'MaterialBank' },
    { name: 'Tendências', icon: TrendingUp, page: 'Trends' },
  ]},
  { section: 'DNA', items: [
    { name: 'DNA de Comunicação', icon: Dna, page: 'DNACommunication' },
    { name: 'Modelagem', icon: Video, page: 'ContentModeling' },
  ]},
  { section: 'Gestão', items: [
    { name: 'Postagens', icon: Calendar, page: 'PostManagement' },
    { name: 'Configurações', icon: Settings, page: 'Settings' },
  ]},
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { selectedFocusId, setFocus, currentFocus, allFocuses } = useSelectedFocus();

  // Pages that don't use the sidebar layout
  const fullWidthPages = ['Landing', 'Login'];
  const isFullWidth = fullWidthPages.includes(currentPageName);

  if (isFullWidth) {
    return <>{children}</>;
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-slate-900">ContentAI</span>}
        </Link>
      </div>

      {/* Focus Selector */}
      {sidebarOpen && (
        <div className="p-4 border-b border-slate-200">
          <label className="text-xs text-slate-500 mb-2 block">Foco Ativo</label>
          <Select value={selectedFocusId || ''} onValueChange={setFocus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um foco" />
            </SelectTrigger>
            <SelectContent>
              {allFocuses.map((focus) => (
                <SelectItem key={focus.id} value={focus.id}>
                  {focus.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-6">
          {menuItems.map((section) => (
            <div key={section.section}>
              {sidebarOpen && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-pink-50 text-pink-600' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                      {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <NavContent />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-slate-200 flex items-center justify-center hover:bg-slate-50"
        >
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6 text-slate-600" />
      </button>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white z-50">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <NavContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}