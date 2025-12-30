import React from 'react';
import { useFocusData } from "@/components/hooks/useFocusData";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, 
  Users, 
  User, 
  Package, 
  Layers, 
  FolderTree, 
  ArrowRight,
  Zap,
  LayoutTemplate,
  CheckCircle2,
  Circle,
  MessageSquareMore,
  FileText,
  TrendingUp,
  Pencil
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/common/PageHeader";

export default function Dashboard() {
  const { currentFocus, isLoading: isLoadingFocus } = useSelectedFocus();
  
  // Fetch counts and data
  const { data: audiences } = useFocusData('Audience', 'dashboard_audiences');
  const { data: personas } = useFocusData('Persona', 'dashboard_personas');
  const { data: products } = useFocusData('Product', 'dashboard_products');
  const { data: postTypes } = useFocusData('PostType', 'dashboard_post_types');
  const { data: themes } = useFocusData('Theme', 'dashboard_themes');
  
  const stats = [
    { label: "Públicos", value: audiences?.length || 0, icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Personas", value: personas?.length || 0, icon: User, color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
    { label: "Produtos", value: products?.length || 0, icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Formatos", value: postTypes?.length || 0, icon: Layers, color: "text-red-500", bg: "bg-red-50" },
    { label: "Temas", value: themes?.length || 0, icon: FolderTree, color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  // Calculate strategy completeness
  const completenessItems = [
    { label: "Definir Público-Alvo", completed: audiences?.length > 0, link: "Audiences" },
    { label: "Criar Persona", completed: personas?.length > 0, link: "Personas" },
    { label: "Cadastrar Produtos", completed: products?.length > 0, link: "Products" },
    { label: "Mapear Temas", completed: themes?.length > 0, link: "ThemeMatrix" },
    { label: "Configurar Tipos de Post", completed: postTypes?.length > 0, link: "PostTypes" },
  ];

  const completedCount = completenessItems.filter(i => i.completed).length;
  const progress = (completedCount / completenessItems.length) * 100;

  if (isLoadingFocus) {
    return <div className="p-8 space-y-6">
      <Skeleton className="h-12 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8 w-full pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">{currentFocus?.title || 'Visitante'}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Aqui está o panorama da sua estratégia para {currentFocus?.platform || 'suas redes sociais'}.
          </p>
        </div>
        <Link to={createPageUrl('CreateFocus') + `?id=${currentFocus?.id}`}>
          <Button variant="outline" size="sm">Configurar Foco</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900 block">{stat.value}</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Actions Column */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Quick Access Section */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-pink-500" />
              Acesso Rápido
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Multi Chat */}
              <Link to={createPageUrl('TitanosRouter')}>
                <Card className="h-full hover:border-pink-200 hover:shadow-md transition-all group cursor-pointer border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-violet-50 rounded-xl group-hover:bg-violet-100 transition-colors">
                        <MessageSquareMore className="w-6 h-6 text-violet-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-pink-700 transition-colors">Multi Chat</h3>
                      <p className="text-sm text-slate-500 mt-1">Converse com múltiplos modelos de IA simultaneamente.</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Script Generator */}
              <Link to={createPageUrl('ScriptGenerator')}>
                <Card className="h-full hover:border-pink-200 hover:shadow-md transition-all group cursor-pointer border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
                        <Sparkles className="w-6 h-6 text-pink-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-pink-700 transition-colors">Gerador de Scripts</h3>
                      <p className="text-sm text-slate-500 mt-1">Crie roteiros magnéticos para vídeos curtos e reels.</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Canvas */}
              <Link to={createPageUrl('Canvas')}>
                <Card className="h-full hover:border-pink-200 hover:shadow-md transition-all group cursor-pointer border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-pink-700 transition-colors">Canvas</h3>
                      <p className="text-sm text-slate-500 mt-1">Seus rascunhos e conteúdos salvos em um só lugar.</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Theme Matrix */}
              <Link to={createPageUrl('ThemeMatrix')}>
                <Card className="h-full hover:border-pink-200 hover:shadow-md transition-all group cursor-pointer border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                        <FolderTree className="w-6 h-6 text-emerald-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-pink-700 transition-colors">Matriz de Temas</h3>
                      <p className="text-sm text-slate-500 mt-1">Organize seus temas e pilares de conteúdo.</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Trends */}
              <Link to={createPageUrl('Trends')}>
                <Card className="h-full hover:border-pink-200 hover:shadow-md transition-all group cursor-pointer border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-pink-700 transition-colors">Tendências</h3>
                      <p className="text-sm text-slate-500 mt-1">Descubra o que está em alta no momento.</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* DNA Communication */}
              <Link to={createPageUrl('DNACommunication')}>
                 <Card className="h-full hover:border-pink-200 hover:shadow-md transition-all group cursor-pointer border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                        <Users className="w-6 h-6 text-rose-600" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-pink-700 transition-colors">DNA de Comunicação</h3>
                      <p className="text-sm text-slate-500 mt-1">Defina e analise seu estilo de comunicação.</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

            </div>
          </section>

        </div>

        {/* Sidebar / Strategy Status */}
        <div className="xl:col-span-1">
          <Card className="border-slate-200 bg-white h-full sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-slate-900">Status da Estratégia</CardTitle>
              <CardDescription>Complete os passos para maximizar os resultados da IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" indicatorClassName="bg-pink-600" />
              </div>

              <div className="space-y-4">
                {completenessItems.map((item, idx) => (
                  <Link key={idx} to={createPageUrl(item.link)} className="block">
                    <div className="flex items-center gap-3 group">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-pink-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-pink-400 transition-colors" />
                      )}
                      <span className={`text-sm ${item.completed ? 'text-slate-700 line-through decoration-slate-300' : 'text-slate-600 font-medium group-hover:text-pink-600 transition-colors'}`}>
                        {item.label}
                      </span>
                      {!item.completed && (
                        <ArrowRight className="w-3 h-3 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {!currentFocus ? (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                  <p className="text-sm text-slate-600 mb-3">Nenhum foco selecionado</p>
                  <Link to={createPageUrl('CreateFocus')}>
                    <Button size="sm" className="w-full bg-pink-600 hover:bg-indigo-700">Criar Foco</Button>
                  </Link>
                </div>
              ) : (
                 progress === 100 && (
                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-100 text-center">
                    <p className="text-sm font-medium text-pink-900 mb-1">🎉 Estratégia Completa!</p>
                    <p className="text-xs text-pink-700">Sua IA tem tudo o que precisa para gerar conteúdo incrível.</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}