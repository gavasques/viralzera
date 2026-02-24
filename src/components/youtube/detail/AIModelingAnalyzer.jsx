import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Library, Video, FileText, Lightbulb, ArrowLeft, Sparkles } from "lucide-react";

export default function AIModelingAnalyzer({ modelingIds, onAnalyze, onCancel }) {
  const [selectedIds, setSelectedIds] = useState(modelingIds || []);

  // Fetch modelings
  const { data: modelings = [], isLoading: loadingModelings } = useQuery({
    queryKey: ['modelings-for-analysis', modelingIds],
    queryFn: async () => {
      if (!modelingIds?.length) return [];
      return neon.entities.Modeling.filter({ id: { $in: modelingIds } });
    },
    enabled: modelingIds?.length > 0
  });

  // Fetch videos and texts for selected modelings
  const { data: videos = [] } = useQuery({
    queryKey: ['modeling-videos', selectedIds],
    queryFn: async () => {
      if (!selectedIds?.length) return [];
      return neon.entities.ModelingVideo.filter({ modeling_id: { $in: selectedIds } });
    },
    enabled: selectedIds?.length > 0
  });

  const { data: texts = [] } = useQuery({
    queryKey: ['modeling-texts', selectedIds],
    queryFn: async () => {
      if (!selectedIds?.length) return [];
      return neon.entities.ModelingText.filter({ modeling_id: { $in: selectedIds } });
    },
    enabled: selectedIds?.length > 0
  });

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleAnalyze = () => {
    // Build modeling content string
    const contentParts = [];

    // Add creator ideas
    const selectedModelings = modelings.filter(m => selectedIds.includes(m.id));
    selectedModelings.forEach(m => {
      if (m.creator_idea) {
        contentParts.push(`### Notas do Criador (${m.title}):\n${m.creator_idea}`);
      }
    });

    // Add video transcripts
    const selectedVideos = videos.filter(v => selectedIds.includes(v.modeling_id));
    selectedVideos.forEach(v => {
      if (v.transcript) {
        contentParts.push(`### Transcrição de Vídeo (${v.title}):\n${v.transcript}`);
      }
    });

    // Add text contents
    const selectedTexts = texts.filter(t => selectedIds.includes(t.modeling_id));
    selectedTexts.forEach(t => {
      if (t.content) {
        contentParts.push(`### Texto de Referência (${t.title}):\n${t.content}`);
      }
    });

    const fullContent = contentParts.join('\n\n---\n\n');
    onAnalyze(fullContent);
  };

  if (loadingModelings) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-800">
        <Library className="w-5 h-5" />
        <h3 className="font-medium">Selecione as modelagens para análise:</h3>
      </div>

      <div className="space-y-2">
        {modelings.map((modeling) => {
          const videoCount = videos.filter(v => v.modeling_id === modeling.id).length;
          const textCount = texts.filter(t => t.modeling_id === modeling.id).length;
          const hasCreatorIdea = !!modeling.creator_idea;

          return (
            <div 
              key={modeling.id}
              className={`
                border rounded-lg p-3 cursor-pointer transition-all
                ${selectedIds.includes(modeling.id) 
                  ? 'border-amber-400 bg-amber-50' 
                  : 'border-slate-200 hover:border-amber-200'}
              `}
              onClick={() => toggleSelection(modeling.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={selectedIds.includes(modeling.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{modeling.title}</p>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    {videoCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" /> {videoCount} vídeo(s)
                      </span>
                    )}
                    {textCount > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {textCount} texto(s)
                      </span>
                    )}
                    {hasCreatorIdea && (
                      <span className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Com notas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={handleAnalyze}
          disabled={selectedIds.length === 0}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analisar Selecionadas
        </Button>
      </div>
    </div>
  );
}