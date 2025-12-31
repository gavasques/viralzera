import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function YoutubeScriptSectionEditor({ 
  sectionKey,
  title, 
  description,
  content, 
  onChange 
}) {
  const charCount = content?.length || 0;
  
  // Estimativa simples: ~150 palavras por minuto de fala, ~5 caracteres por palavra
  const estimatedSeconds = Math.round((charCount / 5) / 150 * 60);
  const estimatedTime = estimatedSeconds < 60 
    ? `~${estimatedSeconds}s`
    : `~${Math.round(estimatedSeconds / 60)}min`;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {charCount.toLocaleString()} chars
            </Badge>
            {charCount > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                {estimatedTime}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Textarea
          value={content}
          onChange={(e) => onChange(sectionKey, e.target.value)}
          placeholder={`Escreva o conteúdo da seção ${title}...`}
          className="min-h-[200px] resize-y text-sm leading-relaxed"
        />
      </CardContent>
    </Card>
  );
}