import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSelectedFocus } from '@/components/hooks/useSelectedFocus.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, FileText, Layers, TrendingUp, Calendar, Sparkles, 
  FolderTree, Package, Library, Dna, ScrollText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const { selectedFocusId, currentFocus } = useSelectedFocus();

  const { data: audiences = [] } = useQuery({
    queryKey: ['audiences', selectedFocusId],
    queryFn: () => base44.entities.Audience.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['personas', selectedFocusId],
    queryFn: () => base44.entities.Persona.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const { data: postTypes = [] } = useQuery({
    queryKey: ['postTypes', selectedFocusId],
    queryFn: () => base44.entities.PostType.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['themes', selectedFocusId],
    queryFn: () => base44.entities.Theme.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedFocusId],
    queryFn: () => base44.entities.Product.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', selectedFocusId],
    queryFn: () => base44.entities.Material.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const { data: dnaProfiles = [] } = useQuery({
    queryKey: ['dnaProfiles', selectedFocusId],
    queryFn: () => base44.entities.DNAProfile.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const { data: canvases = [] } = useQuery({
    queryKey: ['canvases'],
    queryFn: () => base44.entities.Canvas.list('-created_date', 100),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts', selectedFocusId],
    queryFn: () => base44.entities.Post.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId,
  });

  const stats = [
    { title: 'Públicos-Alvo', value: audiences.length, icon: Users, color: 'bg-blue-500', link: 'Audiences' },
    { title: 'Personas', value: personas.length, icon: FileText, color: 'bg-purple-500', link: 'Personas' },
    { title: 'Tipos de Postagem', value: postTypes.length, icon: Layers, color: 'bg-green-500', link: 'PostTypes' },
    { title: 'Temas', value: themes.length, icon: FolderTree, color: 'bg-amber-500', link: 'ThemeMatrix' },
    { title: 'Produtos', value: products.length, icon: Package, color: 'bg-red-500', link: 'Products' },
    { title: 'Materiais', value: materials.length, icon: Library, color: 'bg-indigo-500', link: 'MaterialBank' },
    { title: 'DNAs', value: dnaProfiles.length, icon: Dna, color: 'bg-pink-500', link: 'DNACommunication' },
    { title: 'Canvas', value: canvases.length, icon: ScrollText, color: 'bg-teal-500', link: 'Canvas' },
  ];

  const quickActions = [
    { title: 'Gerar Script', description: 'Crie roteiros magnéticos', icon: Sparkles, link: 'ScriptGenerator', color: 'text-pink-600' },
    { title: 'Multi Chat', description: 'Compare modelos de IA', icon: Sparkles, link: 'TitanosRouter', color: 'text-purple-600' },
    { title: 'Tendências', description: 'Pesquise tendências', icon: TrendingUp, link: 'Trends', color: 'text-blue-600' },
    { title: 'Postagens', description: 'Gerencie seu conteúdo', icon: Calendar, link: 'PostManagement', color: 'text-green-600' },
  ];

  if (!selectedFocusId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-slate-400 text-lg">
          Selecione um Foco no menu lateral para ver o Dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Visão geral do foco: <span className="font-medium text-pink-600">{currentFocus?.title}</span>
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.link} to={createPageUrl(action.link)}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors`}>
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-xs">{action.description}</CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Resumo do Foco</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.title} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{stat.title}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                      <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      {posts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Postagens Recentes</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{post.title || 'Sem título'}</p>
                      <p className="text-xs text-slate-500">{post.status || 'Rascunho'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}