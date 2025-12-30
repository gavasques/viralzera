import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, User, Package, Save, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { 
  extractJsonFromContent, 
  detectJsonType, 
  normalizeAudienceData,
  normalizePersonaData,
  normalizeProductData 
} from './useJsonExtractor';

/**
 * Componente botão que detecta JSON na mensagem e permite salvar na entidade correspondente
 */
export default function SaveFromChatButton({ 
  content, 
  focusId, 
  onSaved,
  className = '' 
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedItems, setSavedItems] = useState([]);

  // Detecta JSON e tipo
  const detection = useMemo(() => {
    const json = extractJsonFromContent(content);
    if (!json) return null;
    
    const type = detectJsonType(json);
    if (!type) return null;
    
    return { json, type };
  }, [content]);

  if (!detection || !focusId) return null;

  const { json, type } = detection;

  const getTypeInfo = () => {
    switch (type) {
      case 'audience':
      case 'audience_list':
        const audiences = normalizeAudienceData(json, focusId);
        return {
          icon: Users,
          label: `Salvar ${audiences.length} Público(s)`,
          color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
          entity: 'Audience',
          data: audiences,
          count: audiences.length
        };
      case 'persona':
        return {
          icon: User,
          label: 'Salvar Persona',
          color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
          entity: 'Persona',
          data: [normalizePersonaData(json, focusId)],
          count: 1
        };
      case 'product':
        return {
          icon: Package,
          label: 'Salvar Produto',
          color: 'text-green-600 bg-green-50 hover:bg-green-100',
          entity: 'Product',
          data: [normalizeProductData(json, focusId)],
          count: 1
        };
      default:
        return null;
    }
  };

  const typeInfo = getTypeInfo();
  if (!typeInfo) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSavedItems([]);

    try {
      const results = [];
      
      for (const item of typeInfo.data) {
        const result = await base44.entities[typeInfo.entity].create(item);
        results.push(result);
        setSavedItems(prev => [...prev, item.name || item.nome || 'Item']);
      }

      toast.success(`${results.length} ${typeInfo.entity === 'Audience' ? 'público(s)' : typeInfo.entity === 'Persona' ? 'persona(s)' : 'produto(s)'} salvo(s) com sucesso!`);
      setShowConfirm(false);
      onSaved?.(results);
    } catch (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const Icon = typeInfo.icon;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${typeInfo.color} ${className}`}
        onClick={() => setShowConfirm(true)}
      >
        <Save className="w-3.5 h-3.5 mr-1" />
        {typeInfo.label}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              Confirmar Salvamento
            </DialogTitle>
            <DialogDescription>
              Foram detectados dados estruturados na resposta da IA.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {typeInfo.entity === 'Audience' ? 'Públicos-Alvo' : 
                   typeInfo.entity === 'Persona' ? 'Persona' : 'Produto'}
                </span>
                <Badge variant="secondary">{typeInfo.count} item(s)</Badge>
              </div>

              {/* Preview dos itens */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {typeInfo.data.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200"
                  >
                    {savedItems.includes(item.name || item.nome) ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    ) : isSaving ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.name || item.nome || 'Item'}
                      </p>
                      {item.funnel_stage && (
                        <p className="text-xs text-slate-500">{item.funnel_stage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                Os dados serão salvos no cadastro. Você poderá editá-los depois na página correspondente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}