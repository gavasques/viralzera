import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  FileText,
  Film,
  Layers,
  Smartphone,
  Image as ImageIcon,
  Video,
  AlignLeft,
  BookOpen
} from "lucide-react";

export default function PostTypeCard({ 
  type, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  onOpenList, 
  onAddExample 
}) {
  const getFormatIcon = (format) => {
    switch (format) {
      case 'Reels': return <Film className="w-4 h-4" />;
      case 'Carrossel': return <Layers className="w-4 h-4" />;
      case 'Story': return <Smartphone className="w-4 h-4" />;
      case 'Video': return <Video className="w-4 h-4" />;
      case 'Thread': return <AlignLeft className="w-4 h-4" />;
      case 'Article': return <BookOpen className="w-4 h-4" />;
      default: return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getFormatColor = (format) => {
    switch (format) {
      case 'Reels': return "bg-pink-100 text-pink-700 border-pink-200";
      case 'Carrossel': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'Story': return "bg-purple-100 text-purple-700 border-purple-200";
      case 'Video': return "bg-red-100 text-red-700 border-red-200";
      case 'Thread': return "bg-slate-100 text-slate-700 border-slate-200";
      case 'Article': return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card className={`flex flex-col hover:shadow-md transition-all group ${type.is_active === false ? 'opacity-60 bg-slate-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`gap-1.5 font-normal w-fit ${getFormatColor(type.format)}`}>
                {getFormatIcon(type.format)}
                {type.format || 'Post'}
              </Badge>
              {type.is_active === false && (
                <Badge variant="secondary" className="text-[10px] h-5 bg-slate-200 text-slate-600">
                  <EyeOff className="w-3 h-3 mr-1" />
                  Inativo
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight">{type.title}</CardTitle>
          </div>
          <div className="flex gap-1 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${type.is_active === false ? 'text-slate-400 hover:text-emerald-600' : 'text-emerald-500 hover:text-slate-400'}`}
              onClick={() => onToggleStatus(type)}
              title={type.is_active === false ? 'Ativar' : 'Inativar'}
            >
              {type.is_active === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => onEdit(type)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => onDelete(type.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {type.description && <CardDescription className="line-clamp-2 mt-2 text-xs">{type.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Detailed Fields Preview */}
        <div className="grid grid-cols-2 gap-2">
          {type.character_limit && (
             <div className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
               <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">Limite</span>
               <span className="text-xs font-medium text-slate-700 block truncate" title={type.character_limit}>{type.character_limit}</span>
             </div>
          )}
          {(type.creation_instructions || type.content_structure) && (
             <div className="bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
               <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">Detalhes</span>
               <span className="text-xs font-medium text-slate-700 block">Preenchido</span>
             </div>
          )}
        </div>

        <div className="pt-2">
          <Button 
              variant="link" 
              className="p-0 h-auto text-slate-500 hover:text-indigo-600 flex items-center gap-2"
              onClick={() => onOpenList(type)}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">{type.examples?.length || 0} Exemplos cadastrados</span>
            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-1">Ver todos</span>
          </Button>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="secondary" 
          className="w-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
          onClick={() => onAddExample(type)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Exemplo
        </Button>
      </CardFooter>
    </Card>
  );
}