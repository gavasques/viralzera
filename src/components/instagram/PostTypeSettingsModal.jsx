import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PostTypeSettingsModal({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [ocrModel, setOcrModel] = useState("");
  const [ocrModelName, setOcrModelName] = useState("");
  const [analysisModel, setAnalysisModel] = useState("");
  const [analysisModelName, setAnalysisModelName] = useState("");

  const { data: config, isLoading } = useQuery({
    queryKey: ["postTypeConfig"],
    queryFn: async () => {
      const configs = await base44.entities.PostTypeConfig.list();
      return configs[0] || null;
    },
    enabled: open,
  });

  useEffect(() => {
    if (config) {
      setOcrModel(config.ocr_model || "");
      setOcrModelName(config.ocr_model_name || "");
      setAnalysisModel(config.analysis_model || "");
      setAnalysisModelName(config.analysis_model_name || "");
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config?.id) {
        return base44.entities.PostTypeConfig.update(config.id, data);
      } else {
        return base44.entities.PostTypeConfig.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postTypeConfig"] });
      toast.success("Configurações salvas com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ocr_model: ocrModel,
      ocr_model_name: ocrModelName,
      analysis_model: analysisModel,
      analysis_model_name: analysisModelName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de OCR e Análise</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo OCR (Visão)</Label>
              <Input
                value={ocrModel}
                onChange={(e) => setOcrModel(e.target.value)}
                placeholder="ex: openai/gpt-4o"
              />
              <Input
                value={ocrModelName}
                onChange={(e) => setOcrModelName(e.target.value)}
                placeholder="Nome amigável do modelo"
              />
            </div>

            <div className="space-y-2">
              <Label>Modelo de Análise</Label>
              <Input
                value={analysisModel}
                onChange={(e) => setAnalysisModel(e.target.value)}
                placeholder="ex: openai/gpt-4o"
              />
              <Input
                value={analysisModelName}
                onChange={(e) => setAnalysisModelName(e.target.value)}
                placeholder="Nome amigável do modelo"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}