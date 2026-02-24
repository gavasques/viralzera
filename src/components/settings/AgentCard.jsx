import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Brain, Bot } from "lucide-react";

export default function AgentCard({ agent, config, onClick }) {
  const IconComponent = agent.icon;

  // Extrai nome do modelo (simplificado)
  const getModelShortName = (modelId) => {
    if (!modelId) return null;
    // Pega só a parte após a barra (ex: "openai/gpt-4o" -> "gpt-4o")
    const parts = modelId.split('/');
    return parts[parts.length - 1];
  };

  // All settings are stored inside config.config (JSON blob)
  const cfg = config?.config || {};
  const modelName = cfg.model_name || cfg.model1_name || cfg.search_model_name || cfg.ocr_model_name ||
                    getModelShortName(cfg.model || cfg.model1 || cfg.search_model || cfg.ocr_model);
  const hasWebSearch = cfg.enable_web_search;
  const hasReasoning = cfg.enable_reasoning;

  // Use custom title/description if available
  const displayTitle = cfg.custom_title || agent.title;
  const displayDescription = cfg.custom_description || agent.description;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${agent.color} text-white shrink-0`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {displayTitle}
            </h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {displayDescription}
            </p>
          </div>
        </div>
        
        {/* Status do Agente */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {modelName ? (
            <Badge variant="secondary" className="text-xs font-normal gap-1 bg-slate-100 text-slate-600">
              <Bot className="w-3 h-3" />
              {modelName}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-normal text-amber-600 border-amber-200 bg-amber-50">
              Não configurado
            </Badge>
          )}
          
          {hasWebSearch && (
            <Badge className="text-xs font-normal gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
              <Globe className="w-3 h-3" />
              Web
            </Badge>
          )}
          
          {hasReasoning && (
            <Badge className="text-xs font-normal gap-1 bg-purple-100 text-purple-700 hover:bg-purple-100">
              <Brain className="w-3 h-3" />
              Reasoning
            </Badge>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t flex justify-end">
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}