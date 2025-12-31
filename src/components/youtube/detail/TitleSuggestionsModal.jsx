import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TitleSuggestionsModal({ 
  open, 
  onOpenChange, 
  scriptId, 
  onTitleSelected 
}) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [titles, setTitles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateTitles = async () => {
    setIsLoading(true);
    setTitles([]);
    setSelectedIndex(null);

    try {
      const response = await base44.functions('youtubeTitleGenerator', {
        scriptId
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao gerar títulos');
      }

      setTitles(response.data.titles || []);
    } catch (error) {
      console.error('Error generating titles:', error);
      toast.error(error.message || 'Erro ao gerar títulos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTitle = async (title, index) => {
    setSelectedIndex(index);
    setIsSaving(true);

    try {
      await base44.entities.YoutubeScript.update(scriptId, { title });
      queryClient.invalidateQueries({ queryKey: ['youtube-script', scriptId] });
      onTitleSelected(title);
      toast.success('Título atualizado!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Erro ao atualizar título');
    } finally {
      setIsSaving(false);
      setSelectedIndex(null);
    }
  };

  // Gera títulos quando o modal abre
  React.useEffect(() => {
    if (open && titles.length === 0) {
      generateTitles();
    }
  }, [open]);

  // Reset ao fechar
  React.useEffect(() => {
    if (!open) {
      setTitles([]);
      setSelectedIndex(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Sugestões de Títulos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-sm text-slate-500">Gerando títulos...</p>
            </div>
          ) : titles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-slate-500">Nenhum título gerado ainda.</p>
              <Button onClick={generateTitles} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Títulos
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {titles.map((title, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      "hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    <p className="text-sm font-medium text-slate-700 flex-1 pr-3">
                      {title}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUseTitle(title, index)}
                      disabled={isSaving}
                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isSaving && selectedIndex === index ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Usar
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateTitles}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novos Títulos
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}