import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Instagram, Search, Eye, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = 'https://webhook.guivasques.app/webhook/9c5caeb2-5742-4575-af82-a4cca3a8d6ed';

export default function InstagramImporter({ onImport, postTypeFormat }) {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [postData, setPostData] = useState(null);

  const handleFetchPost = async () => {
    if (!instagramUrl.trim()) {
      toast.error('Cole a URL do post do Instagram');
      return;
    }

    setIsLoading(true);
    setPostData(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramUrl.trim() })
      });

      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Aguarde alguns segundos e tente novamente');
      }

      const data = JSON.parse(text);
      const post = Array.isArray(data) ? data[0] : data;
      
      if (!post || !post.id) {
        throw new Error('Post não encontrado');
      }

      setPostData(post);
      toast.success('Dados do post carregados!');
    } catch (error) {
      toast.error('Erro: ' + error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!postData) return;

    // Detectar tipo de post baseado nos dados retornados
    const isReels = postData.transcricao !== undefined; // Reels tem transcricao
    const isCarrossel = postData.carrosseis && postData.carrosseis.length > 0;

    let formattedContent = '';

    if (isReels) {
      // Formato Reels
      formattedContent = `TEXTO SOBREPOSTO (OCR First Frame):
${postData.ocr_first_frame || '(Sem texto)'}

---

TRANSCRIÇÃO DO ÁUDIO:
${postData.transcricao && postData.transcricao !== 'Não tem Texto' ? postData.transcricao : '(Sem transcrição/áudio)'}

---

DESCRIÇÃO/LEGENDA:
${postData.desscricao || '(Sem legenda)'}

---

MÉTRICAS:
Likes: ${postData.likes || 0}
Views: ${postData.views || 0}

AUTOR: @${postData.username || 'desconhecido'}

IMAGEM (First Frame):
${postData.firstframe || ''}`;

    } else if (isCarrossel) {
      // Formato Carrossel
      const slidesContent = postData.carrosseis
        .map(slide => `[Slide ${slide.carrossel}]\n${slide.texto}`)
        .join('\n\n---\n\n');

      formattedContent = `CONTEÚDO DOS SLIDES:

${slidesContent}

---

DESCRIÇÃO/LEGENDA:
${postData.desscricao || '(Sem legenda)'}

---

MÉTRICAS:
Likes: ${postData.likes || 0}
Comentários: ${postData.comentarios || 0}
${postData.views ? `Views: ${postData.views}` : ''}

AUTOR: @${postData.username || 'desconhecido'}`;

    } else {
      // Formato genérico (Post único)
      formattedContent = `CONTEÚDO:
${postData.desscricao || '(Sem conteúdo)'}

---

MÉTRICAS:
Likes: ${postData.likes || 0}
Comentários: ${postData.comentarios || 0}

AUTOR: @${postData.username || 'desconhecido'}`;
    }

    onImport({
      content: formattedContent,
      comment: `Importado do Instagram: ${instagramUrl}`,
      source_type: 'third_party'
    });
    
    toast.success('Exemplo importado!');
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  // Detectar tipo de post
  const isReels = postData?.transcricao !== undefined;
  const isCarrossel = postData?.carrosseis && postData.carrosseis.length > 0;

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-pink-500" />
          URL do Post do Instagram
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://www.instagram.com/p/ABC123..."
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleFetchPost} 
            disabled={isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Post Data Preview */}
      {postData && (
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
          <CardContent className="p-4 space-y-4">
            {/* Header com autor */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-white">
                @{postData.username}
              </Badge>
              <Badge className={isReels ? 'bg-red-100 text-red-700' : isCarrossel ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}>
                {isReels ? 'Reels' : isCarrossel ? `Carrossel (${postData.carrosseis.length} slides)` : 'Post'}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-medium">{formatNumber(postData.likes)}</span>
              </div>
              {postData.views && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{formatNumber(postData.views)}</span>
                </div>
              )}
              {postData.comentarios && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{formatNumber(postData.comentarios)}</span>
                </div>
              )}
            </div>

            {/* First Frame (Reels) */}
            {isReels && postData.firstframe && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">First Frame</Label>
                <img 
                  src={postData.firstframe} 
                  alt="First Frame" 
                  className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}

            {/* OCR / Texto Sobreposto (Reels) */}
            {isReels && postData.ocr_first_frame && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Texto Sobreposto (OCR)</Label>
                <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 font-medium">
                  {postData.ocr_first_frame}
                </p>
              </div>
            )}

            {/* Transcrição (Reels) */}
            {isReels && postData.transcricao && postData.transcricao !== 'Não tem Texto' && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Transcrição do Áudio</Label>
                <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 max-h-24 overflow-y-auto">
                  {postData.transcricao}
                </p>
              </div>
            )}

            {/* Slides do Carrossel */}
            {isCarrossel && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Conteúdo dos Slides</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {postData.carrosseis.map((slide, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-slate-100">
                      <Badge variant="outline" className="mb-1 text-[10px]">Slide {slide.carrossel}</Badge>
                      <p className="text-xs text-slate-700">{slide.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption Preview */}
            {postData.desscricao && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Legenda/Descrição</Label>
                <p className="text-sm text-slate-700 line-clamp-4 bg-white p-2 rounded border border-slate-100">
                  {postData.desscricao}
                </p>
              </div>
            )}

            {/* Import Button */}
            <Button 
              onClick={handleImport}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={!postData}
            >
              <Instagram className="w-4 h-4 mr-2" />
              Importar como Exemplo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}