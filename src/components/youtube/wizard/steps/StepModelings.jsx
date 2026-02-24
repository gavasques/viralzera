import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Video, FileText, Lightbulb, Database } from "lucide-react";

export function StepModelings({ focusId, value, onChange }) {
  // Fetch active dossiers for this focus
  const { data: allDossiers = [], isLoading: loadingDossiers } = useQuery({
    queryKey: ['dossiers-wizard', focusId],
    queryFn: async () => {
      const dossiers = await neon.entities.ContentDossier.filter({ is_active: true }, '-created_date', 100);
      return dossiers;
    },
    enabled: !!focusId
  });

  // Fetch modelings for this focus
  const { data: allModelings = [], isLoading: loadingModelings } = useQuery({
    queryKey: ['modelings-wizard', focusId],
    queryFn: () => neon.entities.Modeling.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  // Filter modelings that have active dossiers
  const modelings = React.useMemo(() => {
    const dossierModelingIds = allDossiers.map(d => d.modeling_id);
    return allModelings.filter(m => dossierModelingIds.includes(m.id));
  }, [allModelings, allDossiers]);

  // Fetch video counts
  const { data: videos = [] } = useQuery({
    queryKey: ['modeling-videos-wizard', focusId],
    queryFn: async () => {
      if (!modelings.length) return [];
      const modelingIds = modelings.map(m => m.id);
      return neon.entities.ModelingVideo.filter({ 
        modeling_id: { $in: modelingIds },
        status: 'transcribed'
      });
    },
    enabled: modelings.length > 0
  });

  // Fetch text counts
  const { data: texts = [] } = useQuery({
    queryKey: ['modeling-texts-wizard', focusId],
    queryFn: async () => {
      if (!modelings.length) return [];
      const modelingIds = modelings.map(m => m.id);
      return neon.entities.ModelingText.filter({ 
        modeling_id: { $in: modelingIds }
      });
    },
    enabled: modelings.length > 0
  });

  const selectedModelings = value.selectedModelings || [];

  const toggleModeling = (modelingId) => {
    const newSelected = selectedModelings.includes(modelingId)
      ? selectedModelings.filter(id => id !== modelingId)
      : [...selectedModelings, modelingId];
    
    onChange({ ...value, selectedModelings: newSelected });
  };

  const selectAll = () => {
    onChange({ ...value, selectedModelings: modelings.map(m => m.id) });
  };

  const deselectAll = () => {
    onChange({ ...value, selectedModelings: [] });
  };

  // Calculate stats per modeling
  const getModelingStats = (modelingId) => {
    const videoCount = videos.filter(v => v.modeling_id === modelingId).length;
    const textCount = texts.filter(t => t.modeling_id === modelingId).length;
    const modeling = modelings.find(m => m.id === modelingId);
    const hasCreatorIdea = !!modeling?.creator_idea;
    
    // Estimate tokens (rough: 1 token ≈ 4 chars)
    const videoTokens = videos
      .filter(v => v.modeling_id === modelingId)
      .reduce((acc, v) => acc + (v.transcript?.length || 0) / 4, 0);
    const textTokens = texts
      .filter(t => t.modeling_id === modelingId)
      .reduce((acc, t) => acc + (t.content?.length || 0) / 4, 0);
    const ideaTokens = (modeling?.creator_idea?.length || 0) / 4;
    
    return {
      videoCount,
      textCount,
      hasCreatorIdea,
      estimatedTokens: Math.round(videoTokens + textTokens + ideaTokens)
    };
  };

  // Calculate total selected tokens
  const totalSelectedTokens = selectedModelings.reduce((acc, id) => {
    return acc + getModelingStats(id).estimatedTokens;
  }, 0);

  if (loadingModelings || loadingDossiers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Modelagens de Referência
        </h2>
        <p className="text-sm text-slate-500">
          Selecione modelagens para que a IA aprenda com os padrões de sucesso
        </p>
      </div>

      {modelings.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-8 text-center">
          <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Nenhum dossiê ativo encontrado</p>
          <p className="text-sm text-slate-400 mt-1">
            Crie modelagens, gere dossiês e ative-os para usar como referência
          </p>
        </div>
      ) : (
        <>
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {selectedModelings.length} de {modelings.length} selecionadas
              </span>
              {totalSelectedTokens > 0 && (
                <Badge variant="secondary" className="text-xs">
                  ~{totalSelectedTokens.toLocaleString()} tokens
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={selectAll}
                className="text-xs text-indigo-600 hover:underline"
              >
                Selecionar todas
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={deselectAll}
                className="text-xs text-slate-500 hover:underline"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Modelings list */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {modelings.map((modeling) => {
              const stats = getModelingStats(modeling.id);
              const isSelected = selectedModelings.includes(modeling.id);

              return (
                <div
                  key={modeling.id}
                  onClick={() => toggleModeling(modeling.id)}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {modeling.title}
                      </p>
                      {modeling.description && (
                        <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                          {modeling.description}
                        </p>
                      )}
                      
                      {/* Stats badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {stats.videoCount > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Video className="w-3 h-3" />
                            {stats.videoCount} vídeo{stats.videoCount > 1 ? 's' : ''} transcrito{stats.videoCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {stats.textCount > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <FileText className="w-3 h-3" />
                            {stats.textCount} texto{stats.textCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {stats.hasCreatorIdea && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lightbulb className="w-3 h-3" />
                            Notas
                          </Badge>
                        )}
                        {stats.estimatedTokens > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            ~{stats.estimatedTokens.toLocaleString()} tokens
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Token warning */}
          {totalSelectedTokens > 50000 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                ⚠️ Você selecionou muitos tokens ({totalSelectedTokens.toLocaleString()}). 
                Considere selecionar menos modelagens para evitar erros de limite.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}