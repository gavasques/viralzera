import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const VIDEO_TYPE_COLORS = {
  tutorial: "bg-blue-100 text-blue-700",
  lista: "bg-purple-100 text-purple-700",
  dica_rapida: "bg-green-100 text-green-700",
  estudo_caso: "bg-amber-100 text-amber-700",
  comparacao: "bg-pink-100 text-pink-700",
  explicacao_conceito: "bg-indigo-100 text-indigo-700",
  desmistificacao: "bg-red-100 text-red-700",
  novidade: "bg-cyan-100 text-cyan-700",
  problema_solucao: "bg-orange-100 text-orange-700",
  historia_pessoal: "bg-violet-100 text-violet-700",
};

const STATUS_COLORS = {
  Rascunho: "bg-slate-100 text-slate-700",
  Finalizado: "bg-green-100 text-green-700",
  Publicado: "bg-blue-100 text-blue-700",
};

export default function YoutubeScriptHeader({ 
  title, 
  videoType, 
  status, 
  onTitleChange, 
  onSave, 
  isSaving,
  hasChanges,
  onSuggestTitles
}) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-6 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(createPageUrl('YoutubeScripts'))}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-xl font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-1"
            placeholder="Título do roteiro..."
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSuggestTitles}
            className="shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Sugerir Títulos
          </Button>
        </div>

        {/* Right side - Badges and save button */}
        <div className="flex items-center gap-3 shrink-0">
          {videoType && (
            <Badge className={VIDEO_TYPE_COLORS[videoType] || "bg-slate-100 text-slate-700"}>
              {videoType.replace(/_/g, ' ')}
            </Badge>
          )}
          
          {status && (
            <Badge className={STATUS_COLORS[status] || "bg-slate-100 text-slate-700"}>
              {status}
            </Badge>
          )}

          <Button 
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {hasChanges ? 'Salvar Alterações' : 'Salvo'}
          </Button>
        </div>
      </div>
    </div>
  );
}