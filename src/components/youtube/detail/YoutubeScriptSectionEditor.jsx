import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RefinerButton from "@/components/youtube/refiner/RefinerButton";

// Basic Markdown to HTML converter
const markdownToHtml = (text) => {
  if (!text) return '';
  
  // Check if it looks like HTML already (basic check)
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  let html = text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Line breaks
    .replace(/\n/gim, '<br>');

  return html;
};

export default function YoutubeScriptSectionEditor({ 
  sectionKey,
  title, 
  description,
  content, 
  onChange,
  onOpenRefiner
}) {
  // Memoize initial content conversion to avoid re-rendering issues/loops with Quill
  // But we need to handle external updates if content changes from outside (e.g. refiner)
  // Quill handles value prop changes, but we need to be careful not to convert HTML back to Markdown here
  // because we are switching to HTML storage implicitly by using Quill.
  
  // However, if the content comes as Markdown (from generator), we need to convert it.
  // If it comes as HTML (from previous save), we keep it.
  const displayContent = useMemo(() => {
    return markdownToHtml(content);
  }, [content]);

  // Strip HTML for char count
  const plainText = content?.replace(/<[^>]*>/g, '') || '';
  const charCount = plainText.length;
  
  // Estimativa simples: ~150 palavras por minuto de fala, ~5 caracteres por palavra
  const estimatedSeconds = Math.round((charCount / 5) / 150 * 60);
  const estimatedTime = estimatedSeconds < 60 
    ? `~${estimatedSeconds}s`
    : `~${Math.round(estimatedSeconds / 60)}min`;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                {title}
              </CardTitle>
              {description && (
                <p className="text-sm text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
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
            <RefinerButton onClick={() => onOpenRefiner(sectionKey)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <style>{`
          .ql-container {
            font-size: 1.1rem;
          }
          .ql-editor {
            font-size: 1.1rem;
            line-height: 1.75;
          }
        `}</style>
        <div className="h-[600px] mb-12">
          <ReactQuill
            theme="snow"
            value={displayContent}
            onChange={(val) => onChange(sectionKey, val)}
            placeholder={`Escreva o conteúdo da seção ${title}...`}
            className="h-full"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
              ],
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}