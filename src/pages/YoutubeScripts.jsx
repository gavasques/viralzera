import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Youtube, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import YoutubeScriptCard from "@/components/youtube/YoutubeScriptCard";

export default function YoutubeScripts() {
  const navigate = useNavigate();
  const { selectedFocusId } = useSelectedFocus();

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['youtube-scripts', selectedFocusId],
    queryFn: () => base44.entities.YoutubeScript.filter({ focus_id: selectedFocusId }, '-created_date', 100),
    enabled: !!selectedFocusId,
  });

  const handleNew = () => {
    navigate(createPageUrl('YoutubeScriptDetail'));
  };

  const handleCardClick = (script) => {
    navigate(createPageUrl(`YoutubeScriptDetail?id=${script.id}`));
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Roteiros para YouTube" 
        subtitle="Crie e gerencie seus roteiros de vídeos"
        icon={Youtube}
        actions={
          <Button 
            onClick={handleNew} 
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-200"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Roteiro
          </Button>
        }
      />

      {scripts.length === 0 ? (
        <EmptyState 
          icon={Youtube}
          title="Nenhum roteiro criado ainda"
          description="Comece criando seu primeiro roteiro de vídeo para o YouTube"
          actionLabel="Criar Primeiro Roteiro"
          onAction={handleNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map((script) => (
            <YoutubeScriptCard 
              key={script.id} 
              script={script} 
              onClick={() => handleCardClick(script)}
            />
          ))}
        </div>
      )}
    </div>
  );
}