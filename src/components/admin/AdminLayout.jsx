import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Cpu,
  ArrowLeft,
  Shield
} from 'lucide-react';

const ADMIN_MENU = [
  { 
    name: 'Gestão de Modelos', 
    page: 'ModelManagement', 
    icon: Bot,
    description: 'Configure modelos disponíveis'
  },
  { 
    name: 'Configurações de Agentes', 
    page: 'AgentSettings', 
    icon: Settings,
    description: 'Prompts e configurações'
  },
  { 
    name: 'Análise de Consumo', 
    page: 'UsageAnalytics', 
    icon: BarChart3,
    description: 'Tokens e custos por usuário'
  },
  { 
    name: 'Multi Chat Analytics', 
    page: 'MultiChatAnalytics', 
    icon: MessageSquare,
    description: 'Relatório de conversas'
  },
  { 
    name: 'Catálogo OpenRouter', 
    page: 'OpenRouterModels', 
    icon: Cpu,
    description: 'Explorador de modelos'
  },
];

/**
 * Layout unificado para área administrativa
 * Fornece navegação consistente e visual padronizado
 */
export default function AdminLayout({ children, currentPage }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Admin Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao App
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Admin Zone</h1>
                  <p className="text-xs text-slate-500">Gerenciamento do Sistema</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Área Restrita
            </Badge>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {ADMIN_MENU.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`gap-2 whitespace-nowrap ${
                      isActive 
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}