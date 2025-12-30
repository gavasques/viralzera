import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Clock, FileText, Twitter, MoreVertical, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PageHeader from "@/components/common/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PageSkeleton as LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

export default function TwitterProjects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['twitterProjects'],
    queryFn: () => base44.entities.TwitterProject.list('-updated_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TwitterProject.delete(id),
    onSuccess: () => {
      toast.success("Projeto excluído!");
      queryClient.invalidateQueries({ queryKey: ['twitterProjects'] });
    }
  });

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <PageHeader 
        title="Meus Posts Twitter/X" 
        subtitle="Gerencie seus carrosséis e postagens"
        icon={Twitter}
        actions={
          <Button 
            onClick={() => navigate(createPageUrl('TwitterGenerator'))}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Post
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Buscar projetos..." 
          className="pl-9 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="group hover:shadow-md transition-all cursor-pointer border-slate-200 hover:border-indigo-200"
              onClick={() => navigate(`${createPageUrl('TwitterGenerator')}?id=${project.id}`)}
            >
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={e => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${createPageUrl('TwitterGenerator')}?id=${project.id}`);
                      }}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={e => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O post "{project.title}" será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(project.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2" title={project.title}>
                  {project.title || "Sem título"}
                </h3>

                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {project.slides?.length || 0} páginas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {project.updated_date ? format(new Date(project.updated_date), "d MMM", { locale: ptBR }) : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Twitter}
          title="Nenhum post encontrado"
          description={searchTerm ? "Tente buscar com outro termo" : "Comece criando seu primeiro carrossel estilo Twitter"}
          actionLabel="Criar Novo Post"
          onAction={() => navigate(createPageUrl('TwitterGenerator'))}
        />
      )}
    </div>
  );
}