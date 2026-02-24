import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

// Pricing aproximado por modelo (por 1K tokens) - input/output
const MODEL_PRICING = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'deepseek-chat': { input: 0.00014, output: 0.00028 },
  'deepseek-r1': { input: 0.00055, output: 0.00219 },
  'llama-3.3-70b': { input: 0.00012, output: 0.0003 },
  'default': { input: 0.001, output: 0.002 }
};

function getModelPricing(modelId) {
  const modelName = modelId?.toLowerCase() || '';
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelName.includes(key.toLowerCase())) return pricing;
  }
  return MODEL_PRICING.default;
}

export default function ModelCostRanking({ logs }) {
  // Calcular custo por modelo
  const modelCosts = React.useMemo(() => {
    const byModel = {};
    
    logs.forEach(log => {
      const model = log.model || 'unknown';
      if (!byModel[model]) {
        byModel[model] = { 
          model, 
          shortName: model.split('/').pop() || model,
          promptTokens: 0, 
          completionTokens: 0,
          reasoningTokens: 0,
          calls: 0,
          cost: 0 
        };
      }
      
      const pricing = getModelPricing(model);
      const promptCost = ((log.prompt_tokens || 0) / 1000) * pricing.input;
      const completionCost = ((log.completion_tokens || 0) / 1000) * pricing.output;
      const reasoningCost = ((log.reasoning_tokens || 0) / 1000) * pricing.output * 1.5; // Reasoning mais caro
      
      byModel[model].promptTokens += log.prompt_tokens || 0;
      byModel[model].completionTokens += log.completion_tokens || 0;
      byModel[model].reasoningTokens += log.reasoning_tokens || 0;
      byModel[model].calls += 1;
      byModel[model].cost += promptCost + completionCost + reasoningCost;
    });
    
    return Object.values(byModel)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);
  }, [logs]);

  const maxCost = modelCosts[0]?.cost || 1;

  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          Custo por Modelo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {modelCosts.map((model, idx) => (
            <div key={model.model} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                    ${idx === 0 ? 'bg-amber-100 text-amber-700' : 
                      idx === 1 ? 'bg-slate-100 text-slate-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-500'}
                  `}>
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-700 text-sm truncate">{model.shortName}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">{model.calls} calls</span>
                  <span className="font-bold text-emerald-600 text-sm min-w-[70px] text-right">
                    ${model.cost.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all"
                  style={{ width: `${(model.cost / maxCost) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}