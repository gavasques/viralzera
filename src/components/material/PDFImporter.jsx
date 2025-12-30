import React, { useState, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, Loader2, FileText, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_PROMPT = `Analise o documento PDF fornecido e extraia as seguintes informações:

1. **Título sugerido**: Um título claro e descritivo para este material
2. **Resumo**: Um resumo conciso do que se trata o documento
3. **Lista de Tópicos**: Liste todos os principais tópicos, conceitos e assuntos abordados no documento, organizados de forma hierárquica quando aplicável

Formato de resposta esperado:
- Seja objetivo e direto
- Liste os tópicos de forma clara e organizada
- Inclua detalhes relevantes de cada tópico quando disponível`;

export default function PDFImporter({ open, onOpenChange, focusId, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('upload'); // upload, analyzing, result
  const [result, setResult] = useState({ title: '', content: '' });
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch MaterialBank config (global - único para todos os usuários)
  const { data: config } = useQuery({
    queryKey: ['materialBankConfig', 'global'],
    queryFn: async () => {
      const configs = await base44.entities.MaterialBankConfig.list('-created_date', 1);
      return configs[0] || null;
    }
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.pdf$/i)) {
      toast.error("Por favor, selecione um arquivo PDF");
      return;
    }

    setIsProcessing(true);
    setStep('analyzing');
    setError(null);

    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Get prompt from config or use default
      const prompt = config?.prompt || DEFAULT_PROMPT;

      // Use InvokeLLM with uploaded file URL - it handles PDF extraction
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [file_url]
      });

      // Log usage manually
      const currentUser = await base44.auth.me();
      if (currentUser) {
        await base44.entities.UsageLog.create({
          user_email: currentUser.email,
          feature: 'pdf_import',
          model: 'gpt-4o',
          model_name: 'PDF Analyzer',
          total_tokens: 0,
          success: true,
          focus_id: focusId
        });
      }

      // Try to extract title from response
      let title = file.name.replace('.pdf', '');
      
      // Try multiple patterns to extract title
      const patterns = [
        /\*\*?\s*\d*\.?\s*Título[^:]*:\*\*?\s*\n?\s*\*?\s*(.+)/i,
        /Título[^:]*:\*\*\s*\n?\s*\*?\s*(.+)/i,
        /Título[^:]*:\s*\n?\s*(.+)/i,
        /\*\s+(.+?)\n/  // Catches "* Title" pattern
      ];
      
      for (const pattern of patterns) {
        const match = aiResponse.match(pattern);
        if (match && match[1]) {
          const extractedTitle = match[1].trim().replace(/^\*+|\*+$/g, '').trim();
          if (extractedTitle && extractedTitle.length > 2 && extractedTitle !== '**') {
            title = extractedTitle;
            break;
          }
        }
      }

      setResult({
        title: title,
        content: aiResponse
      });
      setStep('result');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao processar PDF');
      setStep('upload');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!result.title || !result.content) {
      toast.error("Preencha o título e conteúdo");
      return;
    }

    setIsProcessing(true);
    try {
      await base44.entities.Material.create({
        title: result.title,
        content: result.content,
        focus_id: focusId
      });
      toast.success("Material criado com sucesso!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      toast.error("Erro ao salvar material");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setResult({ title: '', content: '' });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-indigo-600" />
            Importar PDF
          </DialogTitle>
          <DialogDescription>
            Faça upload de um PDF para análise automática com IA
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'upload' && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-indigo-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-indigo-50 p-4 rounded-full">
                    <FileText className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Clique para selecionar PDF</p>
                    <p className="text-sm text-slate-500 mt-1">A IA irá analisar e extrair os tópicos</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Erro ao processar</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}


            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="bg-indigo-100 p-6 rounded-full">
                  <Sparkles className="w-10 h-10 text-indigo-600" />
                </div>
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin absolute -bottom-1 -right-1" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700">Analisando PDF...</p>
                <p className="text-sm text-slate-500">A IA está extraindo os tópicos do documento</p>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">Análise concluída!</p>
                  <p className="text-sm text-emerald-700">Revise e edite o conteúdo antes de salvar.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={result.title}
                  onChange={(e) => setResult({ ...result, title: e.target.value })}
                  placeholder="Título do material"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between">
                  <span>Conteúdo Extraído</span>
                  <span className="text-xs text-slate-400">{result.content.length}/10000</span>
                </label>
                <Textarea
                  value={result.content}
                  onChange={(e) => setResult({ ...result, content: e.target.value })}
                  className="min-h-[300px] font-mono text-sm"
                  maxLength={10000}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          {step === 'result' && (
            <Button 
              onClick={handleSave} 
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Material
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}